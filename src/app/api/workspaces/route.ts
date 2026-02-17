import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { eq, desc } from "drizzle-orm"; // Added desc for ordering

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userWorkspaces = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, session.user.id))
        .orderBy(desc(workspaces.createdAt));

    return NextResponse.json(userWorkspaces);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [newWorkspace] = await db
        .insert(workspaces)
        .values({
            name,
            userId: session.user.id,
        })
        .returning();

    return NextResponse.json(newWorkspace);
}
