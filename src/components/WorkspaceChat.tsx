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
    const [isDeepSearch, setIsDeepSearch] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                body: JSON.stringify({ message: userMsg.content, deepSearch: isDeepSearch }),
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--card-bg)', position: 'relative' }}>
            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
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

            {/* Scroll Button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    style={{
                        position: 'absolute',
                        bottom: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        zIndex: 10,
                        transition: 'opacity 0.2s'
                    }}
                    title="Scroll to bottom"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            )}

            {/* Input Area */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', flexDirection: 'column' }}>
                {/* Deep Search Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}>
                    <button
                        onClick={() => setIsDeepSearch(!isDeepSearch)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: isDeepSearch ? '#38bdf8' : '#64748b',
                            fontSize: '0.85rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            backgroundColor: isDeepSearch ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                        }}
                        title={isDeepSearch ? "Deep Search Enabled (Web + Docs)" : "Deep Search Disabled (Docs Only)"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        <span>Deep Search {isDeepSearch ? "ON" : "OFF"}</span>
                    </button>
                    {isDeepSearch && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Simultaneous Web & Document Search)</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                        placeholder={isDeepSearch ? "Ask anything (Web + Docs)..." : "Ask about your documents..."}
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
        </div>
    );
}
