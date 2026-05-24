import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingBadges from "./FloatingBadges";

export default function Hero({ onOpenQuote }) {
    return (
        <section
            className="relative w-full grain"
            style={{ minHeight: "100vh" }}
            data-testid="hero-section"
        >

            {/* Top nav */}
            <div className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3"
                >
                    <img
                        src="/brand/emblem.png"
                        alt="Twin Cities Insurance emblem"
                        className="h-11 w-11 object-contain drop-shadow-[0_0_18px_rgba(212,175,55,0.45)]"
                        data-testid="brand-emblem"
                    />
                    <span
                        className="font-heading text-[#D4AF37] text-lg md:text-xl tracking-wide"
                        data-testid="brand-logo"
                        style={{ fontWeight: 500 }}
                    >
                        Twin Cities Insurance
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-4"
                >
                    <div className="hidden md:flex items-center gap-2 text-[#E5C158] text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Minneapolis · Saint Paul, MN</span>
                    </div>
                    <Link
                        to="/admin/login"
                        className="inline-flex items-center gap-1.5 text-[#E5C158] hover:text-[#050505] hover:bg-[#D4AF37] transition border border-[#D4AF37]/50 hover:border-[#D4AF37] rounded-full px-3 py-1.5 text-xs font-medium"
                        data-testid="nav-agent-portal"
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Agent Portal
                    </Link>
                </motion.div>
            </div>

            {/* Floating badges */}
            <FloatingBadges />

            {/* Hero copy overlay */}
            <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-10 md:pt-20 pb-32 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex items-center gap-2 mb-6"
                >
                    <span className="h-px w-10 bg-[#D4AF37]" />
                    <span className="font-mono-label text-[#D4AF37] text-xs">
                        Livery · Fleet · P&C Brokerage
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1 }}
                    className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-3xl"
                    data-testid="hero-headline"
                >
                    Minnesota's Premier
                    <br />
                    <span className="text-white">P&amp;C </span>
                    <span className="text-[#D4AF37]">Brokerage</span>
                    <span className="text-white"> Ecosystem</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.25 }}
                    className="mt-6 text-[#E5C158] text-base md:text-lg max-w-2xl leading-relaxed"
                    data-testid="hero-subheadline"
                >
                    From luxury limousine fleets to homeowners, business owners' policies, and
                    commercial cargo &mdash; we broker the entire Property &amp; Casualty
                    spectrum across Minneapolis and Saint Paul with{" "}
                    <span className="text-white font-medium">
                        affordable premiums that consistently beat the market
                    </span>
                    , $1.5M liability limits, and instant MnDOT Form E filings.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="mt-10 flex items-center gap-4 flex-wrap"
                >
                    <button
                        onClick={onOpenQuote}
                        className="btn-accent"
                        data-testid="cta-initiate-fleet-valuation"
                    >
                        Initiate Fleet Valuation
                        <ArrowRight className="h-4 w-4" />
                    </button>
                    <a href="#portfolio" className="btn-ghost" data-testid="cta-view-portfolio">
                        View Coverage Portfolio
                    </a>
                </motion.div>

                {/* Stats strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="mt-16 grid grid-cols-3 max-w-2xl gap-6"
                >
                    {[
                        { v: "Beats", l: "Market Rates" },
                        { v: "$1.5M", l: "MN Statutory Liability" },
                        { v: "<2hr", l: "Quote Turnaround" },
                    ].map((s, i) => (
                        <div key={i} className="border-l border-white/10 pl-4">
                            <div className="font-heading text-2xl md:text-3xl text-white">
                                {s.v}
                            </div>
                            <div className="text-xs text-[#E5C158] mt-1">{s.l}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#000000] pointer-events-none z-[1]" />
        </section>
    );
}
