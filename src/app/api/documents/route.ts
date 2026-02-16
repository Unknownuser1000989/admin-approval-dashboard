import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const docs = await db
            .select({
                id: documents.id,
                title: documents.title,
                createdAt: documents.createdAt,
            })
            .from(documents)
            .where(eq(documents.userId, session.user.id))
            .orderBy(desc(documents.createdAt));

        return NextResponse.json(docs);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        // Verify document belongs to user
        const [doc] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, id));

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        if (doc.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.delete(documents).where(eq(documents.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
