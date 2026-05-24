import React, { useEffect, useState } from "react";
import { listQuotes, isAuthenticated, logout } from "../lib/api";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, LogOut, Download } from "lucide-react";

const RISK_LABELS = {
    limousine_livery_fleet: "Limo/Livery Fleet",
    small_business_lines: "Small Business",
    home_auto_bundle: "Home & Auto Bundle",
};

export default function Admin() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authed] = useState(() => isAuthenticated());
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listQuotes();
            setQuotes(data);
        } catch (e) {
            if (e?.response?.status === 401) {
                navigate("/admin/login");
                return;
            }
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authed) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authed]);

    if (!authed) return <Navigate to="/admin/login" replace />;

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const csvEscape = (v) => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };

    const exportCsv = () => {
        if (!quotes.length) return;
        const headers = [
            "id",
            "created_at",
            "risk_type",
            "legal_name",
            "zip_code",
            "dot_number",
            "contact_name",
            "phone",
            "email",
            "status",
        ];
        const rows = quotes.map((q) =>
            headers.map((k) => csvEscape(q[k])).join(",")
        );
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const stamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `tci-quote-pipeline-${stamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen px-6 md:px-12 lg:px-20 py-12" data-testid="admin-page">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
                    <Link to="/" className="btn-ghost" data-testid="admin-back-home">
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <button onClick={load} className="btn-ghost" data-testid="admin-refresh">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <button
                            onClick={exportCsv}
                            className="btn-ghost"
                            disabled={!quotes.length}
                            data-testid="admin-export-csv"
                            title={
                                quotes.length
                                    ? "Download the quote pipeline as CSV"
                                    : "No quotes to export"
                            }
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-ghost"
                            data-testid="admin-logout"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <span className="h-px w-10 bg-[#D4AF37]" />
                    <span className="font-mono-label text-[#D4AF37] text-xs">
                        Internal · Quote Pipeline
                    </span>
                </div>
                <h1 className="font-heading text-3xl md:text-4xl text-white mb-8">
                    Quote Submissions
                </h1>

                {error && (
                    <div className="text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-4 py-3 mb-6">
                        {error}
                    </div>
                )}

                <div className="glass-card overflow-hidden" data-testid="admin-quotes-table">
                    <div className="grid grid-cols-12 px-5 py-4 border-b border-white/10 text-xs font-mono-label text-[#E5C158]">
                        <div className="col-span-3">Legal Name</div>
                        <div className="col-span-2">Risk Type</div>
                        <div className="col-span-2">Contact</div>
                        <div className="col-span-3">Email / Phone</div>
                        <div className="col-span-2 text-right">Submitted</div>
                    </div>
                    {loading && quotes.length === 0 ? (
                        <div className="px-5 py-12 text-center text-[#E5C158]">Loading...</div>
                    ) : quotes.length === 0 ? (
                        <div className="px-5 py-12 text-center text-[#E5C158]">
                            No quote submissions yet.
                        </div>
                    ) : (
                        quotes.map((q) => (
                            <div
                                key={q.id}
                                className="grid grid-cols-12 px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition text-sm"
                                data-testid={`admin-quote-row-${q.id}`}
                            >
                                <div className="col-span-3 text-white font-medium">
                                    {q.legal_name}
                                    {q.dot_number && (
                                        <div className="text-xs text-[#E5C158]">
                                            DOT: {q.dot_number}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 text-[#D4AF37]">
                                    {RISK_LABELS[q.risk_type] || q.risk_type}
                                </div>
                                <div className="col-span-2 text-white">
                                    {q.contact_name}
                                    <div className="text-xs text-[#E5C158]">ZIP {q.zip_code}</div>
                                </div>
                                <div className="col-span-3 text-[#E5C158] text-xs break-all">
                                    {q.email}
                                    <div>{q.phone}</div>
                                </div>
                                <div className="col-span-2 text-right text-xs text-[#E5C158]">
                                    {new Date(q.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
