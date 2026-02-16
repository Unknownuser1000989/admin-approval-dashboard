"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function YouTubeSummarizer() {
    const [mode, setMode] = useState<'url' | 'text'>('url');
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSummarize = async () => {
        if (mode === 'url' && !url) return;
        if (mode === 'text' && !text) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setCopied(false);

        try {
            const body = mode === 'url' ? { url } : { text };
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setResult(data.content);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="card" style={{ maxWidth: 'none', marginTop: '2rem', border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>AI Video Summarizer</h3>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--secondary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setMode('url')}
                        style={{
                            background: mode === 'url' ? 'var(--primary)' : 'transparent',
                            color: mode === 'url' ? 'white' : '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.375rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        YouTube URL
                    </button>
                    <button
                        onClick={() => setMode('text')}
                        style={{
                            background: mode === 'text' ? 'var(--primary)' : 'transparent',
                            color: mode === 'text' ? 'white' : '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.375rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        Manual Text
                    </button>
                </div>
            </div>

            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {mode === 'url'
                    ? "Paste a YouTube video link below. The AI will analyze the transcript and generate comprehensive study notes."
                    : "Paste any text or transcript below to generate a structured summary and key takeaways."}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {mode === 'url' ? (
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem 0.875rem 3rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>
                ) : (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste transcript text here..."
                        rows={8}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            color: 'white',
                            resize: 'vertical',
                            minHeight: '150px',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                )}

                <button
                    onClick={handleSummarize}
                    disabled={loading || (mode === 'url' ? !url : !text)}
                    className="button"
                    style={{
                        padding: '0.875rem 2rem',
                        width: 'auto',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: (loading || (mode === 'url' ? !url : !text)) ? 0.6 : 1
                    }}
                >
                    {loading ? (
                        <>
                            <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                            Summarizing...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="4 17 10 11 4 5" />
                                <line x1="12" y1="19" x2="20" y2="19" />
                            </svg>
                            Generate Notes
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            {result && (
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', fontWeight: '600' }}>Study Notes</h4>
                        <button
                            onClick={handleCopy}
                            style={{
                                background: copied ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: 'white',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            {copied ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <div className="markdown-content" style={{ padding: '2rem', color: '#e2e8f0', lineHeight: '1.7', fontSize: '1rem' }}>
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                    <style jsx global>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .markdown-content h1 { color: var(--primary); margin-bottom: 2rem; font-size: 1.8rem; font-weight: 800; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 1rem; }
                        .markdown-content h2 { color: white; margin-top: 2.5rem; margin-bottom: 1.25rem; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; }
                        .markdown-content h2::before { content: ''; display: block; width: 6px; height: 1.4rem; background: var(--accent); border-radius: 4px; }
                        .markdown-content h3 { color: #cbd5e1; margin-top: 1.75rem; margin-bottom: 1rem; font-size: 1.15rem; font-weight: 600; }
                        .markdown-content p { margin-bottom: 1.25rem; color: #cbd5e1; }
                        .markdown-content ul, .markdown-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
                        .markdown-content li { margin-bottom: 0.75rem; color: #cbd5e1; }
                        .markdown-content strong { color: white; font-weight: 700; }
                        .markdown-content code { background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 0.2rem 0.4rem; borderRadius: 6px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.9em; }
                        .markdown-content blockquote { border-left: 4px solid var(--primary); padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #94a3b8; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 0 12px 12px 0; }
                        .markdown-content hr { border: none; border-top: 1px solid var(--border); margin: 3rem 0; }
                    `}</style>
                </div>
            )}
        </div>
    );
}
