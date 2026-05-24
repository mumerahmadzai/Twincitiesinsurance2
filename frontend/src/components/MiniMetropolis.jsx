import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";

const h = React.createElement;

// ---------- Materials ----------
const obsidian = () =>
    h("meshPhysicalMaterial", {
        attach: "material",
        color: "#070707",
        metalness: 0.6,
        roughness: 0.42,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.55,
    });

const gold = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#d4af37",
        metalness: 0.9,
        roughness: 0.15,
        envMapIntensity: 0.9,
    });

const darkGlass = () =>
    h("meshPhysicalMaterial", {
        attach: "material",
        color: "#0a0d14",
        metalness: 0.2,
        roughness: 0.06,
        transmission: 0.5,
        transparent: true,
        opacity: 0.7,
        ior: 1.45,
        thickness: 0.4,
        envMapIntensity: 1.0,
    });

const warmGlow = (intensity = 1.6) =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#ffd58a",
        emissive: "#ffb347",
        emissiveIntensity: intensity,
        toneMapped: false,
    });

const coolGlow = (intensity = 1.4) =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#ffffff",
        emissive: "#e8f0ff",
        emissiveIntensity: intensity,
        toneMapped: false,
    });

const matteDark = () =>
    h("meshStandardMaterial", {
        attach: "material",
        color: "#111111",
        metalness: 0.4,
        roughness: 0.75,
    });

const goldUnderglow = () =>
    h("meshBasicMaterial", {
        attach: "material",
        color: "#d4af37",
        transparent: true,
        opacity: 0.18,
    });

// ---------- Helpers ----------
const rbox = (key, props, args, mat, radius = 0.05, smoothness = 3) =>
    h(RoundedBox, { key, args, radius, smoothness, ...props }, mat);

// ============ Residential Home (Personal Lines) ============
function ResidentialHome({ onPick }) {
    const ref = useRef();
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        const sp =
            (typeof window !== "undefined" &&
                window.__tciScroll &&
                window.__tciScroll.progress) ||
            0;
        // Mid-depth parallax: home shifts moderately toward camera with scroll
        ref.current.position.y = Math.sin(t * 0.6) * 0.02;
        ref.current.position.z = 0.6 + sp * 0.45;
        ref.current.position.x = -2.2 - sp * 0.15;
    });

    // Two staggered volumes for a modern cantilevered look
    const groundFloorH = 0.6;
    const upperFloorH = 0.5;

    return h(
        "group",
        {
            ref,
            position: [-2.2, 0, 0.6],
            onClick: (e) => {
                e.stopPropagation();
                onPick && onPick("home_auto_bundle");
            },
            onPointerOver: (e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
            },
            onPointerOut: () => {
                document.body.style.cursor = "default";
            },
        },
        // Ground floor (wider)
        rbox(
            "gf",
            { position: [0, groundFloorH / 2, 0], castShadow: true, receiveShadow: true },
            [1.7, groundFloorH, 1.3],
            obsidian(),
            0.04
        ),
        // Upper floor (cantilevered, narrower & longer in Z)
        rbox(
            "uf",
            {
                position: [0.18, groundFloorH + upperFloorH / 2, -0.05],
                castShadow: true,
            },
            [1.45, upperFloorH, 1.55],
            obsidian(),
            0.05
        ),
        // Stylized flat angled roof slab (gold edge)
        h(
            "mesh",
            {
                key: "roof",
                position: [0.18, groundFloorH + upperFloorH + 0.06, -0.05],
                rotation: [0, 0, 0.06],
                castShadow: true,
            },
            h("boxGeometry", { args: [1.55, 0.04, 1.65] }),
            gold()
        ),
        // Roof inner panel (dark)
        h(
            "mesh",
            {
                key: "roof-inner",
                position: [0.18, groundFloorH + upperFloorH + 0.04, -0.05],
                rotation: [0, 0, 0.06],
            },
            h("boxGeometry", { args: [1.48, 0.02, 1.58] }),
            matteDark()
        ),
        // Gold-framed entryway (front-right)
        h(
            "mesh",
            {
                key: "door-frame",
                position: [0.6, 0.28, 0.66],
            },
            h("boxGeometry", { args: [0.28, 0.5, 0.04] }),
            gold()
        ),
        h(
            "mesh",
            {
                key: "door",
                position: [0.6, 0.28, 0.68],
            },
            h("boxGeometry", { args: [0.22, 0.42, 0.02] }),
            matteDark()
        ),
        // Warm amber ground-floor windows (front)
        ...[-0.45, -0.1].map((x, i) =>
            h(
                "mesh",
                { key: `gf-win-${i}`, position: [x, 0.32, 0.66] },
                h("boxGeometry", { args: [0.22, 0.28, 0.02] }),
                warmGlow(1.8)
            )
        ),
        // Ground floor window gold trim
        ...[-0.45, -0.1].map((x, i) =>
            h(
                "mesh",
                { key: `gf-trim-${i}`, position: [x, 0.32, 0.673] },
                h("boxGeometry", { args: [0.24, 0.3, 0.008] }),
                gold()
            )
        ),
        // Upper floor large picture window (long horizontal)
        h(
            "mesh",
            {
                key: "uf-win",
                position: [0.18, groundFloorH + upperFloorH / 2, 0.73],
            },
            h("boxGeometry", { args: [1.0, 0.32, 0.02] }),
            warmGlow(1.6)
        ),
        h(
            "mesh",
            {
                key: "uf-win-frame",
                position: [0.18, groundFloorH + upperFloorH / 2, 0.745],
            },
            h("boxGeometry", { args: [1.04, 0.36, 0.01] }),
            gold()
        ),
        // Mullions splitting the picture window
        ...[-0.25, 0.18, 0.55].map((x, i) =>
            h(
                "mesh",
                {
                    key: `mul-${i}`,
                    position: [x, groundFloorH + upperFloorH / 2, 0.748],
                },
                h("boxGeometry", { args: [0.02, 0.34, 0.012] }),
                gold()
            )
        ),
        // Side windows on the cantilevered upper floor
        ...[-0.7, -0.05, 0.6].map((x, i) =>
            h(
                "mesh",
                {
                    key: `side-win-${i}`,
                    position: [x, groundFloorH + upperFloorH / 2, -0.79],
                },
                h("boxGeometry", { args: [0.22, 0.2, 0.02] }),
                warmGlow(1.4)
            )
        ),
        // Driveway light pillars (slim gold posts)
        ...[0.95, 0.95].map((_, i) => {
            const z = i === 0 ? 0.45 : -0.1;
            return h(
                "mesh",
                { key: `lp-${i}`, position: [0.95, 0.3, z] },
                h("boxGeometry", { args: [0.04, 0.6, 0.04] }),
                gold()
            );
        }),
        // Floating product label
        h(
            Html,
            {
                position: [0, groundFloorH + upperFloorH + 0.5, 0],
                center: true,
                style: { pointerEvents: "none" },
            },
            h(
                "div",
                { className: "scene-label" },
                h("div", { className: "scene-label__title" }, "Personal Lines"),
                h(
                    "div",
                    { className: "scene-label__sub" },
                    "Home · Renters · Auto · Umbrella"
                )
            )
        )
    );
}

