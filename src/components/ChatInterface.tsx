"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Document {
    id: string;
    title: string;
}

export default function ChatInterface({ documents }: { documents: Document[] }) {
    const [selectedDoc, setSelectedDoc] = useState<string>("");
    const [message, setMessage] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSend = async () => {
        if (!selectedDoc) {
            setError("Please select a document context.");
            return;
        }
        if (!message.trim()) {
            setError("Please enter a question.");
            return;
        }

        setLoading(true);
        setError("");
        setResponse("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId: selectedDoc,
                    message: message,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to get answer");
            }

            const data = await res.json();
            setResponse(data.answer);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: "100%" }}>
            <h3 className="title" style={{ fontSize: "1.2rem", textAlign: "left" }}>Ask Questions</h3>

            <div className="form-group">
                <label className="label">Select Document Context</label>
                <select
                    className="input"
                    value={selectedDoc}
                    onChange={(e) => {
                        setSelectedDoc(e.target.value);
                        setError("");
                    }}
                    disabled={loading}
                >
                    <option value="">-- Select a document --</option>
                    {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                            {doc.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="label">Your Question</label>
                <textarea
                    className="input"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    placeholder="What is this document about?"
                />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button onClick={handleSend} className="button" disabled={loading || !selectedDoc}>
                {loading ? "Thinking..." : "Get Answer"}
            </button>

            {response && (
                <div style={{ marginTop: "2rem", padding: "1rem", background: "var(--glass)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <h4 style={{ marginBottom: "0.5rem", color: "var(--accent)" }}>Answer:</h4>
                    <div className="prose prose-invert">
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
