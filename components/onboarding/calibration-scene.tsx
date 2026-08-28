"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { animate, spring, type JSAnimation } from "animejs";

import type { CalibrationState } from "./calibration-state";

const GRAPHITE = 0x24272b;
const GRAPHITE_LIGHT = 0x3a3e44;
const IVORY = 0xf7f8f8;
const LIME = 0xdfff00;

const INDUSTRY_SLOTS = 8;

interface Rig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  coreModule: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  coreRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
  industryRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
  sizeRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
  industryModules: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[];
  sizeMarker: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  sizePivot: THREE.Group;
  pathways: THREE.Mesh<THREE.TubeGeometry, THREE.MeshStandardMaterial>[];
  dials: THREE.Group[];
  dialFaces: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[];
  energyArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  energyIndexCount: number;
  disposables: Array<{ dispose: () => void }>;
}

interface TweenTargets {
  coreScale: number;
  coreY: number;
  coreEmissive: number;
  coreRingEmissive: number;
  industryRingScale: number;
  sizeRingScale: number;
  sizeAngle: number;
  sizeMarkerScale: number;
  moduleScales: number[];
  pathwayGrow: number[];
  pathwayEmissive: number[];
  dialAngles: number[];
  dialEmissive: number[];
  energyProgress: number;
  rootTilt: number;
  idlePhase: number;
}

function createInitialTargets(): TweenTargets {
  return {
    coreScale: 0.001,
    coreY: 0.9,
    coreEmissive: 0,
    coreRingEmissive: 0,
    industryRingScale: 0.001,
    sizeRingScale: 0.001,
    sizeAngle: 0,
    sizeMarkerScale: 0.001,
    moduleScales: Array.from({ length: INDUSTRY_SLOTS }, () => 0.001),
    pathwayGrow: [0.001, 0.001],
    pathwayEmissive: [0, 0],
    dialAngles: [0, 0],
    dialEmissive: [0, 0],
    energyProgress: 0.04,
    rootTilt: 0.42,
    idlePhase: 0,
  };
}

