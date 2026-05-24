import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import MiniMetropolis, { SCENE_FOCAL_POINTS } from "./MiniMetropolis";

const h = React.createElement;

// ---------- Camera rig: scroll-driven sector focus + cursor parallax + drag ----------
function CameraRig({ mouseRef, dragRef, scrollRef }) {
    const baseAngle = useRef(0);
    const lookAt = useRef([0, 0.4, 0]);

    useFrame((state, dt) => {
        const cam = state.camera;

        // Three-stage scroll journey: overview → commercial (mid) → personal (lower)
        const sp = scrollRef.current?.progress ?? 0;
        let focal;
        if (sp < 0.15) {
            focal = SCENE_FOCAL_POINTS.overview;
        } else if (sp < 0.5) {
            const k = Math.min(1, (sp - 0.15) / 0.35);
            focal = lerpFocal(SCENE_FOCAL_POINTS.overview, SCENE_FOCAL_POINTS.commercial, k);
        } else if (sp < 0.85) {
            const k = Math.min(1, (sp - 0.5) / 0.35);
            focal = lerpFocal(SCENE_FOCAL_POINTS.commercial, SCENE_FOCAL_POINTS.personal, k);
        } else {
            focal = SCENE_FOCAL_POINTS.personal;
        }

        // Drag inertia adds to a slow auto-rotate around Y
        dragRef.current.velocity *= 0.93;
        baseAngle.current -= dragRef.current.velocity;
        // Subtle auto-orbit only when no drag and at overview
        if (!dragRef.current.dragging && sp < 0.2) {
            baseAngle.current += dt * 0.05;
        }

        // Cursor parallax — small horizontal sway
        const cursorOffset = (mouseRef.current?.x ?? 0) * 0.18;
        const angle = baseAngle.current + cursorOffset;

        // Apply orbit around the focal target
        const tx = focal.target[0];
        const ty = focal.target[1];
        const tz = focal.target[2];
        const px = focal.position[0];
        const py = focal.position[1];
        const pz = focal.position[2];
        // Compute radius and angle from focal position relative to target
        const rx = px - tx;
        const rz = pz - tz;
        const radius = Math.sqrt(rx * rx + rz * rz);
        const baseFocAngle = Math.atan2(rz, rx);
        const finalAngle = baseFocAngle + angle;

        const targetCamX = tx + Math.cos(finalAngle) * radius;
        const targetCamZ = tz + Math.sin(finalAngle) * radius;
        const targetCamY = py + (mouseRef.current?.y ?? 0) * -0.25;

        // Smoother lerp (0.05 as requested) toward target camera position & lookAt
        cam.position.x += (targetCamX - cam.position.x) * 0.05;
        cam.position.y += (targetCamY - cam.position.y) * 0.05;
        cam.position.z += (targetCamZ - cam.position.z) * 0.05;

        lookAt.current[0] += (tx - lookAt.current[0]) * 0.05;
        lookAt.current[1] += (ty - lookAt.current[1]) * 0.05;
        lookAt.current[2] += (tz - lookAt.current[2]) * 0.05;
        cam.lookAt(lookAt.current[0], lookAt.current[1], lookAt.current[2]);
    });
    return null;
}

function lerpFocal(a, b, k) {
    const lerp = (x, y, t) => x + (y - x) * t;
    return {
        target: [
            lerp(a.target[0], b.target[0], k),
            lerp(a.target[1], b.target[1], k),
            lerp(a.target[2], b.target[2], k),
        ],
        position: [
            lerp(a.position[0], b.position[0], k),
            lerp(a.position[1], b.position[1], k),
            lerp(a.position[2], b.position[2], k),
        ],
    };
}

function Lights() {
    return h(
        React.Fragment,
        null,
        h("ambientLight", { intensity: 0.22 }),
        // Pure white overhead key panels
        h("directionalLight", {
            position: [-4, 9, 5],
            intensity: 2.2,
            color: "#ffffff",
            castShadow: true,
            "shadow-mapSize": [1024, 1024],
        }),
        h("directionalLight", {
            position: [5, 8, -3],
            intensity: 1.4,
            color: "#ffffff",
        }),
        // Warm amber underglow accent
        h("pointLight", {
            position: [0, -0.6, 0],
            intensity: 1.0,
            color: "#f5c97a",
            distance: 8,
        }),
        // Side gold rim
        h("pointLight", {
            position: [-6, 1.4, -4],
            intensity: 1.8,
            color: "#d4af37",
            distance: 20,
        })
    );
}

function Scene({ mouseRef, dragRef, scrollRef, onPick }) {
    return h(
        React.Fragment,
        null,
        h("color", { attach: "background", args: ["#000000"] }),
        h("fog", { attach: "fog", args: ["#000000", 14, 28] }),
        h(Lights),
        h(MiniMetropolis, { mouse: mouseRef, onPick }),
        h(ContactShadows, {
            position: [0, -0.44, 0],
            opacity: 0.55,
            scale: 14,
            blur: 3.2,
            far: 5.0,
            color: "#000000",
            resolution: 1024,
        }),
        h(Environment, {
            preset: "apartment",
            background: false,
            environmentIntensity: 0.5,
        }),
        h(CameraRig, { mouseRef, dragRef, scrollRef })
    );
}

export default function Hero3D({ onPick }) {
    const mouse = useRef({ x: 0, y: 0 });
    const drag = useRef({ dragging: false, lastX: 0, velocity: 0 });
    const scroll = useRef({ progress: 0 });

    useEffect(() => {
        const onMove = (e) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
            if (drag.current.dragging) {
                const dx = e.clientX - drag.current.lastX;
                drag.current.lastX = e.clientX;
                drag.current.velocity = dx * 0.005;
            }
        };
        const onTouch = (e) => {
            if (!e.touches || !e.touches.length) return;
            const t = e.touches[0];
            mouse.current.x = (t.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = (t.clientY / window.innerHeight) * 2 - 1;
            if (drag.current.dragging) {
                const dx = t.clientX - drag.current.lastX;
                drag.current.lastX = t.clientX;
                drag.current.velocity = dx * 0.005;
            }
        };
        const onUp = () => {
            drag.current.dragging = false;
        };
        // Scroll progress 0..1 over the FULL document scrollable range
        if (typeof window !== "undefined") {
            window.__tciScroll = window.__tciScroll || { progress: 0 };
        }
        const onScroll = () => {
            const max = Math.max(
                1,
                document.documentElement.scrollHeight - window.innerHeight
            );
            const p = Math.max(0, Math.min(1, window.scrollY / max));
            scroll.current.progress = p;
            if (window.__tciScroll) window.__tciScroll.progress = p;
        };
        onScroll();
        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("touchmove", onTouch, { passive: true });
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchend", onUp);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("touchmove", onTouch);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchend", onUp);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    const startDrag = (clientX) => {
        drag.current.dragging = true;
        drag.current.lastX = clientX;
        drag.current.velocity = 0;
    };

    return (
        <div
            className="hero-canvas"
            data-testid="hero-3d-canvas"
            onPointerDown={(e) => {
                if (
                    e.target &&
                    e.target.closest &&
                    (e.target.closest(".scene-label") ||
                        e.target.closest(".satellite-chip"))
                )
                    return;
                startDrag(e.clientX);
            }}
            style={{ cursor: "grab" }}
        >
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [7, 5.5, 7], fov: 30 }}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            >
                {h(Scene, { mouseRef: mouse, dragRef: drag, scrollRef: scroll, onPick })}
            </Canvas>
            <div data-testid="drag-hint" style={{ display: "none" }} />
        </div>
    );
}
