import React from "react";
import { motion } from "framer-motion";
import {
    Briefcase,
    HardHat,
    Truck,
    Car,
    Home,
    Umbrella,
    ArrowUpRight,
} from "lucide-react";

const commercial = [
    {
        icon: Briefcase,
        title: "Business Owner's Policy (BOP)",
        desc: "Unified general liability and business personal property protection.",
    },
    {
        icon: HardHat,
        title: "Workers' Compensation",
        desc: "State-mandatory medical care and wage indemnity for corporate employee structures.",
    },
    {
        icon: Truck,
        title: "Inland Marine & Cargo",
        desc: "Real-time transit safety coverage for high-end electronic equipment and tools.",
    },
];

const personal = [
    {
        icon: Car,
        title: "Minnesota No-Fault Auto",
        desc: "Comprehensive, collision, and personal injury protection built around MN statutory auto guidelines.",
    },
    {
        icon: Home,
        title: "Homeowners & Renters",
        desc: "Absolute structural and personal item defense engineered for Minnesota's intense weather and winter freeze cycles.",
    },
    {
        icon: Umbrella,
        title: "Personal Umbrella Liability",
        desc: "Elite legal and financial shield layers extending beyond base personal limits.",
    },
];

function Card({ item, idx, onOpenQuote, columnLabel }) {
    const Icon = item.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: idx * 0.08 }}
            className="glass-card p-6 md:p-7 group cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
            style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            }}
            data-testid={`portfolio-card-${columnLabel}-${idx}`}
            onClick={onOpenQuote}
        >
            <div className="flex items-start justify-between mb-6">
                <div className="h-12 w-12 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 flex items-center justify-center transition group-hover:bg-[#D4AF37]/20">
                    <Icon className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#E5C158] group-hover:text-[#D4AF37] transition-colors" />
            </div>
            <h3 className="font-heading text-xl text-white mb-2 leading-tight">{item.title}</h3>
            <p className="text-[#E5C158] text-sm leading-relaxed">{item.desc}</p>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-mono-label text-[#E5C158] group-hover:text-[#D4AF37] transition">
                Request Coverage
            </div>
        </motion.div>
    );
}

export default function PortfolioGrid({ onOpenQuote }) {
    return (
        <section
            id="portfolio"
            className="relative px-6 md:px-12 lg:px-20 py-24 md:py-32"
            data-testid="portfolio-section"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-12 mb-16">
                    <div className="lg:col-span-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="h-px w-10 bg-[#D4AF37]" />
                            <span className="font-mono-label text-[#D4AF37] text-xs">
                                Coverage Portfolio
                            </span>
                        </div>
                        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight">
                            Broad-spectrum P&amp;C
                            <br />
                            <span className="text-[#D4AF37]">engineered for Minnesota.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-7 lg:pl-12 flex items-end">
                        <p className="text-[#E5C158] text-base md:text-lg leading-relaxed max-w-xl">
                            Beyond livery, Twin Cities Insurance brokers the full spectrum of
                            commercial and personal lines &mdash; tailored for the operators,
                            families, and businesses powering the Twin Cities economy.
                        </p>
                    </div>
                </div>

                <div className="divider-line mb-16" />

                <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
                    {/* Commercial column */}
                    <div data-testid="portfolio-column-commercial">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="font-mono-label text-[#E5C158] text-xs">
                                01 · Commercial Business Lines
                            </span>
                            <span className="flex-1 h-px bg-white/10" />
                        </div>
                        <div className="space-y-5">
                            {commercial.map((item, i) => (
                                <Card
                                    key={i}
                                    item={item}
                                    idx={i}
                                    onOpenQuote={onOpenQuote}
                                    columnLabel="commercial"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Personal column */}
                    <div data-testid="portfolio-column-personal">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="font-mono-label text-[#E5C158] text-xs">
                                02 · Personal Asset Lines
                            </span>
                            <span className="flex-1 h-px bg-white/10" />
                        </div>
                        <div className="space-y-5">
                            {personal.map((item, i) => (
                                <Card
                                    key={i}
                                    item={item}
                                    idx={i}
                                    onOpenQuote={onOpenQuote}
                                    columnLabel="personal"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
