import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { documents, workspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import PDFParser from "pdf2json";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params are now a Promise in newer Next.js versions, but in 14 it might be object. Let's assume params is awaitable or object. 
    // Next 15 changes params to promise. User has "next": "16.1.6". So YES params is a Promise.
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: workspaceId } = await params;

        // Verify workspace ownership
        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, session.user.id)));

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let content = "";

        if (file.type === "application/pdf") {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const parser = new (PDFParser as any)(null, 1);
                content = await new Promise((resolve, reject) => {
                    parser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                    parser.on("pdfParser_dataReady", (pdfData: any) => {
                        // encodeURI/decodeURI logic might be needed if pdf2json returns encoded text, 
                        // but getRawTextContent usually works. 
                        // Existing code used getRawTextContent.
                        resolve(parser.getRawTextContent());
                    });
                    parser.parseBuffer(buffer);
                });
            } catch (error) {
                console.error("Error parsing PDF:", error);
                return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
            }
        } else {
            content = buffer.toString("utf-8");
        }

        // Cleanup content? pdf2json often leaves artifacting. 
        // For now we trust the existing logic.

        if (!content.trim()) {
            return NextResponse.json({ error: "File content is empty or unreadable" }, { status: 400 });
        }

        const [doc] = await db
            .insert(documents)
            .values({
                userId: session.user.id,
                workspaceId: workspaceId,
                title: file.name,
                content: content,
            })
            .returning();

        return NextResponse.json(doc);
    } catch (error) {
        console.error("Error uploading document:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
