"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Document {
    id: string;
    title: string;
    createdAt: Date;
}

interface WorkspaceDocumentsProps {
    initialDocs: Document[];
    workspaceId: string;
}

export default function WorkspaceDocuments({ initialDocs, workspaceId }: WorkspaceDocumentsProps) {
    const [docs, setDocs] = useState<Document[]>(initialDocs);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Use the new workspace-specific upload route
            const res = await fetch(`/api/workspaces/${workspaceId}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const newDoc = await res.json();
            setDocs([newDoc, ...docs]);
            router.refresh();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Upload failed");
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = "";
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0' }}>Documents ({docs.length})</h3>
                <label className="button" style={{
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                    fontSize: '0.8rem',
                    padding: '0.4rem 0.8rem',
                    width: 'auto'
                }}>
                    {uploading ? "Uploading..." : "+ Add PDF"}
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </label>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {docs.map((doc) => (
                        <li key={doc.id} style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            transition: 'background 0.2s',
                        }}
                            className="hover:bg-slate-800/50" // Assuming tailwind utility might work or just rely on CSS
                        >
                            <span style={{ fontWeight: '500', color: '#f1f5f9', wordBreak: 'break-word' }}>{doc.title}</span>
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                        </li>
                    ))}
                    {docs.length === 0 && (
                        <li style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                            No documents yet. upload a PDF to get started.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
