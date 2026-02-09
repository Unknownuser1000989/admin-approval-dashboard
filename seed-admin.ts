import * as dotenv from "dotenv";
dotenv.config();
import { db } from "./src/db";
import { users } from "./src/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
    const email = "test@test.com";
    const password = "Test123@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Seeding admin user...");

    try {
        await db.insert(users).values({
            email,
            password: hashedPassword,
            role: "admin",
            status: "approved",
        }).onConflictDoUpdate({
            target: users.email,
            set: {
                password: hashedPassword,
                role: "admin",
                status: "approved",
            },
        });

        console.log("Admin user seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin user:", error);
        process.exit(1);
    }
}

seed();