function buildRig(container: HTMLElement): Rig {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    50
  );
  camera.position.set(0, 1.6, 6.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.32));
  const key = new THREE.DirectionalLight(0xfff8e8, 1.5);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfff00, 0.25);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const matteMaterial = (overrides: THREE.MeshStandardMaterialParameters = {}) =>
    track(
      new THREE.MeshStandardMaterial({
        color: GRAPHITE,
        roughness: 0.86,
        metalness: 0.32,
        emissive: LIME,
        emissiveIntensity: 0,
        ...overrides,
      })
    );

  // Central module: an octagonal weighted block that installs on step 1.
  const coreModule = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.52, 0.58, 0.42, 8)),
    matteMaterial({ color: GRAPHITE_LIGHT })
  );
  root.add(coreModule);

  const coreRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.95, 0.05, 12, 96)),
    matteMaterial()
  );
  coreRing.rotation.x = Math.PI / 2;
  root.add(coreRing);

  // Fine mechanical tick markings around the base plane.
  const tickPositions: number[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const isMajor = i % 8 === 0;
    const r0 = 2.42;
    const r1 = isMajor ? 2.62 : 2.52;
    tickPositions.push(Math.cos(a) * r0, 0, Math.sin(a) * r0);
    tickPositions.push(Math.cos(a) * r1, 0, Math.sin(a) * r1);
  }
  const tickGeometry = track(new THREE.BufferGeometry());
  tickGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(tickPositions, 3)
  );
  const ticks = new THREE.LineSegments(
    tickGeometry,
    track(new THREE.LineBasicMaterial({ color: GRAPHITE_LIGHT, transparent: true, opacity: 0.7 }))
  );
  root.add(ticks);

  // Industry ring with pre-built module slots.
  const industryRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.55, 0.035, 10, 96)),
    matteMaterial()
  );
  industryRing.rotation.x = Math.PI / 2;
  root.add(industryRing);

  const industryModules: Rig["industryModules"] = [];
  const moduleGeometry = track(new THREE.BoxGeometry(0.22, 0.14, 0.3));
  for (let i = 0; i < INDUSTRY_SLOTS; i++) {
    const slot = new THREE.Mesh(moduleGeometry, matteMaterial({ color: GRAPHITE_LIGHT }));
    const a = (i / INDUSTRY_SLOTS) * Math.PI * 2;
    slot.position.set(Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55);
    slot.lookAt(0, 0, 0);
    root.add(slot);
    industryModules.push(slot);
  }

  // Company-size ring with an orbiting weight marker.
  const sizeRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.05, 0.025, 10, 96)),
    matteMaterial()
  );
  sizeRing.rotation.x = Math.PI / 2;
  root.add(sizeRing);

  const sizePivot = new THREE.Group();
  root.add(sizePivot);
  const sizeMarker = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.16, 0.2, 0.16)),
    matteMaterial({ color: GRAPHITE_LIGHT })
  );
  sizeMarker.position.set(2.05, 0, 0);
  sizePivot.add(sizeMarker);

  // Buyer / motion pathways: curved beams from the outer ring into the core.
  const pathways: Rig["pathways"] = [];
  const pathwayAngles = [Math.PI * 0.82, Math.PI * 1.68];
  for (const angle of pathwayAngles) {
    const from = new THREE.Vector3(Math.cos(angle) * 2.05, 0, Math.sin(angle) * 2.05);
    const mid = new THREE.Vector3(Math.cos(angle) * 1.3, 0.5, Math.sin(angle) * 1.3);
    const to = new THREE.Vector3(Math.cos(angle) * 0.62, 0.16, Math.sin(angle) * 0.62);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const pathway = new THREE.Mesh(
      track(new THREE.TubeGeometry(curve, 24, 0.03, 8)),
      matteMaterial({ color: GRAPHITE_LIGHT })
    );
    root.add(pathway);
    pathways.push(pathway);
  }

  // Deal-size and sales-cycle dials, seated at the front edge.
  const dials: THREE.Group[] = [];
  const dialFaces: Rig["dialFaces"] = [];
  const dialGeometry = track(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24));
  const notchGeometry = track(new THREE.BoxGeometry(0.05, 0.14, 0.22));
  for (const x of [-1.05, 1.05]) {
    const dial = new THREE.Group();
    dial.position.set(x, 0.06, 2.35);
    const face = new THREE.Mesh(dialGeometry, matteMaterial({ color: GRAPHITE_LIGHT }));
    dial.add(face);
    const notch = new THREE.Mesh(notchGeometry, matteMaterial({ color: IVORY }));
    notch.position.set(0, 0.02, 0.19);
    dial.add(notch);
    root.add(dial);
    dials.push(dial);
    dialFaces.push(face);
  }

  // The single restrained energy line: arc length tracks overall completion.
  const energyGeometry = track(new THREE.TorusGeometry(1.25, 0.018, 8, 128));
  const energyArc = new THREE.Mesh(
    energyGeometry,
    track(new THREE.MeshBasicMaterial({ color: LIME }))
  );
  energyArc.rotation.x = Math.PI / 2;
  root.add(energyArc);
  const energyIndexCount = energyGeometry.index ? energyGeometry.index.count : 0;
  energyGeometry.setDrawRange(0, Math.floor(energyIndexCount * 0.04));

  container.appendChild(renderer.domElement);

  return {
    renderer,
    scene,
    camera,
    root,
    coreModule,
    coreRing,
    industryRing,
    sizeRing,
    industryModules,
    sizeMarker,
    sizePivot,
    pathways,
    dials,
    dialFaces,
    energyArc,
    energyIndexCount,
    disposables,
  };
}

