import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import WorkspaceManager from "@/components/WorkspaceManager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const userWorkspaces = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, session.user.id))
        .orderBy(desc(workspaces.createdAt));

    return (
        <div className="container" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '2rem' }}>
            <nav style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/dashboard" className="link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>←</span> Back to Dashboard
                </Link>
            </nav>

            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>My Workspaces</h1>
                <p style={{ color: '#94a3b8' }}>Manage your document collections and chat with them.</p>
            </header>

            <WorkspaceManager initialWorkspaces={userWorkspaces} />
        </div>
    );
}
