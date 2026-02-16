import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
                const parser = new PDFParser(null, 1); // 1 = text only
                content = await new Promise((resolve, reject) => {
                    parser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                    parser.on("pdfParser_dataReady", (pdfData: any) => {
                        resolve(parser.getRawTextContent());
                    });
                    parser.parseBuffer(buffer);
                });
            } catch (error) {
                console.error("Error parsing PDF:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                return NextResponse.json({ error: `Failed to parse PDF: ${errorMessage}` }, { status: 500 });
            }
        } else {
            content = buffer.toString("utf-8");
        }

        if (!content.trim()) {
            return NextResponse.json({ error: "File content is empty or unreadable" }, { status: 400 });
        }

        const [doc] = await db
            .insert(documents)
            .values({
                userId: session.user.id,
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
