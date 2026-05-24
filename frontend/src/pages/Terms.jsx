import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
    return (
        <div className="min-h-screen px-6 md:px-12 lg:px-20 py-12" data-testid="terms-page">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="btn-ghost mb-8 inline-flex" data-testid="terms-back-home">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Link>

                <div className="flex items-center gap-2 mb-3">
                    <span className="h-px w-10 bg-[#D4AF37]" />
                    <span className="font-mono-label text-[#D4AF37] text-xs">Legal · Terms</span>
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-light text-white mb-3 leading-tight">
                    Terms of Service
                </h1>
                <p className="text-[#E5C158] text-sm mb-12">
                    Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>

                <div className="space-y-8 text-[#E5C158] leading-relaxed">
                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">1. Acceptance</h2>
                        <p>
                            By using this website and submitting a quote request, you agree to these Terms of
                            Service. If you do not agree, please do not use the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">2. Nature of services</h2>
                        <p>
                            Twin Cities Insurance is an independent Property &amp; Casualty insurance brokerage.
                            We do not underwrite policies; we shop and place coverage with appointed carriers.
                            Quotes and rate indications displayed or communicated through this site are{" "}
                            <strong>non-binding</strong> until a carrier formally issues a policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">3. Eligibility &amp; jurisdiction</h2>
                        <p>
                            Our services are offered to applicants located in the State of Minnesota. Submission
                            of a quote request does not constitute an offer or guarantee of coverage. All
                            placements are subject to carrier underwriting approval and statutory minimums under
                            Minnesota law (including, where applicable, Minn. Stat. §168.128 and MnDOT Form E
                            filings for livery operations).
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">4. Accuracy of information</h2>
                        <p>
                            You agree that information you submit is accurate and complete. Material
                            misrepresentation may result in declination, rescission, or non-renewal of any policy
                            issued through us, in accordance with Minnesota insurance regulations.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">5. Communication consent</h2>
                        <p>
                            By submitting a quote request, you consent to be contacted by Twin Cities Insurance
                            at the phone number and email you provided regarding your application. You may opt
                            out at any time by replying STOP to a text or "unsubscribe" to an email.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">6. No financial advice</h2>
                        <p>
                            Content on this site is for informational purposes only and does not constitute
                            legal, financial, or tax advice. Insurance needs vary; please consult licensed
                            professionals for advice specific to your situation.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">7. Intellectual property</h2>
                        <p>
                            All site content — branding, copy, illustrations, 3D assets — is the property of
                            Twin Cities Insurance or its licensors and may not be reproduced without written
                            permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">8. Limitation of liability</h2>
                        <p>
                            To the maximum extent permitted by Minnesota law, Twin Cities Insurance shall not be
                            liable for indirect, incidental, or consequential damages arising from your use of
                            this website. Our liability is at all times subject to the terms of any policy or
                            broker agreement actually executed between us and you.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">9. Governing law</h2>
                        <p>
                            These Terms are governed by the laws of the State of Minnesota. Any dispute will be
                            resolved in the state or federal courts located in Hennepin or Ramsey County, Minnesota.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">10. Changes</h2>
                        <p>
                            We may update these Terms from time to time. The "Last updated" date above reflects
                            the most recent revision. Continued use of the site after changes constitutes
                            acceptance of the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-heading text-xl text-white mb-3">11. Contact</h2>
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
