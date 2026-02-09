import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, status } = await req.json();

        if (!userId || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await db.update(users)
            .set({ status })
            .where(eq(users.id, userId));

        return NextResponse.json({ message: "Status updated successfully" });

    } catch (error) {
        console.error("Admin action error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
