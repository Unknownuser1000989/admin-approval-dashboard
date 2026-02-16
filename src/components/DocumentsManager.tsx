"use client";

import { useState, useEffect } from "react";
import DocumentUpload from "./DocumentUpload";
import ChatInterface from "./ChatInterface";
import { useRouter } from "next/navigation";

interface Document {
    id: string;
    title: string;
    createdAt: Date;
}

export default function DocumentsManager({ initialDocs }: { initialDocs: Document[] }) {
    const router = useRouter();

    // We can just use initialDocs directly if the parent re-renders on router.refresh()
    // But for smoother UI, we might want local state too, but let's trust router.refresh() for now.

    const handleUploadSuccess = () => {
        router.refresh();
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
            <div>
                <DocumentUpload onUploadSuccess={handleUploadSuccess} />

                <div className="card" style={{ maxWidth: "100%" }}>
                    <h3 className="title" style={{ fontSize: "1.2rem", textAlign: "left" }}>Your Documents</h3>
                    {initialDocs.length === 0 ? (
                        <p style={{ color: "#94a3b8" }}>No documents uploaded yet.</p>
                    ) : (
                        <ul style={{ listStyle: "none" }}>
                            {initialDocs.map((doc) => (
                                <li key={doc.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                                    <div style={{ fontWeight: 500 }}>{doc.title}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div>
                <ChatInterface documents={initialDocs} />
            </div>
        </div>
    );
}
