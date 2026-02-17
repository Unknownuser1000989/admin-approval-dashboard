"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Workspace {
    id: string;
    name: string;
    createdAt: Date;
    userId: string;
}

interface WorkspaceManagerProps {
    initialWorkspaces: Workspace[];
}

export default function WorkspaceManager({ initialWorkspaces }: WorkspaceManagerProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const createWorkspace = async () => {
        if (!newWorkspaceName.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWorkspaceName }),
            });

            if (!res.ok) throw new Error("Failed to create workspace");

            const workspace = await res.json();
            // Ensure date string is converted to Date object if needed, though JSON returns string
            // For display we can handle string or Date
            setWorkspaces([workspace, ...workspaces]);
            setNewWorkspaceName("");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to create workspace");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="New Workspace Name"
                    className="input"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'white' }}
                    onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                />
                <button
                    onClick={createWorkspace}
                    className="button"
                    disabled={isLoading}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {isLoading ? "Creating..." : "Create Workspace"}
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {workspaces.map((ws) => (
                    <div
                        key={ws.id}
                        className="card"
                        onClick={() => router.push(`/workspaces/${ws.id}`)}
                        style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, border-color 0.2s',
                            border: '1px solid var(--border)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem' }}>{ws.name}</h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                            Created: {new Date(ws.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                ))}

                {workspaces.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                        <p>No workspaces yet. Create one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
