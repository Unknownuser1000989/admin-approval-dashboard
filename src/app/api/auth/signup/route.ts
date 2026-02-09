import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const [existingUser] = await db.select().from(users).where(eq(users.email, email));

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // First user is admin, others are users pending approval
        const [allUsers] = await db.select().from(users).limit(1);
        const role = allUsers ? "user" : "admin";
        const status = allUsers ? "pending" : "approved";

        const [newUser] = await db.insert(users).values({
            email,
            password: hashedPassword,
            role,
            status,
        }).returning();

        return NextResponse.json({
            message: "User created successfully",
            status: newUser.status
        }, { status: 201 });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
