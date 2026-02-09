const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function checkUsers() {
    try {
        const users = await sql`SELECT email, role, status FROM users`;
        console.log("Current Users:", users);
        process.exit(0);
    } catch (err) {
        console.error("Error fetching users:", err);
        process.exit(1);
    }
}

checkUsers();
