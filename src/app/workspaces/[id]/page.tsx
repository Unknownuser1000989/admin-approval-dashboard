import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { workspaces, documents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import WorkspaceChat from "@/components/WorkspaceChat";
import WorkspaceDocuments from "@/components/WorkspaceDocuments";

export const dynamic = "force-dynamic";

export default async function WorkspaceDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Ensure workspace exists and belongs to user
    const [workspace] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.id, id), eq(workspaces.userId, session.user.id)));

    if (!workspace) {
        notFound();
    }

    // Fetch documents for this workspace
    const docs = await db
        .select({
            id: documents.id,
            title: documents.title,
            createdAt: documents.createdAt,
        })
        .from(documents)
        .where(eq(documents.workspaceId, id))
        .orderBy(desc(documents.createdAt));

    return (
        <div className="container" style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <nav style={{ marginBottom: '1.5rem' }}>
                <Link href="/workspaces" className="link" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>← Back to Workspaces</Link>
            </nav>

            <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>{workspace.name}</h1>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar: Documents List */}
                <div style={{
                    overflowY: 'auto',
                    paddingRight: '1rem',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <WorkspaceDocuments initialDocs={docs} workspaceId={workspace.id} />
                </div>

                {/* Main Area: Chat Interface */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <WorkspaceChat workspaceId={workspace.id} />
                </div>
            </div>
        </div>
    );
}
