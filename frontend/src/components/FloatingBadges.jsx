import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileSignature, BadgePercent } from "lucide-react";

const badges = [
    {
        icon: ShieldCheck,
        title: "MN Stat. § 168.128 Compliant",
        sub: "$1.5M Liability Required",
        pos: "top-[18%] right-[8%]",
        delay: 0.4,
    },
    {
        icon: FileSignature,
        title: "Direct MnDOT Form E",
        sub: "Filing Integration",
        pos: "bottom-[28%] right-[14%]",
        delay: 0.7,
    },
    {
        icon: BadgePercent,
        title: "Beats Market Rates",
        sub: "Affordable Premiums · Guaranteed",
        pos: "top-[42%] right-[6%]",
        delay: 1.0,
    },
];

export default function FloatingBadges() {
    return (
        <div className="absolute inset-0 pointer-events-none hidden md:block">
            {badges.map((b, i) => {
                const Icon = b.icon;
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: b.delay, duration: 0.8, ease: "easeOut" }}
                        className={`absolute ${b.pos} animate-float pointer-events-auto`}
                        data-testid={`hero-floating-badge-${i}`}
                    >
                        <div className="glass-card px-4 py-3 flex items-center gap-3 max-w-[280px]">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center border border-[#D4AF37]/60 bg-[#D4AF37]/10">
                                <Icon className="h-4 w-4 text-[#D4AF37]" />
                            </div>
                            <div className="leading-tight">
                                <div className="text-white text-sm font-medium font-heading">
                                    {b.title}
                                </div>
                                <div className="text-[#E5C158] text-xs">{b.sub}</div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
