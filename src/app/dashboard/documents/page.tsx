import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import DocumentsManager from "@/components/DocumentsManager";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const userDocs = await db
        .select({
            id: documents.id,
            title: documents.title,
            createdAt: documents.createdAt,
        })
        .from(documents)
        .where(eq(documents.userId, session.user.id))
        .orderBy(desc(documents.createdAt));

    return (
        <div className="container" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '2rem' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: 'var(--card-bg)', padding: '1.25rem 2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/dashboard" className="link" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>← Back</Link>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Document Q&A</h2>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{session.user.email}</span>
                </div>
            </nav>

            <DocumentsManager initialDocs={userDocs} />
        </div>
    );
}
