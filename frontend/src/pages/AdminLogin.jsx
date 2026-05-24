import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminLogin } from "../lib/api";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

function formatApiError(detail) {
    if (detail == null) return "Login failed. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return "Login failed. Please try again.";
}

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await adminLogin(email, password);
            navigate("/admin");
        } catch (err) {
            setError(formatApiError(err?.response?.data?.detail) || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            data-testid="admin-login-page"
        >
            <div className="w-full max-w-md">
                <Link
                    to="/"
                    className="btn-ghost mb-6 inline-flex"
                    data-testid="login-back-home"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Link>

                <div className="glass-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <div>
                            <div className="font-mono-label text-[#D4AF37] text-xs">
                                Principal Agent Console
                            </div>
                            <h1 className="font-heading text-2xl text-white">Sign in</h1>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                className="tci-input"
                                placeholder="mumerahmadzai@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                data-testid="login-email-input"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                className="tci-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                data-testid="login-password-input"
                                required
                            />
                        </div>

                        {error && (
                            <div
                                className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-4 py-2"
                                data-testid="login-error"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-accent w-full justify-center"
                            disabled={loading}
                            data-testid="login-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center text-[#E5C158]/70 text-xs mt-6">
                    Authorized personnel only · Twin Cities Insurance
                </div>
            </div>
        </div>
    );
}
