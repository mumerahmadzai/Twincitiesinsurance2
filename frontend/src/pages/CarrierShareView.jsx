import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSharedQuote } from "../lib/api";
import { ShieldCheck, Phone, Mail, MapPin, AlertCircle, Loader2 } from "lucide-react";

const RISK_LABELS = {
    limousine_livery_fleet: "Limousine / Livery Fleet",
    small_business_lines: "Small Business Lines",
    home_auto_bundle: "Home & Auto Bundle",
};

export default function CarrierShareView() {
    const { token } = useParams();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await fetchSharedQuote(token);
                setQuote(data);
            } catch (e) {
                const detail = e?.response?.data?.detail || e.message;
                setError(typeof detail === "string" ? detail : "Unable to load this quote.");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    return (
        <div
            className="min-h-screen px-4 py-12 flex items-start justify-center"
            data-testid="carrier-share-page"
        >
            <div className="w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <img
                        src="/brand/emblem.png"
                        alt="Twin Cities Insurance"
                        className="h-10 w-10 object-contain"
                    />
                    <div>
                        <div className="font-mono-label text-[#D4AF37] text-xs">
                            Carrier Submission
                        </div>
                        <div className="font-heading text-white text-xl">
                            Twin Cities Insurance
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="glass-card p-10 flex items-center justify-center text-[#E5C158]">
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        Loading quote details...
                    </div>
                ) : error ? (
                    <div
                        className="glass-card p-8 flex items-start gap-4"
                        data-testid="carrier-share-error"
                    >
                        <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <div className="font-heading text-white text-lg mb-1">
                                Link unavailable
                            </div>
                            <div className="text-[#E5C158] text-sm">{error}</div>
                            <div className="text-[#E5C158]/70 text-xs mt-3">
                                Please request a fresh link from Principal Agent Muhammad Umar
                                Ahmadzai at <a href="tel:6122221749" className="text-[#D4AF37]">612-222-1749</a>.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-8" data-testid="carrier-share-card">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-px w-8 bg-[#D4AF37]" />
                            <span className="font-mono-label text-[#D4AF37] text-xs">
                                Quote Snapshot
                            </span>
                        </div>
                        <h1 className="font-heading text-3xl text-white mb-1">
                            {quote.legal_name}
                        </h1>
                        <div className="text-[#D4AF37] font-medium mb-6">
                            {RISK_LABELS[quote.risk_type] || quote.risk_type}
                        </div>

                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                    Primary Contact
                                </dt>
                                <dd className="text-white">{quote.contact_name}</dd>
                            </div>
                            <div>
                                <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                    Status
                                </dt>
                                <dd className="text-white capitalize">{quote.status}</dd>
                            </div>
                            <div>
                                <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                    <Phone className="inline h-3 w-3 mr-1" />
                                    Phone
                                </dt>
                                <dd>
                                    <a
                                        href={`tel:${quote.phone}`}
                                        className="text-white hover:text-[#D4AF37]"
                                    >
                                        {quote.phone}
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                    <Mail className="inline h-3 w-3 mr-1" />
                                    Email
                                </dt>
                                <dd>
                                    <a
                                        href={`mailto:${quote.email}`}
                                        className="text-white hover:text-[#D4AF37] break-all"
                                    >
                                        {quote.email}
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                    <MapPin className="inline h-3 w-3 mr-1" />
                                    MN Zip Code
                                </dt>
                                <dd className="text-white">{quote.zip_code}</dd>
                            </div>
                            {quote.dot_number && (
                                <div>
                                    <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                        DOT Number
                                    </dt>
                                    <dd className="text-white">{quote.dot_number}</dd>
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <dt className="font-mono-label text-xs text-[#E5C158] mb-1">
                                    Submitted
                                </dt>
                                <dd className="text-white">
                                    {new Date(quote.created_at).toLocaleString()}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-xs text-[#E5C158]">
                            <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <div>
                                Confidential submission shared by Twin Cities Insurance for carrier
                                market evaluation. Link expires automatically within 72 hours.
                                Please reply to{" "}
                                <a
                                    href="mailto:mumerahmadzai@gmail.com"
                                    className="text-[#D4AF37]"
                                >
                                    mumerahmadzai@gmail.com
                                </a>{" "}
                                with quote indications.
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center mt-8">
                    <Link to="/" className="text-[#E5C158]/70 hover:text-[#D4AF37] text-xs">
                        twincitiesinsurance.com →
                    </Link>
                </div>
            </div>
        </div>
    );
}
