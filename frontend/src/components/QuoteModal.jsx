import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Truck, Building2, Home } from "lucide-react";
import { submitQuote } from "../lib/api";

const RISKS = [
    {
        key: "limousine_livery_fleet",
        title: "Limousine / Livery Fleet",
        desc: "Stretches, sedans, SUVs, party buses with MnDOT Form E.",
        icon: Truck,
    },
    {
        key: "small_business_lines",
        title: "Small Business Lines",
        desc: "BOP, Workers' Comp, Inland Marine & Cargo.",
        icon: Building2,
    },
    {
        key: "home_auto_bundle",
        title: "Home & Auto Bundle",
        desc: "MN No-Fault Auto, Homeowners, Umbrella.",
        icon: Home,
    },
];

const STEPS = ["Risk Selection", "Entity Validation", "Contact Router"];

export default function QuoteModal({ open, onClose, initialRisk = "" }) {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        risk_type: "",
        legal_name: "",
        zip_code: "",
        dot_number: "",
        contact_name: "",
        phone: "",
        email: "",
    });

    // Sync pre-selected risk from satellite click whenever the modal opens
    React.useEffect(() => {
        if (open && initialRisk) {
            setForm((f) => ({ ...f, risk_type: initialRisk }));
        }
    }, [open, initialRisk]);

    if (!open) return null;

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const canNext = () => {
        if (step === 0) return !!form.risk_type;
        if (step === 1)
            return form.legal_name.trim().length >= 2 && /^\d{5}(-\d{4})?$/.test(form.zip_code);
        if (step === 2)
            return (
                form.contact_name.trim().length >= 2 &&
                form.phone.trim().length >= 7 &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
            );
        return false;
    };

    const reset = () => {
        setStep(0);
        setForm({
            risk_type: "",
            legal_name: "",
            zip_code: "",
            dot_number: "",
            contact_name: "",
            phone: "",
            email: "",
        });
        setSuccess(null);
        setError(null);
        setSubmitting(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Hidden honeypot field — humans never see/fill it, bots will → backend silently rejects
    const [honeypot, setHoneypot] = useState("");

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const payload = { ...form };
            if (!payload.dot_number) delete payload.dot_number;
            if (honeypot) payload.website = honeypot;
            const res = await submitQuote(payload);
            setSuccess(res);
        } catch (e) {
            const msg =
                e?.response?.data?.detail?.[0]?.msg ||
                e?.response?.data?.detail ||
                "Submission failed. Please call 612-222-1749.";
            setError(typeof msg === "string" ? msg : "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
                data-testid="quote-modal-overlay"
            >
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ type: "spring", damping: 22, stiffness: 220 }}
                    className="glass-modal w-full max-w-2xl p-6 md:p-10 relative"
                    onClick={(e) => e.stopPropagation()}
                    data-testid="quote-modal"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 h-9 w-9 rounded-full border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/70 flex items-center justify-center transition"
                        data-testid="quote-modal-close"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {!success ? (
                        <>
                            {/* Honeypot — hidden from real users, bots will fill it */}
                            <input
                                type="text"
                                name="website"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
                            />
                            {/* Step indicator */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="font-mono-label text-[#D4AF37] text-xs">
                                        Step {step + 1} of {STEPS.length}
                                    </span>
                                </div>
                                <h3 className="font-heading text-2xl md:text-3xl text-white mb-2">
                                    {STEPS[step]}
                                </h3>
                                <div className="flex gap-2 mt-4">
                                    {STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all ${
                                                i <= step ? "bg-[#D4AF37]" : "bg-white/10"
                                            }`}
                                            data-testid={`step-indicator-${i}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {step === 0 && (
                                        <div className="space-y-3" data-testid="quote-step-1">
                                            {RISKS.map((r) => {
                                                const Icon = r.icon;
                                                return (
                                                    <button
                                                        key={r.key}
                                                        onClick={() => set("risk_type", r.key)}
                                                        data-selected={form.risk_type === r.key}
                                                        className="risk-option flex items-center gap-4"
                                                        data-testid={`risk-option-${r.key}`}
                                                    >
                                                        <div className="h-10 w-10 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                                                            <Icon className="h-4 w-4 text-[#D4AF37]" />
                                                        </div>
                                                        <div>
                                                            <div className="font-heading text-white text-base">
                                                                {r.title}
                                                            </div>
                                                            <div className="text-[#E5C158] text-sm">
                                                                {r.desc}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {step === 1 && (
                                        <div className="space-y-4" data-testid="quote-step-2">
                                            <div>
                                                <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                                    Legal Business / Individual Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="tci-input"
                                                    placeholder="e.g. Lakeside Limousine LLC"
                                                    value={form.legal_name}
                                                    onChange={(e) => set("legal_name", e.target.value)}
                                                    data-testid="input-legal-name"
                                                />
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                                        Minnesota Zip Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="tci-input"
                                                        placeholder="55401"
                                                        value={form.zip_code}
                                                        onChange={(e) =>
                                                            set("zip_code", e.target.value)
                                                        }
                                                        data-testid="input-zip-code"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                                        DOT Number (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="tci-input"
                                                        placeholder="USDOT #"
                                                        value={form.dot_number}
                                                        onChange={(e) =>
                                                            set("dot_number", e.target.value)
                                                        }
                                                        data-testid="input-dot-number"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-4" data-testid="quote-step-3">
                                            <div>
                                                <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                                    Primary Contact Person
                                                </label>
                                                <input
                                                    type="text"
                                                    className="tci-input"
                                                    placeholder="Full name"
                                                    value={form.contact_name}
                                                    onChange={(e) =>
                                                        set("contact_name", e.target.value)
                                                    }
                                                    data-testid="input-contact-name"
                                                />
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                                        Phone Number
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="tci-input"
                                                        placeholder="612-222-1749"
                                                        value={form.phone}
                                                        onChange={(e) =>
                                                            set("phone", e.target.value)
                                                        }
                                                        data-testid="input-phone"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-mono-label text-xs text-[#E5C158] block mb-2">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className="tci-input"
                                                        placeholder="you@company.com"
                                                        value={form.email}
                                                        onChange={(e) =>
                                                            set("email", e.target.value)
                                                        }
                                                        data-testid="input-email"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {error && (
                                <div
                                    className="mt-4 text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-4 py-2"
                                    data-testid="quote-error"
                                >
                                    {error}
                                </div>
                            )}

                            <div className="mt-8 flex items-center justify-between">
                                <button
                                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                                    disabled={step === 0}
                                    className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
                                    data-testid="quote-back-btn"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </button>
                                {step < 2 ? (
                                    <button
                                        onClick={() => setStep((s) => s + 1)}
                                        disabled={!canNext()}
                                        className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
                                        data-testid="quote-next-btn"
                                    >
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!canNext() || submitting}
                                        className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
                                        data-testid="quote-submit-btn"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Application
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-8 text-center"
                            data-testid="quote-success"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.1 }}
                                className="mx-auto h-16 w-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] flex items-center justify-center mb-6"
                            >
                                <CheckCircle2 className="h-7 w-7 text-[#D4AF37]" />
                            </motion.div>
                            <h3 className="font-heading text-2xl md:text-3xl text-white mb-4">
                                Application Received Securely
                            </h3>
                            <p className="text-[#E5C158] leading-relaxed max-w-md mx-auto">
                                Principal Agent <span className="text-white">Muhammad Umar Ahmadzai</span>{" "}
                                is reviewing the placement. For immediate updates, contact our desk at{" "}
                                <a href="tel:6122221749" className="text-[#D4AF37] hover:underline">
                                    612-222-1749
                                </a>
                                . Expect market options in your inbox within 2 business hours.
                            </p>
                            <div className="mt-6 text-xs font-mono-label text-[#E5C158]">
                                Reference: {success.id?.slice(0, 8).toUpperCase()}
                            </div>
                            <button
                                onClick={handleClose}
                                className="btn-ghost mt-8"
                                data-testid="quote-success-close"
                            >
                                Close
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
