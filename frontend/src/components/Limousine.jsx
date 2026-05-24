import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

const h = React.createElement;

// ---------- Shared scroll state for wheel spin ----------
// Updated by Hero3D via window.scrollY listener. Wheels read this each frame.
const scrollRef = { current: 0, vel: 0 };
if (typeof window !== "undefined") {
    window.__tciScrollRef = scrollRef;
}

// ---------- Materials ----------
const paint = () =>
    h("meshPhysicalMaterial", {
        attach: "material",
        color: "#050505",
        metalness: 0.92,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        reflectivity: 1,
        envMapIntensity: 0.7,
    });

const glass = () =>
    h("meshPhysicalMaterial", {
        attach: "material",
        color: "#080a12",
        metalness: 0.2,
        roughness: 0.04,
        transmission: 0.55,
        transparent: true,
        opacity: 0.82,
        ior: 1.45,
        thickness: 0.4,
        envMapIntensity: 0.95,
    });

const gold = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#d4af37",
        metalness: 1.0,
        roughness: 0.22,
        envMapIntensity: 0.85,
    });

const darkMetal = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#141414",
        metalness: 0.85,
        roughness: 0.4,
        envMapIntensity: 0.5,
    });

const rubber = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#0e0e0e",
        metalness: 0.0,
        roughness: 0.92,
    });

const headlightMat = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#ffffff",
        emissive: "#fff5d6",
        emissiveIntensity: 2.6,
        toneMapped: false,
    });

const taillightMat = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#3a0a0a",
        emissive: "#ff2a2a",
        emissiveIntensity: 1.6,
        roughness: 0.4,
    });

// ---------- Helpers ----------
const rbox = (key, props, args, mat, radius = 0.1, smoothness = 4) =>
    h(RoundedBox, { key, args, radius, smoothness, ...props }, mat);

// ---------- Wheel (scroll-spun) ----------
function Wheel({ position, axleSign = 1 }) {
    const ref = useRef();
    const spinRef = useRef(0);
    useFrame((_, dt) => {
        if (!ref.current) return;
        // Idle low-speed spin + scroll-bound spin
        const idle = 1.6 * dt;
        const scrollContribution = (scrollRef.vel || 0) * 0.012;
        spinRef.current += (idle + scrollContribution) * axleSign;
        ref.current.rotation.y = spinRef.current;
    });

    const spokes = [];
    const N = 8;
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        spokes.push(
            h(
                "mesh",
                {
                    key: `sp-${i}`,
                    position: [Math.cos(a) * 0.18, 0.02, Math.sin(a) * 0.18],
                    rotation: [0, -a, 0],
                },
                h("boxGeometry", { args: [0.3, 0.024, 0.05] }),
                gold()
            )
        );
    }

    return h(
        "group",
        { ref, position, rotation: [Math.PI / 2, 0, 0] },
        // Tire
        h(
            "mesh",
            { castShadow: true },
            h("cylinderGeometry", { args: [0.42, 0.42, 0.28, 40] }),
            rubber()
        ),
        // Sidewall trim rings (gold)
        h(
            "mesh",
            { position: [0, 0.141, 0] },
            h("torusGeometry", { args: [0.34, 0.012, 8, 40] }),
            gold()
        ),
        h(
            "mesh",
            { position: [0, -0.141, 0] },
            h("torusGeometry", { args: [0.34, 0.012, 8, 40] }),
            gold()
        ),
        // Outer rim (gold disc)
        h(
            "mesh",
            { position: [0, 0.143, 0] },
            h("cylinderGeometry", { args: [0.32, 0.32, 0.024, 40] }),
            gold()
        ),
        // Inner well (dark)
        h(
            "mesh",
            { position: [0, 0.155, 0] },
            h("cylinderGeometry", { args: [0.26, 0.26, 0.014, 36] }),
            darkMetal()
        ),
        // Hub cap
        h(
            "mesh",
            { position: [0, 0.18, 0] },
            h("cylinderGeometry", { args: [0.08, 0.08, 0.05, 24] }),
            gold()
        ),
        h(
            "mesh",
            { position: [0, 0.21, 0] },
            h("cylinderGeometry", { args: [0.028, 0.028, 0.018, 12] }),
            darkMetal()
        ),
        // Spokes
        h("group", { position: [0, 0.15, 0] }, ...spokes),
        // Brake rotor
        h(
            "mesh",
            { position: [0, -0.16, 0] },
            h("cylinderGeometry", { args: [0.27, 0.27, 0.018, 32] }),
            darkMetal()
        )
    );
}

