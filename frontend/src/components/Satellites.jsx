import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
    Briefcase,
    HardHat,
    Truck,
    Car,
    Home,
    Umbrella,
} from "lucide-react";

const h = React.createElement;

// Map each product to the appropriate risk_type used by the quote modal
export const PRODUCTS = [
    {
        key: "bop",
        title: "Business Owner's Policy",
        short: "BOP",
        desc: "Unified general liability + business personal property.",
        icon: Briefcase,
        risk: "small_business_lines",
    },
    {
        key: "workers",
        title: "Workers' Comp",
        short: "Workers' Comp",
        desc: "Statutory medical care + wage indemnity for employees.",
        icon: HardHat,
        risk: "small_business_lines",
    },
    {
        key: "inland",
        title: "Inland Marine & Cargo",
        short: "Inland Marine",
        desc: "Real-time transit coverage for equipment & tools.",
        icon: Truck,
        risk: "small_business_lines",
    },
    {
        key: "auto",
        title: "MN No-Fault Auto",
        short: "MN Auto",
        desc: "Collision, comp, PIP under MN statutory guidelines.",
        icon: Car,
        risk: "home_auto_bundle",
    },
    {
        key: "home",
        title: "Homeowners & Renters",
        short: "Homeowners",
        desc: "Structural & contents defense for MN winters.",
        icon: Home,
        risk: "home_auto_bundle",
    },
    {
        key: "umbrella",
        title: "Personal Umbrella",
        short: "Umbrella",
        desc: "Elite legal shield above your base limits.",
        icon: Umbrella,
        risk: "home_auto_bundle",
    },
];

function Satellite({ product, index, total, radius, onPick }) {
    const groupRef = useRef();
    const frozenAngleRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const angle0 = (index / total) * Math.PI * 2;

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();

        // Freeze angle while hovered so the description panel doesn't fly away
        let angle;
        if (hovered) {
            if (frozenAngleRef.current === null) {
                frozenAngleRef.current = angle0 + t * 0.12;
            }
            angle = frozenAngleRef.current;
        } else {
            frozenAngleRef.current = null;
            angle = angle0 + t * 0.12;
        }

        const baseY = 1.2 + Math.sin(t * 0.55 + index) * 0.35;
        const liftY = hovered ? 0.6 : 0;
        const radialPull = hovered ? -0.8 : 0;
        groupRef.current.position.x = Math.cos(angle) * (radius + radialPull);
        groupRef.current.position.z = Math.sin(angle) * (radius + radialPull);
        groupRef.current.position.y = baseY + liftY;
    });

    const Icon = product.icon;

    return h(
        "group",
        { ref: groupRef },
        h(
            Html,
            {
                center: true,
                zIndexRange: [40, 0],
                style: { pointerEvents: "auto" },
            },
            h(
                "div",
                {
                    className: `satellite-chip ${hovered ? "satellite-chip--hover" : ""}`,
                    onPointerEnter: () => setHovered(true),
                    onPointerLeave: () => setHovered(false),
                    onClick: () => onPick(product),
                    "data-testid": `satellite-${product.key}`,
                },
                h(
                    "div",
                    { className: "satellite-chip__icon" },
                    h(Icon, { size: 14, strokeWidth: 1.8 })
                ),
                h("span", { className: "satellite-chip__label" }, product.short),
                hovered &&
                    h(
                        "div",
                        { className: "satellite-chip__panel" },
                        h("div", { className: "satellite-chip__panel-title" }, product.title),
                        h("div", { className: "satellite-chip__panel-desc" }, product.desc),
                        h(
                            "div",
                            { className: "satellite-chip__panel-cta" },
                            "Click to quote →"
                        )
                    )
            )
        )
    );
}

export default function Satellites({ onPick }) {
    return h(
        React.Fragment,
        null,
        ...PRODUCTS.map((p, i) =>
            h(Satellite, {
                key: p.key,
                product: p,
                index: i,
                total: PRODUCTS.length,
                radius: 7.6,
                onPick,
            })
        )
    );
}
