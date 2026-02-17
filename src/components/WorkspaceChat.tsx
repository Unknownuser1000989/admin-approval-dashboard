"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: string[]; // Array of source titles or snippets
}

export default function WorkspaceChat({ workspaceId }: { workspaceId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.content }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to get response: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            // Expecting { answer: string, citations?: string[] }
            const assistantMsg: Message = {
                role: 'assistant',
                content: data.answer || data.content || "No answer provided.",
                citations: data.citations
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err: any) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `Sorry, I encountered an error: ${err.message || "Unknown error"}` }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--card-bg)' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#64748b', marginTop: 'auto', marginBottom: 'auto' }}>
                        <p>Ask a question based on your uploaded documents.</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                    }}>
                        <div style={{
                            background: msg.role === 'user' ? 'var(--accent)' : 'rgba(30, 41, 59, 0.5)',
                            padding: '1rem',
                            borderRadius: '12px',
                            color: 'white',
                            border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>

                        {/* Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', paddingLeft: '0.5rem' }}>
                                <strong>Sources:</strong>
                                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                                    {msg.citations.map((cite, idx) => (
                                        <li key={idx}>{cite}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div style={{ alignSelf: 'flex-start', color: '#64748b', fontStyle: 'italic', marginLeft: '1rem' }}>
                        Analyzing documents...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                    placeholder="Ask a question..."
                    className="input"
                    style={{ flex: 1, boxShadow: 'none' }}
                    disabled={loading}
                />
                <button
                    onClick={sendMessage}
                    className="button"
                    disabled={loading || !input.trim()}
                    style={{ width: 'auto', padding: '0 1.5rem' }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