function applyTargets(rig: Rig, t: TweenTargets) {
  rig.coreModule.scale.setScalar(Math.max(t.coreScale, 0.001));
  rig.coreModule.position.y = t.coreY;
  rig.coreModule.material.emissiveIntensity = t.coreEmissive;
  rig.coreRing.material.emissiveIntensity = t.coreRingEmissive;
  rig.industryRing.scale.setScalar(Math.max(t.industryRingScale, 0.001));
  rig.sizeRing.scale.setScalar(Math.max(t.sizeRingScale, 0.001));
  rig.sizePivot.rotation.y = -t.sizeAngle;
  rig.sizeMarker.scale.setScalar(Math.max(t.sizeMarkerScale, 0.001));
  rig.industryModules.forEach((module, i) => {
    module.scale.setScalar(Math.max(t.moduleScales[i], 0.001));
  });
  rig.pathways.forEach((pathway, i) => {
    pathway.scale.setScalar(Math.max(t.pathwayGrow[i], 0.001));
    pathway.material.emissiveIntensity = t.pathwayEmissive[i];
  });
  rig.dials.forEach((dial, i) => {
    dial.rotation.y = t.dialAngles[i];
    rig.dialFaces[i].material.emissiveIntensity = t.dialEmissive[i];
  });
  rig.energyArc.geometry.setDrawRange(
    0,
    Math.floor(rig.energyIndexCount * Math.min(Math.max(t.energyProgress, 0), 1))
  );
  rig.root.rotation.x = t.rootTilt;
}

