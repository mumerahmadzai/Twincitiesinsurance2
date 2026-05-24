import React from "react";
import { Phone, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer
            className="relative px-6 md:px-12 lg:px-20 py-14 border-t border-white/10"
            data-testid="footer"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src="/brand/emblem.png"
                                alt="Twin Cities Insurance emblem"
                                className="h-11 w-11 object-contain"
                            />
                            <span className="font-heading text-[#D4AF37] text-lg tracking-wide">
                                Twin Cities Insurance
                            </span>
                        </div>
                        <p className="text-[#E5C158] text-sm max-w-md leading-relaxed">
                            All services are bound by underwriting rules and direct carrier
                            appointments. Twin Cities Insurance is an independent Property &amp;
                            Casualty insurance brokerage operating in full compliance with the
                            Minnesota Department of Commerce under the leadership of Principal Agent
                            Muhammad Umar Ahmadzai.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a
                            href="tel:6122221749"
                            className="flex items-center gap-3 text-white hover:text-[#D4AF37] transition group"
                            data-testid="footer-phone"
                        >
                            <span className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]">
                                <Phone className="h-4 w-4" />
                            </span>
                            <div>
                                <div className="text-xs font-mono-label text-[#E5C158]">Phone</div>
                                <div className="font-heading">612-222-1749</div>
                            </div>
                        </a>
                        <a
                            href="mailto:mumerahmadzai@gmail.com"
                            className="flex items-center gap-3 text-white hover:text-[#D4AF37] transition group"
                            data-testid="footer-email"
                        >
                            <span className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]">
                                <Mail className="h-4 w-4" />
                            </span>
                            <div>
                                <div className="text-xs font-mono-label text-[#E5C158]">Email</div>
                                <div className="font-heading">mumerahmadzai@gmail.com</div>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#E5C158]">
                    <div>
                        © {new Date().getFullYear()} Twin Cities Insurance. Serving Minneapolis
                        &amp; Saint Paul, MN.
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin/login"
                            className="inline-flex items-center gap-1.5 text-[#E5C158] hover:text-[#D4AF37] transition border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-full px-3 py-1.5"
                            data-testid="footer-agent-portal"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Agent Portal
                        </Link>
                        <span className="font-mono-label">
                            Principal Agent · Muhammad Umar Ahmadzai
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