// ============ Corporate Office (Commercial Lines) ============
function CorporateOffice({ onPick }) {
    const ref = useRef();
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        const sp =
            (typeof window !== "undefined" &&
                window.__tciScroll &&
                window.__tciScroll.progress) ||
            0;
        // Background-depth parallax: tower barely moves
        ref.current.position.y = Math.sin(t * 0.5 + 1) * 0.02;
        ref.current.position.z = -0.4 - sp * 0.1;
        ref.current.position.x = 2.4 + sp * 0.08;
    });

    const podiumH = 0.4;
    const towerH = 1.9;
    const towerW = 1.05;
    const towerD = 1.05;

    // Build floor strips (window bands) for the tower
    const floors = [];
    const numFloors = 7;
    for (let i = 0; i < numFloors; i++) {
        const y = podiumH + 0.16 + i * (towerH / numFloors);
        floors.push(
            // Glass band
            h(
                "mesh",
                { key: `floor-glass-${i}`, position: [0, y, towerD / 2 + 0.005] },
                h("boxGeometry", { args: [towerW - 0.18, 0.16, 0.012] }),
                darkGlass()
            ),
            // Mirror to back
            h(
                "mesh",
                { key: `floor-glass-b-${i}`, position: [0, y, -(towerD / 2 + 0.005)] },
                h("boxGeometry", { args: [towerW - 0.18, 0.16, 0.012] }),
                darkGlass()
            ),
            // Sides
            h(
                "mesh",
                { key: `floor-glass-r-${i}`, position: [towerW / 2 + 0.005, y, 0] },
                h("boxGeometry", { args: [0.012, 0.16, towerD - 0.18] }),
                darkGlass()
            ),
            h(
                "mesh",
                { key: `floor-glass-l-${i}`, position: [-(towerW / 2 + 0.005), y, 0] },
                h("boxGeometry", { args: [0.012, 0.16, towerD - 0.18] }),
                darkGlass()
            ),
            // Random interior lights (a couple of windows lit per floor)
            i % 2 === 0
                ? h(
                      "mesh",
                      {
                          key: `lit-${i}`,
                          position: [-0.18 + (i % 3) * 0.18, y, towerD / 2 + 0.008],
                      },
                      h("boxGeometry", { args: [0.14, 0.12, 0.005] }),
                      coolGlow(1.2)
                  )
                : null
        );
    }

    return h(
        "group",
        {
            ref,
            position: [2.4, 0, -0.4],
            onClick: (e) => {
                e.stopPropagation();
                onPick && onPick("small_business_lines");
            },
            onPointerOver: (e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
            },
            onPointerOut: () => {
                document.body.style.cursor = "default";
            },
        },
        // Podium / retail base
        rbox(
            "podium",
            { position: [0, podiumH / 2, 0], castShadow: true, receiveShadow: true },
            [towerW + 0.6, podiumH, towerD + 0.6],
            obsidian(),
            0.04
        ),
        // Podium gold pin-stripe top
        h(
            "mesh",
            { key: "podium-stripe", position: [0, podiumH + 0.005, 0] },
            h("boxGeometry", { args: [towerW + 0.62, 0.012, towerD + 0.62] }),
            gold()
        ),
        // Retail glass front
        h(
            "mesh",
            { key: "retail-glass", position: [0, podiumH / 2, (towerD + 0.6) / 2 + 0.005] },
            h("boxGeometry", { args: [towerW + 0.4, podiumH - 0.08, 0.014] }),
            darkGlass()
        ),
        h(
            "mesh",
            { key: "retail-lit", position: [-0.2, podiumH / 2, (towerD + 0.6) / 2 + 0.009] },
            h("boxGeometry", { args: [0.4, podiumH - 0.16, 0.005] }),
            coolGlow(1.5)
        ),
        // Tower body (mostly hidden by glass façade)
        rbox(
            "tower",
            { position: [0, podiumH + towerH / 2, 0], castShadow: true },
            [towerW, towerH, towerD],
            obsidian(),
            0.03
        ),
        // Gold corner frames running full tower height
        ...[
            [towerW / 2, towerD / 2],
            [-towerW / 2, towerD / 2],
            [towerW / 2, -towerD / 2],
            [-towerW / 2, -towerD / 2],
        ].map((c, i) =>
            h(
                "mesh",
                { key: `corner-${i}`, position: [c[0], podiumH + towerH / 2, c[1]] },
                h("boxGeometry", { args: [0.04, towerH, 0.04] }),
                gold()
            )
        ),
        // Top crown (gold cap)
        h(
            "mesh",
            { key: "crown", position: [0, podiumH + towerH + 0.03, 0] },
            h("boxGeometry", { args: [towerW + 0.08, 0.06, towerD + 0.08] }),
            gold()
        ),
        // Antenna spire
        h(
            "mesh",
            { key: "antenna", position: [0, podiumH + towerH + 0.32, 0] },
            h("cylinderGeometry", { args: [0.012, 0.025, 0.5, 12] }),
            gold()
        ),
        h(
            "mesh",
            { key: "antenna-tip", position: [0, podiumH + towerH + 0.6, 0] },
            h("sphereGeometry", { args: [0.04, 16, 12] }),
            warmGlow(2.5)
        ),
        ...floors.filter(Boolean),
        // Floating label
        h(
            Html,
            {
                position: [0, podiumH + towerH + 0.9, 0],
                center: true,
                zIndexRange: [1, 0],
                style: { pointerEvents: "none" },
            },
            h(
                "div",
                { className: "scene-label" },
                h("div", { className: "scene-label__title" }, "Commercial Lines"),
                h(
                    "div",
                    { className: "scene-label__sub" },
                    "BOP · Workers' Comp · Inland Marine"
                )
            )
        )
    );
}

