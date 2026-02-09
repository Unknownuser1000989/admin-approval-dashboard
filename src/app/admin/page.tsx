import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import AdminPanelClient from "./AdminPanelClient";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    const allUsers = await db.select().from(users).where(not(eq(users.id, session.user.id)));

    return (
        <div className="container" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 className="title" style={{ textAlign: 'left', margin: 0 }}>Admin Panel</h1>
                <AdminPanelClient initialUsers={allUsers} />
            </header>
        </div>
    );
}