// Wheel-arch fender (downward half-arc that hugs the wheel)
function FenderArch({ x, side }) {
    return h(
        "mesh",
        {
            position: [x, 0.42, side * 1.0],
            rotation: [Math.PI / 2, 0, 0],
            castShadow: true,
        },
        h("torusGeometry", { args: [0.5, 0.075, 12, 24, Math.PI] }),
        paint()
    );
}

// ---------- Limousine ----------
export default function Limousine({ mouse }) {
    const group = useRef();

    useFrame((state) => {
        if (!group.current) return;
        const t = state.clock.getElapsedTime();

        // Smooth lerp 0.03 yaw rotation tracking the mouse
        const targetY = (mouse.current?.x ?? 0) * 0.18;
        group.current.rotation.y += (targetY - group.current.rotation.y) * 0.03;

        // Tiny breathing motion (< 0.05 units) simulating active suspension
        group.current.position.y = -0.4 + Math.sin(t * 0.7) * 0.035;
    });

    // ---------- Proportions (units) ----------
    const L = 9.2; // overall length
    const W = 2.0; // body width
    const HB = 0.55; // lower body height (low slung)
    const HC = 0.55; // cabin (greenhouse) height

    // Vertical layout
    // - Wheel center at Y = 0 (in limo-group coords). Wheel radius 0.42.
    // - Body bottom at Y = 0.46 (just above wheel top, 0.04 clearance)
    const wheelY = 0;
    const bodyBottomY = 0.46;
    const bodyCenterY = bodyBottomY + HB / 2; // 0.735
    const cabinCenterY = bodyBottomY + HB + HC / 2; // 1.285

    // X-section lengths (along the car)
    const hoodLen = 1.7;
    const trunkLen = 1.2;
    const cabinLen = L - hoodLen - trunkLen; // ~6.3

    const hoodCx = L / 2 - hoodLen / 2; // front hood center X
    const trunkCx = -(L / 2) + trunkLen / 2; // rear trunk center X
    // Lower body cabin section (between hood and trunk):
    const lowerCabinCx = hoodCx - hoodLen / 2 - cabinLen / 2; // = 0 essentially
    const lowerCabinLen = cabinLen;

    // Greenhouse (upper cabin with glass) — slightly inset from lower body
    const ghLen = cabinLen - 1.2;
    const ghCx = lowerCabinCx; // centered

    const children = [];

    // ============ LOWER BODY ============
    // Hood — lower than cabin, slight forward taper
    children.push(
        rbox(
            "hood",
            { position: [hoodCx, bodyCenterY - 0.06, 0], castShadow: true },
            [hoodLen, HB - 0.04, W - 0.05],
            paint(),
            0.18,
            5
        )
    );

    // Middle (door / cabin lower body)
    children.push(
        rbox(
            "lower-cabin",
            { position: [lowerCabinCx, bodyCenterY, 0], castShadow: true, receiveShadow: true },
            [lowerCabinLen, HB, W],
            paint(),
            0.16,
            5
        )
    );

    // Trunk — lower than cabin, mirrors hood proportions
    children.push(
        rbox(
            "trunk",
            { position: [trunkCx, bodyCenterY - 0.04, 0], castShadow: true },
            [trunkLen, HB - 0.02, W - 0.05],
            paint(),
            0.16,
            5
        )
    );

    // Gold rocker pin-stripe along the doors
    children.push(
        h(
            "mesh",
            {
                key: "rocker-r",
                position: [lowerCabinCx, bodyBottomY + 0.08, W / 2 - 0.005],
            },
            h("boxGeometry", { args: [lowerCabinLen - 0.4, 0.018, 0.012] }),
            gold()
        ),
        h(
            "mesh",
            {
                key: "rocker-l",
                position: [lowerCabinCx, bodyBottomY + 0.08, -(W / 2 - 0.005)],
            },
            h("boxGeometry", { args: [lowerCabinLen - 0.4, 0.018, 0.012] }),
            gold()
        )
    );

    // ============ GREENHOUSE (UPPER CABIN) ============
    // Roof + dark band; narrower than lower body for sleek look
    children.push(
        rbox(
            "greenhouse",
            { position: [ghCx, cabinCenterY, 0], castShadow: true },
            [ghLen, HC, W - 0.18],
            paint(),
            0.2,
            5
        )
    );

    // Windshield — slanted glass smoothly connecting hood to cabin roof
    const wsCx = ghCx + ghLen / 2 + 0.35;
    children.push(
        rbox(
            "windshield",
            {
                position: [wsCx, cabinCenterY - 0.02, 0],
                rotation: [0, 0, -0.46],
                castShadow: true,
            },
            [0.9, HC + 0.02, W - 0.24],
            glass(),
            0.05,
            3
        )
    );

    // Rear glass — slanted opposite
    const rgCx = ghCx - ghLen / 2 - 0.25;
    children.push(
        rbox(
            "rear-glass",
            {
                position: [rgCx, cabinCenterY - 0.02, 0],
                rotation: [0, 0, 0.46],
                castShadow: true,
            },
            [0.78, HC - 0.04, W - 0.24],
            glass(),
            0.05,
            3
        )
    );

    // ============ SIDE GLASS BAND (continuous) ============
    // One long tinted glass strip per side, then thin pillars overlay it
    const sideGlassLen = ghLen - 0.18;
    const sideGlassH = HC - 0.22;
    const sideGlassY = cabinCenterY + 0.02;
    const sideGlassZ = W / 2 - 0.07; // tucked just inside the greenhouse

    children.push(
        h(
            "mesh",
            { key: "side-glass-r", position: [ghCx, sideGlassY, sideGlassZ] },
            h("boxGeometry", { args: [sideGlassLen, sideGlassH, 0.04] }),
            glass()
        ),
        h(
            "mesh",
            { key: "side-glass-l", position: [ghCx, sideGlassY, -sideGlassZ] },
            h("boxGeometry", { args: [sideGlassLen, sideGlassH, 0.04] }),
            glass()
        )
    );

    // ============ THIN VERTICAL PILLARS (A, B, C) ============
    // Three pillars per side: A (front), B (middle), C (rear)
    const pillarHalfH = sideGlassH / 2 + 0.02;
    const pillarThickness = 0.045; // thin & elegant
    const pillarPositions = [
        ghCx + sideGlassLen / 2 - 0.02, // A
        ghCx + 0.6, // B-front
        ghCx - 0.6, // B-rear (extra pillar for the stretch)
        ghCx - sideGlassLen / 2 + 0.02, // C
    ];
    pillarPositions.forEach((px, i) => {
        children.push(
            h(
                "mesh",
                {
                    key: `pl-r-${i}`,
                    position: [px, sideGlassY, sideGlassZ + 0.005],
                },
                h("boxGeometry", { args: [pillarThickness, sideGlassH + 0.04, 0.04] }),
                paint()
            ),
            h(
                "mesh",
                {
                    key: `pl-l-${i}`,
                    position: [px, sideGlassY, -(sideGlassZ + 0.005)],
                },
                h("boxGeometry", { args: [pillarThickness, sideGlassH + 0.04, 0.04] }),
                paint()
            )
        );
    });

    // ============ GOLD WINDOW SURROUND TRIM ============
    children.push(
        h(
            "mesh",
            {
                key: "wt-rt",
                position: [ghCx, sideGlassY + sideGlassH / 2 + 0.012, sideGlassZ],
            },
            h("boxGeometry", { args: [sideGlassLen + 0.05, 0.014, 0.025] }),
            gold()
        ),
        h(
            "mesh",
            {
                key: "wt-rb",
                position: [ghCx, sideGlassY - sideGlassH / 2 - 0.012, sideGlassZ],
            },
            h("boxGeometry", { args: [sideGlassLen + 0.05, 0.014, 0.025] }),
            gold()
        ),
        h(
            "mesh",
            {
                key: "wt-lt",
                position: [ghCx, sideGlassY + sideGlassH / 2 + 0.012, -sideGlassZ],
            },
            h("boxGeometry", { args: [sideGlassLen + 0.05, 0.014, 0.025] }),
            gold()
        ),
        h(
            "mesh",
            {
                key: "wt-lb",
                position: [ghCx, sideGlassY - sideGlassH / 2 - 0.012, -sideGlassZ],
            },
            h("boxGeometry", { args: [sideGlassLen + 0.05, 0.014, 0.025] }),
            gold()
        )
    );

    // ============ HOOD ACCENT LINES ============
    children.push(
        h(
            "mesh",
            { key: "hoodline", position: [hoodCx, bodyCenterY + 0.27, 0] },
            h("boxGeometry", { args: [hoodLen - 0.2, 0.012, 0.012] }),
            gold()
        )
    );

    // ============ BUMPERS ============
    children.push(
        rbox(
            "bumper-f",
            { position: [L / 2 + 0.02, bodyCenterY - 0.18, 0], castShadow: true },
            [0.16, 0.3, W + 0.04],
            paint(),
            0.1,
            3
        ),
        rbox(
            "bumper-r",
            { position: [-(L / 2) - 0.02, bodyCenterY - 0.16, 0], castShadow: true },
            [0.16, 0.3, W + 0.04],
            paint(),
            0.1,
            3
        )
    );

    // ============ FRONT GRILLE — sleek horizontal slats with gold trim ============
    // Gold trim frame
    const grilleY = bodyCenterY - 0.05;
    children.push(
        h(
            "mesh",
            { key: "grille-frame-top", position: [L / 2 - 0.02, grilleY + 0.13, 0] },
            h("boxGeometry", { args: [0.05, 0.015, W - 0.55] }),
            gold()
        ),
        h(
            "mesh",
            { key: "grille-frame-bot", position: [L / 2 - 0.02, grilleY - 0.13, 0] },
            h("boxGeometry", { args: [0.05, 0.015, W - 0.55] }),
            gold()
        ),
        h(
            "mesh",
            { key: "grille-frame-l", position: [L / 2 - 0.02, grilleY, (W - 0.55) / 2] },
            h("boxGeometry", { args: [0.05, 0.28, 0.018] }),
            gold()
        ),
        h(
            "mesh",
            { key: "grille-frame-r", position: [L / 2 - 0.02, grilleY, -(W - 0.55) / 2] },
            h("boxGeometry", { args: [0.05, 0.28, 0.018] }),
            gold()
        )
    );
    // Horizontal grille slats
    for (let i = 0; i < 4; i++) {
        const y = grilleY + 0.08 - i * 0.055;
        children.push(
            h(
                "mesh",
                { key: `g-slat-${i}`, position: [L / 2 - 0.02, y, 0] },
                h("boxGeometry", { args: [0.05, 0.018, W - 0.6] }),
                gold()
            )
        );
    }
    // Center emblem
    children.push(
        h(
            "mesh",
            { key: "emblem", position: [L / 2 + 0.005, grilleY + 0.18, 0] },
            h("cylinderGeometry", { args: [0.06, 0.06, 0.018, 24] }),
            gold()
        )
    );

    // ============ HEADLIGHTS — slim modern LED strips ============
    children.push(
        h(
            "mesh",
            { key: "hl-r", position: [L / 2 + 0.025, grilleY + 0.16, 0.62] },
            h("boxGeometry", { args: [0.045, 0.035, 0.34] }),
            headlightMat()
        ),
        h(
            "mesh",
            { key: "hl-l", position: [L / 2 + 0.025, grilleY + 0.16, -0.62] },
            h("boxGeometry", { args: [0.045, 0.035, 0.34] }),
            headlightMat()
        ),
        // Lower DRL slim strips
        h(
            "mesh",
            { key: "drl-r", position: [L / 2 + 0.025, grilleY + 0.06, 0.7] },
            h("boxGeometry", { args: [0.045, 0.022, 0.22] }),
            headlightMat()
        ),
        h(
            "mesh",
            { key: "drl-l", position: [L / 2 + 0.025, grilleY + 0.06, -0.7] },
            h("boxGeometry", { args: [0.045, 0.022, 0.22] }),
            headlightMat()
        )
    );

    // ============ TAILLIGHTS ============
    const tlY = bodyCenterY + 0.04;
    children.push(
        h(
            "mesh",
            { key: "tl-r", position: [-(L / 2) - 0.025, tlY, 0.62] },
            h("boxGeometry", { args: [0.045, 0.06, 0.32] }),
            taillightMat()
        ),
        h(
            "mesh",
            { key: "tl-l", position: [-(L / 2) - 0.025, tlY, -0.62] },
            h("boxGeometry", { args: [0.045, 0.06, 0.32] }),
            taillightMat()
        ),
        // Connecting LED bar
        h(
            "mesh",
            { key: "tl-bar", position: [-(L / 2) - 0.025, tlY, 0] },
            h("boxGeometry", { args: [0.04, 0.02, W - 0.4] }),
            taillightMat()
        )
    );

    // ============ DOOR HANDLES ============
    [1.7, 0.4, -0.9, -2.0].forEach((dx, i) => {
        children.push(
            h(
                "mesh",
                {
                    key: `dh-r-${i}`,
                    position: [dx, bodyCenterY + 0.06, W / 2 + 0.015],
                },
                h("boxGeometry", { args: [0.22, 0.022, 0.035] }),
                gold()
            ),
            h(
                "mesh",
                {
                    key: `dh-l-${i}`,
                    position: [dx, bodyCenterY + 0.06, -(W / 2 + 0.015)],
                },
                h("boxGeometry", { args: [0.22, 0.022, 0.035] }),
                gold()
            )
        );
    });

    // ============ SIDE MIRRORS ============
    const mirrorX = wsCx - 0.6;
    children.push(
        rbox(
            "mir-r",
            { position: [mirrorX, cabinCenterY - 0.05, W / 2 + 0.13] },
            [0.13, 0.09, 0.18],
            paint(),
            0.05,
            3
        ),
        rbox(
            "mir-l",
            { position: [mirrorX, cabinCenterY - 0.05, -(W / 2 + 0.13)] },
            [0.13, 0.09, 0.18],
            paint(),
            0.05,
            3
        )
    );

    // ============ ROOF FIN / SUNROOF ACCENT ============
    children.push(
        h(
            "mesh",
            {
                key: "roof-band",
                position: [ghCx, cabinCenterY + HC / 2 + 0.003, 0],
            },
            h("boxGeometry", { args: [ghLen - 0.5, 0.005, W - 0.5] }),
            darkMetal()
        ),
        rbox(
            "shark-fin",
            { position: [ghCx - ghLen / 2 + 0.6, cabinCenterY + HC / 2 + 0.05, 0] },
            [0.2, 0.08, 0.06],
            paint(),
            0.025,
            3
        )
    );

    // ============ EXHAUST TIPS ============
    children.push(
        h(
            "group",
            {
                key: "ex-r",
                position: [-(L / 2) - 0.02, bodyCenterY - 0.32, 0.45],
                rotation: [0, 0, Math.PI / 2],
            },
            h(
                "mesh",
                null,
                h("cylinderGeometry", { args: [0.055, 0.055, 0.1, 18] }),
                gold()
            )
        ),
        h(
            "group",
            {
                key: "ex-l",
                position: [-(L / 2) - 0.02, bodyCenterY - 0.32, -0.45],
                rotation: [0, 0, Math.PI / 2],
            },
            h(
                "mesh",
                null,
                h("cylinderGeometry", { args: [0.055, 0.055, 0.1, 18] }),
                gold()
            )
        )
    );

    // ============ WHEELS — perfectly parallel axles, identical size ============
    const frontAxleX = hoodCx - hoodLen / 2 + 0.1;
    const rearAxleX = trunkCx + trunkLen / 2 - 0.1;
    const wheelZ = 0.92;

    children.push(
        h(Wheel, { key: "wfr", position: [frontAxleX, wheelY, wheelZ] }),
        h(Wheel, { key: "wfl", position: [frontAxleX, wheelY, -wheelZ] }),
        h(Wheel, { key: "wrr", position: [rearAxleX, wheelY, wheelZ] }),
        h(Wheel, { key: "wrl", position: [rearAxleX, wheelY, -wheelZ] })
    );

    // ============ FENDER ARCHES (wheel wells) ============
    children.push(
        h(FenderArch, { key: "fafr", x: frontAxleX, side: 1 }),
        h(FenderArch, { key: "fafl", x: frontAxleX, side: -1 }),
        h(FenderArch, { key: "farr", x: rearAxleX, side: 1 }),
        h(FenderArch, { key: "farl", x: rearAxleX, side: -1 })
    );

    // ============ DARK WELL INTERIOR (hides the wheel-body gap) ============
    [frontAxleX, rearAxleX].forEach((wx, i) => {
        children.push(
            h(
                "mesh",
                { key: `well-r-${i}`, position: [wx, 0.4, wheelZ - 0.04] },
                h("boxGeometry", { args: [0.95, 0.4, 0.06] }),
                darkMetal()
            ),
            h(
                "mesh",
                { key: `well-l-${i}`, position: [wx, 0.4, -(wheelZ - 0.04)] },
                h("boxGeometry", { args: [0.95, 0.4, 0.06] }),
                darkMetal()
            )
        );
    });

    // ============ UNDERGLOW SIGNATURE ============
    children.push(
        h(
            "mesh",
            {
                key: "underglow",
                position: [0, -0.42, 0],
                rotation: [-Math.PI / 2, 0, 0],
            },
            h("planeGeometry", { args: [L + 0.8, W + 1.2] }),
            h("meshBasicMaterial", {
                color: "#d4af37",
                transparent: true,
                opacity: 0.14,
            })
        )
    );

    return h(
        "group",
        { ref: group, position: [0, -0.4, 0], rotation: [0, -0.45, 0], scale: 0.85 },
        ...children
    );
}