// ============ Sedan + Road (Mobility Lines) ============
function MobilitySector({ onPick }) {
    const groupRef = useRef();
    const sedanRef = useRef();
    const wheelRefs = [useRef(), useRef(), useRef(), useRef()];

    useFrame((state, dt) => {
        const t = state.clock.getElapsedTime();
        const sp =
            (typeof window !== "undefined" &&
                window.__tciScroll &&
                window.__tciScroll.progress) ||
            0;
        // Foreground-depth parallax: road + sedan group glides toward viewer
        if (groupRef.current) {
            groupRef.current.position.z = 1.4 + sp * 0.85;
            groupRef.current.position.y = sp * -0.04;
        }
        // Sedan drives back-and-forth along the X axis on the road
        if (sedanRef.current) {
            const x = Math.sin(t * 0.3) * 1.3;
            sedanRef.current.position.x = x;
            // Face direction
            const dir = Math.cos(t * 0.3);
            sedanRef.current.rotation.y = dir >= 0 ? 0 : Math.PI;
        }
        // Spin wheels
        wheelRefs.forEach((r) => {
            if (r.current) r.current.rotation.y += dt * 8;
        });
    });

    // Wheels
    const wheel = (key, ref, position) =>
        h(
            "group",
            { key, ref, position, rotation: [Math.PI / 2, 0, 0] },
            h(
                "mesh",
                null,
                h("cylinderGeometry", { args: [0.07, 0.07, 0.05, 20] }),
                matteDark()
            ),
            h(
                "mesh",
                { position: [0, 0.026, 0] },
                h("cylinderGeometry", { args: [0.045, 0.045, 0.008, 18] }),
                gold()
            )
        );

    return h(
        "group",
        { ref: groupRef, position: [0, 0, 1.4] },
        // Road platform (the winding street between buildings)
        h(
            "mesh",
            { position: [0, 0.005, 0], rotation: [-Math.PI / 2, 0, 0], receiveShadow: true },
            h("planeGeometry", { args: [5.5, 0.85] }),
            matteDark()
        ),
        // Gold center dashes
        ...Array.from({ length: 7 }, (_, i) => {
            const x = -2.4 + i * 0.85;
            return h(
                "mesh",
                {
                    key: `dash-${i}`,
                    position: [x, 0.012, 0],
                    rotation: [-Math.PI / 2, 0, 0],
                },
                h("planeGeometry", { args: [0.32, 0.04] }),
                gold()
            );
        }),
        // Gold curb edges
        h(
            "mesh",
            { position: [0, 0.015, 0.43] },
            h("boxGeometry", { args: [5.5, 0.025, 0.025] }),
            gold()
        ),
        h(
            "mesh",
            { position: [0, 0.015, -0.43] },
            h("boxGeometry", { args: [5.5, 0.025, 0.025] }),
            gold()
        ),
        // Sedan
        h(
            "group",
            {
                ref: sedanRef,
                position: [0, 0.06, 0],
                onClick: (e) => {
                    e.stopPropagation();
                    onPick && onPick("limousine_livery_fleet");
                },
                onPointerOver: (e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                },
                onPointerOut: () => {
                    document.body.style.cursor = "default";
                },
            },
            // Lower body
            rbox(
                "sd-low",
                { position: [0, 0.08, 0], castShadow: true },
                [0.95, 0.13, 0.36],
                obsidian(),
                0.04
            ),
            // Cabin
            rbox(
                "sd-cab",
                { position: [-0.05, 0.21, 0], castShadow: true },
                [0.55, 0.12, 0.32],
                obsidian(),
                0.05
            ),
            // Windshield (single sloped glass)
            h(
                "mesh",
                { position: [0.22, 0.21, 0], rotation: [0, 0, -0.4] },
                h("boxGeometry", { args: [0.16, 0.1, 0.3] }),
                darkGlass()
            ),
            // Rear glass
            h(
                "mesh",
                { position: [-0.32, 0.21, 0], rotation: [0, 0, 0.4] },
                h("boxGeometry", { args: [0.14, 0.09, 0.3] }),
                darkGlass()
            ),
            // Side glass
            h(
                "mesh",
                { position: [-0.05, 0.225, 0.165] },
                h("boxGeometry", { args: [0.42, 0.07, 0.012] }),
                darkGlass()
            ),
            h(
                "mesh",
                { position: [-0.05, 0.225, -0.165] },
                h("boxGeometry", { args: [0.42, 0.07, 0.012] }),
                darkGlass()
            ),
            // Headlights
            h(
                "mesh",
                { position: [0.475, 0.12, 0.13] },
                h("boxGeometry", { args: [0.012, 0.025, 0.06] }),
                coolGlow(2.0)
            ),
            h(
                "mesh",
                { position: [0.475, 0.12, -0.13] },
                h("boxGeometry", { args: [0.012, 0.025, 0.06] }),
                coolGlow(2.0)
            ),
            // Taillights
            h(
                "mesh",
                { position: [-0.475, 0.13, 0.12] },
                h("boxGeometry", { args: [0.012, 0.02, 0.06] }),
                h("meshStandardMaterial", {
                    color: "#3a0a0a",
                    emissive: "#ff2a2a",
                    emissiveIntensity: 1.6,
                })
            ),
            h(
                "mesh",
                { position: [-0.475, 0.13, -0.12] },
                h("boxGeometry", { args: [0.012, 0.02, 0.06] }),
                h("meshStandardMaterial", {
                    color: "#3a0a0a",
                    emissive: "#ff2a2a",
                    emissiveIntensity: 1.6,
                })
            ),
            // Gold trim line along the side
            h(
                "mesh",
                { position: [0, 0.13, 0.182] },
                h("boxGeometry", { args: [0.86, 0.006, 0.008] }),
                gold()
            ),
            h(
                "mesh",
                { position: [0, 0.13, -0.182] },
                h("boxGeometry", { args: [0.86, 0.006, 0.008] }),
                gold()
            ),
            // Wheels (small but identical)
            wheel("w1", wheelRefs[0], [0.3, 0.07, 0.19]),
            wheel("w2", wheelRefs[1], [0.3, 0.07, -0.19]),
            wheel("w3", wheelRefs[2], [-0.3, 0.07, 0.19]),
            wheel("w4", wheelRefs[3], [-0.3, 0.07, -0.19])
        ),
        // Floating label
        h(
            Html,
            {
                position: [0, 0.7, 0],
                center: true,
                zIndexRange: [1, 0],
                style: { pointerEvents: "none" },
            },
            h(
                "div",
                { className: "scene-label" },
                h("div", { className: "scene-label__title" }, "Mobility & Auto"),
                h(
                    "div",
                    { className: "scene-label__sub" },
                    "Auto · Livery Fleet · Cargo"
                )
            )
        )
    );
}

