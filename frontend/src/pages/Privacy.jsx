import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
    return (
        <div className="min-h-screen px-6 md:px-12 lg:px-20 py-12" data-testid="privacy-page">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="btn-ghost mb-8 inline-flex" data-testid="privacy-back-home">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Link>

                <div className="flex items-center gap-2 mb-3">
                    <span className="h-px w-10 bg-[#D4AF37]" />
                    <span className="font-mono-label text-[#D4AF37] text-xs">Legal · Privacy</span>
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-light text-white mb-3 leading-tight">
                    Privacy Policy
                </h1>
                <p className="text-[#E5C158] text-sm mb-12">
                    Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>

                <div className="prose-tci space-y-8 text-[#E5C158] leading-relaxed">
                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">1. Who we are</h2>
                        <p>
                            Twin Cities Insurance ("we", "us", "our") is an independent Property &amp; Casualty
                            insurance brokerage operating under the leadership of Principal Agent Muhammad Umar
                            Ahmadzai and licensed by the Minnesota Department of Commerce. We serve clients in
                            Minneapolis, Saint Paul, and the surrounding Twin Cities metro.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">2. Information we collect</h2>
                        <p>When you submit a quote request through this site, we collect:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Legal business or individual name</li>
                            <li>ZIP code and (where applicable) USDOT number</li>
                            <li>Primary contact name, phone number, and email address</li>
                            <li>The risk type you selected (e.g. Limousine/Livery, Small Business, Home &amp; Auto)</li>
                            <li>Timestamp and IP address of submission (for rate-limiting and fraud prevention)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">3. How we use it</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>To respond to your quote request and place coverage with appointed carriers.</li>
                            <li>To send transactional confirmation and follow-up emails about your application.</li>
                            <li>To share carrier-safe quote details with our underwriting partners via secure, expiring share links.</li>
                            <li>To comply with applicable Minnesota Department of Commerce recordkeeping rules.</li>
                        </ul>
                        <p className="mt-3">
                            We <strong>do not sell</strong> your information to third parties and we do not use
                            it for marketing unrelated to insurance services.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">4. Sharing with carriers</h2>
                        <p>
                            To shop your coverage, we may transmit your submitted information to insurance carriers
                            and managing general agents we are appointed with. These partners are bound by industry
                            confidentiality standards and applicable state insurance law.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">5. Data retention &amp; security</h2>
                        <p>
                            Quote records are stored in an access-controlled database. Only the Principal Agent
                            and authorized staff can access the internal quote pipeline. We retain quote records
                            as long as required by Minnesota insurance recordkeeping rules and our carrier agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">6. Your rights</h2>
                        <p>
                            You may request a copy of, correction of, or deletion of your submitted information at
                            any time by emailing{" "}
                            <a href="mailto:mumerahmadzai@gmail.com" className="text-[#D4AF37] hover:underline">
                                mumerahmadzai@gmail.com
                            </a>
                            . We will respond within 30 days. Note that certain records may be retained for legal
                            and regulatory reasons even after a deletion request.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">7. Cookies &amp; analytics</h2>
                        <p>
                            This site uses minimal first-party cookies required to keep agent portal sessions secure.
                            Aggregated, anonymous analytics (page visits, country) may be collected to improve the
                            site. We do not run third-party advertising trackers.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">8. Contact</h2>
                        <p>
                            Twin Cities Insurance &middot; Muhammad Umar Ahmadzai, Principal Agent<br />
                            <a href="tel:6122221749" className="text-[#D4AF37] hover:underline">612-222-1749</a>{" "}
                            &middot;{" "}
                            <a href="mailto:mumerahmadzai@gmail.com" className="text-[#D4AF37] hover:underline">
                                mumerahmadzai@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
