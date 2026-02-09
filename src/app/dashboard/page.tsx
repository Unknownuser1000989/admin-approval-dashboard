import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="container" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '2rem' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: 'var(--card-bg)', padding: '1.25rem 2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Dashboard</h2>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {session.user.role === "admin" && (
                        <Link href="/admin" className="link" style={{ fontSize: '0.9rem' }}>Admin Panel</Link>
                    )}
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{session.user.email}</span>
                    <Link href="/api/auth/signout" className="button" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: 'auto' }}>Sign Out</Link>
                </div>
            </nav>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card" style={{ maxWidth: 'none' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>System Status</h3>
                    <p style={{ color: '#94a3b8' }}>Account Role: <strong style={{ color: 'white' }}>{session.user.role}</strong></p>
                    <p style={{ color: '#94a3b8' }}>Status: <strong style={{ color: 'white' }}>{session.user.status}</strong></p>
                </div>

                <div className="card" style={{ maxWidth: 'none' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Welcome to Premium Dashboard</h3>
                    <p style={{ color: '#94a3b8' }}>
                        This is a protected area only accessible to approved users. You can now access all premium features of the application.
                    </p>
                </div>
            </div>
        </div>
    );
}