// ============ Ground platform + street accents ============
function Platform() {
    return h(
        "group",
        null,
        // Main matte black ground
        h(
            "mesh",
            { position: [0, -0.04, 0], rotation: [-Math.PI / 2, 0, 0], receiveShadow: true },
            h("planeGeometry", { args: [10, 6] }),
            h("meshStandardMaterial", {
                color: "#050505",
                metalness: 0.4,
                roughness: 0.7,
                envMapIntensity: 0.5,
            })
        ),
        // Gold border frame around the platform
        ...[
            { p: [0, -0.035, 2.95], s: [10, 0.03, 0.05] },
            { p: [0, -0.035, -2.95], s: [10, 0.03, 0.05] },
            { p: [4.95, -0.035, 0], s: [0.05, 0.03, 6] },
            { p: [-4.95, -0.035, 0], s: [0.05, 0.03, 6] },
        ].map((b, i) =>
            h(
                "mesh",
                { key: `frame-${i}`, position: b.p },
                h("boxGeometry", { args: b.s }),
                gold()
            )
        ),
        // Subtle gold grid lines on the ground (3 longitudinal)
        ...[-1.6, 0, 1.6].map((z, i) =>
            h(
                "mesh",
                { key: `gline-${i}`, position: [0, -0.038, z], rotation: [-Math.PI / 2, 0, 0] },
                h("planeGeometry", { args: [9.8, 0.008] }),
                h("meshBasicMaterial", {
                    color: "#d4af37",
                    transparent: true,
                    opacity: 0.18,
                    toneMapped: false,
                })
            )
        ),
        // Warm amber underglow plane below the platform
        h(
            "mesh",
            { position: [0, -0.06, 0], rotation: [-Math.PI / 2, 0, 0] },
            h("planeGeometry", { args: [11, 7] }),
            h("meshBasicMaterial", {
                color: "#f5c97a",
                transparent: true,
                opacity: 0.07,
                toneMapped: false,
            })
        )
    );
}

// ============ Main exported component ============
export default function MiniMetropolis({ mouse, onPick }) {
    const platformRef = useRef();

    useFrame(() => {
        if (!platformRef.current) return;
        // Soft cursor tilt of the whole platform
        const tx = (mouse.current?.y ?? 0) * 0.08;
        const tz = (mouse.current?.x ?? 0) * -0.08;
        platformRef.current.rotation.x +=
            (tx - platformRef.current.rotation.x) * 0.04;
        platformRef.current.rotation.z +=
            (tz - platformRef.current.rotation.z) * 0.04;
    });

    return h(
        "group",
        { ref: platformRef, position: [0, -0.4, 0] },
        h(Platform),
        h(ResidentialHome, { onPick }),
        h(CorporateOffice, { onPick }),
        h(MobilitySector, { onPick })
    );
}

// Sector focal points for scroll-driven camera (target = where to look, position = where the camera sits)
export const SCENE_FOCAL_POINTS = {
    overview: { target: [0, 0.3, 0], position: [7.0, 5.5, 7.0] },
    commercial: { target: [2.4, 0.9, -0.4], position: [3.6, 1.9, 3.0] },
    personal: { target: [-2.2, 0.5, 0.6], position: [-0.9, 1.7, 3.2] },
};
