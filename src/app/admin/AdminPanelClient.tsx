"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminPanelClient({ initialUsers }: { initialUsers: any[] }) {
    const [usersList, setUsersList] = useState(initialUsers);

    const handleUpdateStatus = async (userId: string, status: "approved" | "rejected") => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, status }),
            });

            if (res.ok) {
                setUsersList(usersList.map(u => u.id === userId ? { ...u, status } : u));
            }
        } catch (err) {
            console.error("Failed to update user status", err);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/dashboard" className="link">← Back to Dashboard</Link>
            </div>

            <div className="card" style={{ maxWidth: 'none', padding: '1.5rem' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem', color: '#94a3b8' }}>User</th>
                                <th style={{ padding: '1rem', color: '#94a3b8' }}>Joined</th>
                                <th style={{ padding: '1rem', color: '#94a3b8' }}>Role</th>
                                <th style={{ padding: '1rem', color: '#94a3b8' }}>Status</th>
                                <th style={{ padding: '1rem', color: '#94a3b8' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No users found.</td>
                                </tr>
                            ) : (
                                usersList.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: user.role === 'admin' ? '#6366f1' : '#334155' }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: user.status === 'approved' ? 'var(--accent)' : user.status === 'pending' ? '#f59e0b' : 'var(--error)'
                                            }}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            {user.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(user.id, 'approved')}
                                                    className="button"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--accent)', width: 'auto' }}
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {user.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                                    className="button"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--error)', width: 'auto' }}
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
