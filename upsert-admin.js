const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function upsertAdmin() {
    const email = "test@test.com";
    const password = "Test123@123";

    console.log(`Upserting admin: ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;

        if (existing.length > 0) {
            await sql`
        UPDATE users 
        SET password = ${hashedPassword}, role = 'admin', status = 'approved' 
        WHERE email = ${email}
      `;
            console.log("Admin user updated successfully.");
        } else {
            await sql`
        INSERT INTO users (email, password, role, status)
        VALUES (${email}, ${hashedPassword}, 'admin', 'approved')
      `;
            console.log("Admin user created successfully.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error upserting admin:", err);
        process.exit(1);
    }
}

upsertAdmin();
