import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Lazy initialization or fallback for build time
const apiKey = process.env.GROQ_API_KEY || "dummy-key-for-build";
const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, documentId } = await req.json();

        if (!message || !documentId) {
            return NextResponse.json({ error: "Message and Document ID are required" }, { status: 400 });
        }

        const [doc] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId));

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        if (doc.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized access to document" }, { status: 403 });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant. Answer the user's question based ONLY on the following context:\n\n${doc.content.substring(0, 15000)}\n\n[...Content truncated due to length...]\n\nIf the answer is not in the context, say "I don't know based on the document."`,
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            model: "llama-3.1-8b-instant", // Using a free Groq model
        });

        const answer = completion.choices[0]?.message?.content || "No answer generated.";

        return NextResponse.json({ answer });
    } catch (error) {
        console.error("Error in chat:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
    }
}