export default function CalibrationScene({
  state,
  reducedMotion,
  onStatusChange,
}: {
  state: CalibrationState;
  reducedMotion: boolean;
  onStatusChange: (ok: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<Rig | null>(null);
  const targetsRef = useRef<TweenTargets>(createInitialTargets());
  const animationsRef = useRef<Set<JSAnimation>>(new Set());
  const prevStateRef = useRef<CalibrationState | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rig: Rig;
    try {
      const probe = document.createElement("canvas");
      const gl =
        probe.getContext("webgl2") ?? probe.getContext("webgl");
      if (!gl) throw new Error("WebGL unavailable");
      rig = buildRig(container);
    } catch {
      onStatusChange(false);
      return;
    }
    rigRef.current = rig;

    let contextLost = false;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      onStatusChange(false);
    };
    rig.renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    const animations = animationsRef.current;
    const targets = targetsRef.current;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      rig.camera.aspect = width / height;
      rig.camera.updateProjectionMatrix();
      rig.renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (contextLost) return;
      const delta = Math.min(now - last, 64) / 1000;
      last = now;
      applyTargets(rig, targets);
      if (!reducedMotionRef.current) {
        rig.root.rotation.y += delta * 0.12;
        targets.idlePhase += delta;
        rig.coreModule.position.y =
          targets.coreY + Math.sin(targets.idlePhase * 1.4) * 0.02;
      }
      rig.renderer.render(rig.scene, rig.camera);
    };
    frame = requestAnimationFrame(loop);

    // Seed the instrument from the hydrated profile without animation, then
    // run the calibration diff against a "blank" previous state.
    prevStateRef.current = null;
    onStatusChange(true);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      rig.renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      rig.disposables.forEach((item) => item.dispose());
      rig.renderer.dispose();
      rig.renderer.domElement.remove();
      rigRef.current = null;
      prevStateRef.current = null;
    };
  }, [onStatusChange]);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;

    const targets = targetsRef.current;
    const animations = animationsRef.current;
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    const instant = reducedMotionRef.current || prev === null;
    const CONFIG_KEYS = new Set(["duration", "ease", "delay", "onComplete"]);
    const run = (
      tweenTargets: object,
      params: Record<string, unknown>
    ) => {
      if (instant) {
        // Reduced motion / initial hydration: jump straight to the end state.
        for (const [key, value] of Object.entries(params)) {
          if (CONFIG_KEYS.has(key) || typeof value !== "number") continue;
          (tweenTargets as Record<string, number>)[key] = value;
        }
        return;
      }
      const animation = animate(tweenTargets, {
        ...params,
        onComplete: () => animations.delete(animation),
      });
      animations.add(animation);
    };

    const softSpring = spring({ stiffness: 120, damping: 14 });
    const lockSpring = spring({ stiffness: 260, damping: 17 });

    // Stage 0 — the core activates as soon as the scene exists.
    if (!prev) {
      run(targets, { coreRingEmissive: 0.35, duration: 900, ease: "outQuad" });
    }

    // Offer: install the central module.
    if (state.coreInstalled !== (prev?.coreInstalled ?? false)) {
      if (state.coreInstalled) {
        run(targets, {
          coreScale: 1,
          coreY: 0.16,
          coreEmissive: 0.5,
          duration: 700,
          ease: softSpring,
        });
      } else {
        run(targets, { coreScale: 0.001, coreY: 0.9, coreEmissive: 0, duration: 300, ease: "outQuad" });
      }
    }

    // Ideal accounts: populate the industry and size rings.
    const visibleModules = Math.min(state.industryCount, INDUSTRY_SLOTS);
    const prevModules = Math.min(prev?.industryCount ?? 0, INDUSTRY_SLOTS);
    if (state.stage >= 1 || visibleModules > 0) {
      run(targets, { industryRingScale: 1, sizeRingScale: 1, duration: 650, ease: "outCubic" });
    }
    if (visibleModules !== prevModules) {
      for (let i = 0; i < INDUSTRY_SLOTS; i++) {
        const target = i < visibleModules ? 1 : 0.001;
        if (targets.moduleScales[i] === target) continue;
        run(targets.moduleScales, {
          [i]: target,
          duration: 450,
          delay: instant ? 0 : Math.max(0, i - prevModules) * 70,
          ease: softSpring,
        });
      }
    }
    if (state.sizeIndex !== (prev?.sizeIndex ?? -1)) {
      if (state.sizeIndex >= 0) {
        run(targets, {
          sizeMarkerScale: 1,
          sizeAngle: (state.sizeIndex / 4) * Math.PI * 2 + Math.PI / 6,
          duration: 800,
          ease: lockSpring,
        });
      } else {
        run(targets, { sizeMarkerScale: 0.001, duration: 250, ease: "outQuad" });
      }
    }

    // Buying motion: connect the two pathways.
    const pathwayStates = [state.buyerIndex >= 0, state.motionIndex >= 0];
    const prevPathwayStates = [
      (prev?.buyerIndex ?? -1) >= 0,
      (prev?.motionIndex ?? -1) >= 0,
    ];
    pathwayStates.forEach((connected, i) => {
      if (connected === prevPathwayStates[i]) return;
      run(targets.pathwayGrow, {
        [i]: connected ? 1 : 0.001,
        duration: 550,
        ease: "outCubic",
      });
      run(targets.pathwayEmissive, {
        [i]: connected ? 0.85 : 0,
        duration: 550,
        ease: "outQuad",
      });
    });

    // Deal profile: lock the dials.
    const dialIndices = [state.dealIndex, state.cycleIndex];
    const prevDialIndices = [prev?.dealIndex ?? -1, prev?.cycleIndex ?? -1];
    dialIndices.forEach((index, i) => {
      if (index === prevDialIndices[i]) return;
      run(targets.dialAngles, {
        [i]: index >= 0 ? (index / 4) * Math.PI * 1.5 + Math.PI / 8 : 0,
        duration: 850,
        ease: lockSpring,
      });
      run(targets.dialEmissive, {
        [i]: index >= 0 ? 0.7 : 0,
        duration: 400,
        ease: "outQuad",
      });
    });

    // Energy line follows overall completion; ready state settles the tilt.
    run(targets, {
      energyProgress: Math.max(0.04, state.completion),
      duration: 700,
      ease: "inOutQuad",
    });
    if (state.ready !== (prev?.ready ?? false)) {
      run(targets, {
        rootTilt: state.ready ? 0.52 : 0.42,
        coreEmissive: state.ready ? 0.85 : 0.5,
        duration: 900,
        ease: "inOutCubic",
      });
    }

    if (instant && rig) {
      applyTargets(rig, targets);
      rig.renderer.render(rig.scene, rig.camera);
    }
  }, [state]);

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
