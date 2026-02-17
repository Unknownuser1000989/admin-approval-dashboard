import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { workspaces, documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: workspaceId } = await params;
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // specific workspace check
        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(
                and(
                    eq(workspaces.id, workspaceId),
                    eq(workspaces.userId, session.user.id)
                )
            );

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        // Fetch all documents in workspace
        const docs = await db
            .select({
                title: documents.title,
                content: documents.content,
            })
            .from(documents)
            .where(eq(documents.workspaceId, workspaceId));

        if (docs.length === 0) {
            return NextResponse.json({
                answer: "This workspace has no documents yet. Please upload some PDF files to start chatting.",
                citations: []
            });
        }

        // Prepare context
        // Truncate logic to avoid blowing up context if necessary, but 128k context is large.
        // Let's limit per document or total just in case.
        let context = "";
        docs.forEach(doc => {
            context += `\n--- Document: ${doc.title} ---\n${doc.content.substring(0, 30000)}\n`;
        });

        const systemPrompt = `You are an intelligent assistant helping a user with their workspace documents.
    You have access to the following documents.
    
    Instructions:
    1. Answer the user's question based ONLY on the provided documents.
    2. If the answer is not in the documents, say "I couldn't find that information in the provided documents."
    3. CITATIONS: You MUST cite your sources. When you use information from a document, mention the document title in bold, e.g. **[Document Title]**.
    4. Provide a clear, concise, and accurate answer.
    
    Documents Context:
    ${context}
    `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "user", content: `${systemPrompt}\n\nUser Question: ${message}` },
            ],
            model: "google/gemini-2.0-pro-exp-02-05:free",
        });

        const answer = completion.choices[0].message.content;

        // improved citation extraction (naive)
        const citationRegex = /\*\*\[(.*?)\]\*\*/g;
        const matches = [...(answer?.matchAll(citationRegex) || [])];
        const citations = [...new Set(matches.map(m => m[1]))]; // Unique titles

        return NextResponse.json({
            answer,
            citations
        });

    } catch (error: any) {
        console.error("Error in workspace chat:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
        }
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
