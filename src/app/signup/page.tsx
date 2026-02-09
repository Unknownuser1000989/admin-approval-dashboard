"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
            } else {
                setSuccess(true);
                if (data.status === "approved") {
                    // Admin account was created, redirect to login
                    setTimeout(() => router.push("/login"), 2000);
                }
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container">
                <div className="card">
                    <h1 className="title">Registration Successful!</h1>
                    <p className="subtitle">
                        If you are not the first user, an administrator needs to approve your account before you can log in.
                    </p>
                    <Link href="/login" className="button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <h1 className="title">Create Account</h1>
                <p className="subtitle">Join our premium dashboard today.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Email Address</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="button" disabled={loading}>
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <p className="link-text">
                    Already have an account?{" "}
                    <Link href="/login" className="link">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
