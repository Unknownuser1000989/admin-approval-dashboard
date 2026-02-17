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
            // Reduced to 5000 chars (~1500 tokens) to fit in smaller context windows (8k)
            context += `\n--- Document: ${doc.title} ---\n${doc.content.substring(0, 5000)}\n`;
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

        const models = [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "deepseek/deepseek-r1:free",
            "meta-llama/llama-3.2-3b-instruct:free",
            "mistralai/mistral-7b-instruct:free"
        ];

        let answer = "";
        const errors: any[] = [];

        for (const model of models) {
            try {
                console.log(`Attempting chat with model: ${model}`);
                const completion = await openai.chat.completions.create({
                    messages: [
                        { role: "user", content: `${systemPrompt}\n\nUser Question: ${message}` },
                    ],
                    model: model,
                }, {
                    headers: {
                        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
                        "X-Title": "Admin Approval Dashboard",
                    }
                });

                if (completion && completion.choices && completion.choices.length > 0) {
                    answer = completion.choices[0].message.content || "";
                    break; // Success
                }
            } catch (err: any) {
                console.warn(`Model ${model} failed:`, err.message);
                errors.push({ model, message: err.message, status: err.response?.status, data: err.response?.data });
                // Continue to next model
            }
        }

        if (!answer) {
            console.warn("All models failed. Switching to Offline Fallback Mode.");

            // Offline/Fallback Logic
            const lowerCaseMessage = message.toLowerCase();

            // 1. Simple Summarization Logic
            if (lowerCaseMessage.includes("summarize") || lowerCaseMessage.includes("summary") || lowerCaseMessage.includes("tell me about")) {
                answer = "I am unable to reach the AI models right now, but here is a summary based on the documents:\n\n";
                docs.forEach(doc => {
                    answer += `**${doc.title}**:\n${doc.content.substring(0, 500)}...\n\n`;
                });
            }
            // 2. Keyword Search Logic
            else {
                const keywords = lowerCaseMessage.split(" ").filter((w: string) => w.length > 3); // Filter short words
                let matches: string[] = [];

                docs.forEach(doc => {
                    const sentences = doc.content.split(/[.!?\n]/);
                    sentences.forEach(sentence => {
                        const lowerSentence = sentence.toLowerCase();
                        // Check if at least one keyword matches
                        if (keywords.some((k: string) => lowerSentence.includes(k))) {
                            matches.push(`...${sentence.trim()}... (from ${doc.title})`);
                        }
                    });
                });

                if (matches.length > 0) {
                    // Limit to top 5 matches to avoid spam
                    answer = "I am running in offline mode. Here are some relevant excerpts I found:\n\n" + matches.slice(0, 5).join("\n\n");
                } else {
                    answer = "I am running in offline mode and couldn't find specific matches for your query. Please try asking for a 'summary'.";
                }
            }

            // Append a disclaimer
            answer += "\n\n*(Generated in Offline Mode due to AI provider unavailability)*";
        }

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
