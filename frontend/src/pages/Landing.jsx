import React, { useState } from "react";
import Hero from "../components/Hero";
import Hero3D from "../components/Hero3D";
import PortfolioGrid from "../components/PortfolioGrid";
import QuoteModal from "../components/QuoteModal";
import Footer from "../components/Footer";

export default function Landing() {
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [initialRisk, setInitialRisk] = useState("");

    const openQuote = (risk = "") => {
        setInitialRisk(risk);
        setQuoteOpen(true);
    };

    return (
        <div className="relative" data-testid="landing-page">
            {/* Persistent fixed-position 3D background */}
            <Hero3D onPick={(risk) => openQuote(risk)} />

            {/* Foreground content scrolls over the 3D canvas */}
            <div className="relative" style={{ zIndex: 2 }}>
                <Hero
                    onOpenQuote={() => openQuote("limousine_livery_fleet")}
                />
                <PortfolioGrid onOpenQuote={() => openQuote("")} />
                <Footer />
            </div>

            <QuoteModal
                open={quoteOpen}
                onClose={() => setQuoteOpen(false)}
                initialRisk={initialRisk}
            />
        </div>
    );
}
