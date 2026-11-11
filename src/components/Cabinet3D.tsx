import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { DoorOpen, DoorClosed, Minus, Plus, Ruler, Pencil, X } from "lucide-react";
import { formatMm, type FurnitureConfig } from "@/lib/furniture";
import { getBoxes3D, type Box3D } from "@/lib/cabinet-3d";

interface Props {
  config: FurnitureConfig;
  onSelect: (step: number, side?: "gauche" | "droite") => void;
}

type FrontMode = "visibles" | "transparentes" | "masquees";
type ViewName = "3d" | "face" | "cote" | "dessus";

const COLORS = {
  structure: 0xe9e1d3,
  shelf: 0xe9e1d3,
  back: 0xd6c9b4,
  door: 0xfbf8f3,
  drawer: 0xfbf8f3,
  fixed: 0xfbf8f3,
} as const;
const EDGE = 0x3a3027;
const ACCENT = 0xc79a5b;
const VIEW_DIR: Record<ViewName, [number, number, number]> = {
  "3d": [0.85, 0.5, 1.25],
  face: [0, 0, 1],
  cote: [1, 0, 0],
  dessus: [0, 1, 0.001],
};
const isFront = (b: Box3D) => b.kind === "door" || b.kind === "drawer" || b.kind === "fixed";
const canOpen = (b: Box3D) => b.kind === "door" || b.kind === "drawer";

interface Part {
  box: Box3D;
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  center: THREE.Vector3;
  open: number;
}
interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  root: THREE.Group;
  dimLines: THREE.Group;
  parts: Part[];
  dirty: boolean;
  size: THREE.Vector3;
  camAnim: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null;
}

export function Cabinet3D({ config: c, onSelect }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const openTargets = useRef(new Map<string, boolean>());
  const labels = useRef<Array<HTMLSpanElement | null>>([]);
  const live = useRef({
    explode: 0,
    frontMode: "visibles" as FrontMode,
    selected: null as string | null,
    hovered: null as string | null,
    showDims: false,
  });
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [frontMode, setFrontMode] = useState<FrontMode>("visibles");
  const [explode, setExplode] = useState(0);
  const [showDims, setShowDims] = useState(false);
  const [view, setView] = useState<ViewName>("3d");
  const [, bump] = useState(0);

  const valid = [c.hauteur, c.largeur, c.profondeur].every((n) => Number.isFinite(n) && n > 0);
  const boxes = useMemo(() => (valid ? getBoxes3D(c) : []), [c, valid]);
  const selectedBox = boxes.find((b) => b.id === selected) ?? null;
  const openable = boxes.filter(canOpen);
  const anyOpen = openable.some((b) => openTargets.current.get(b.name));

  live.current.explode = explode;
  live.current.frontMode = frontMode;
  live.current.selected = selectedBox?.id ?? null;
  live.current.showDims = showDims;
  if (stage.current) stage.current.dirty = true;

  const fitDistance = (s: Stage) => {
    const r = s.size.length() / 2;
    const v = THREE.MathUtils.degToRad(s.camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * s.camera.aspect);
    return (r / Math.sin(Math.min(v, h))) * 1.3;
  };
  const goTo = (name: ViewName, animate = true) => {
    const s = stage.current;
    if (!s) return;
    const target = new THREE.Vector3(0, s.size.y / 2, 0);
    const to = new THREE.Vector3(...VIEW_DIR[name]).normalize().multiplyScalar(fitDistance(s)).add(target);
    s.controls.target.copy(target);
    if (animate) s.camAnim = { from: s.camera.position.clone(), to, t: 0 };
    else {
      s.camera.position.copy(to);
      s.controls.update();
    }
    s.dirty = true;
  };
  const zoom = (factor: number) => {
    const s = stage.current;
    if (!s) return;
    const offset = s.camera.position.clone().sub(s.controls.target).multiplyScalar(factor);
    const len = THREE.MathUtils.clamp(offset.length(), s.controls.minDistance, s.controls.maxDistance);
    s.camera.position.copy(s.controls.target).add(offset.setLength(len));
    s.dirty = true;
  };
  const toggle = (b: Box3D) => {
    openTargets.current.set(b.name, !openTargets.current.get(b.name));
    if (stage.current) stage.current.dirty = true;
    bump((n) => n + 1);
  };
  const setAll = (open: boolean) => {
    for (const b of openable) openTargets.current.set(b.name, open);
    if (stage.current) stage.current.dirty = true;
    bump((n) => n + 1);
  };

  // Scène, caméra et boucle de rendu : créées une seule fois.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("aria-label", "Vue 3D du meuble : glisser pour tourner");
    renderer.domElement.setAttribute("role", "img");
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 10, 100000);
    camera.position.set(1, 1, 2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8ab99, 1.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(1.2, 2, 1.6);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-1.5, 0.6, -1);
    scene.add(fill);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.92;
    const root = new THREE.Group();
    const dimLines = new THREE.Group();
    scene.add(root, dimLines);
    const s: Stage = {
      renderer,
      scene,
      camera,
      controls,
      root,
      dimLines,
      parts: [],
      dirty: true,
      size: new THREE.Vector3(1, 1, 1),
      camAnim: null,
    };
    stage.current = s;
    controls.addEventListener("change", () => {
      s.dirty = true;
    });
    controls.addEventListener("start", () => {
      s.camAnim = null;
    });

    // La molette fait défiler la page ; le zoom passe par le pincement (ou Ctrl + molette) et les boutons.
    const wheelGuard = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) e.stopPropagation();
    };
    el.addEventListener("wheel", wheelGuard, { capture: true });

    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      s.dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const ray = new THREE.Raycaster();
    const pick = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1),
        camera,
      );
      const hit = ray.intersectObjects(
        s.parts.filter((p) => p.pivot.visible).map((p) => p.mesh),
        false,
      )[0];
      return hit ? (s.parts.find((p) => p.mesh === hit.object) ?? null) : null;
    };
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
        down = null;
        return;
      }
      down = null;
      const p = pick(e);
      setSelected(p ? p.box.id : null);
      if (p && canOpen(p.box)) {
        openTargets.current.set(p.box.name, !openTargets.current.get(p.box.name));
        bump((n) => n + 1);
      }
      s.dirty = true;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.buttons) return;
      const p = pick(e);
      const id = p ? p.box.id : null;
      if (id !== live.current.hovered) {
        live.current.hovered = id;
        renderer.domElement.style.cursor = p ? "pointer" : "grab";
        s.dirty = true;
      }
    };
    const onLeave = () => {
      live.current.hovered = null;
      s.dirty = true;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const v = new THREE.Vector3();
    let raf = 0,
      last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let moving = false;
      if (s.camAnim) {
        s.camAnim.t = reduce ? 1 : Math.min(1, s.camAnim.t + dt / 0.45);
        const k = 1 - Math.pow(1 - s.camAnim.t, 3);
        const d0 = s.camAnim.from.clone().sub(controls.target),
          d1 = s.camAnim.to.clone().sub(controls.target);
        const len = THREE.MathUtils.lerp(d0.length(), d1.length(), k);
        camera.position.copy(controls.target).add(d0.normalize().lerp(d1.normalize(), k).setLength(len));
        if (s.camAnim.t >= 1) s.camAnim = null;
        moving = true;
      }
      const st = live.current;
      const mid = new THREE.Vector3(0, s.size.y / 2, 0);
      for (const p of s.parts) {
        const target = openTargets.current.get(p.box.name) ? 1 : 0;
        if (p.open !== target) {
          const step = reduce ? 1 : dt / 0.5;
          p.open = target > p.open ? Math.min(1, p.open + step) : Math.max(0, p.open - step);
          moving = true;
        }
        const k = p.open * p.open * (3 - 2 * p.open);
        v.copy(p.center)
          .sub(mid)
          .multiplyScalar(st.explode * 0.7);
        if (isFront(p.box)) v.z += st.explode * 160;
        if (p.box.kind === "back") v.z -= st.explode * 120;
        p.pivot.position.copy(p.base).add(v);
        if (p.box.kind === "door")
          p.pivot.rotation.y = (p.box.hinge === "right" ? 1 : -1) * k * THREE.MathUtils.degToRad(105);
        if (p.box.kind === "drawer") p.pivot.position.z += k * Math.min(320, s.size.z * 0.62);
        const front = isFront(p.box);
        p.pivot.visible = !(front && st.frontMode === "masquees");
        const m = p.mesh.material as THREE.MeshLambertMaterial;
        const ghost = front && st.frontMode === "transparentes";
        if (m.transparent !== ghost) {
          m.transparent = ghost;
          m.needsUpdate = true;
        }
        m.opacity = ghost ? 0.22 : 1;
        m.depthWrite = !ghost;
        m.color.setHex(st.selected === p.box.id ? ACCENT : COLORS[p.box.kind]);
        m.emissive.setHex(st.hovered === p.box.id && st.selected !== p.box.id ? 0x2a2014 : 0x000000);
      }
      if (controls.update()) moving = true;
      if (!s.dirty && !moving) return;
      s.dirty = false;
      dimLines.visible = st.showDims;
      renderer.render(scene, camera);
      // Cotes : étiquettes HTML posées sur la projection des milieux de lignes.
      const w = el.clientWidth,
        h = el.clientHeight;
      dimLines.children.forEach((line, i) => {
        const node = labels.current[i];
        if (!node) return;
        v.copy(line.userData.mid as THREE.Vector3).project(camera);
        node.style.display = st.showDims && v.z < 1 ? "block" : "none";
        node.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("wheel", wheelGuard, { capture: true });
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stage.current = null;
    };
  }, []);

  // Pièces : reconstruites à chaque changement de configuration, la caméra garde son angle.
  const sizeKey = `${c.hauteur}|${c.largeur}|${c.profondeur}`;
  const lastSize = useRef("");
  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    const previous = new Map(s.parts.map((p) => [p.box.name, p.open]));
    for (const p of s.parts) {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
      p.pivot.traverse((o) => {
        if (o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    }
    s.root.clear();
    s.dimLines.clear();
    s.parts = [];
    if (!valid) {
      s.dirty = true;
      return;
    }
    const W = c.largeur,
      H = c.hauteur,
      D = c.profondeur;
    s.size.set(W, H, D);
    for (const b of boxes) {
      const geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          color: COLORS[b.kind],
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      );
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: EDGE }),
      );
      edges.raycast = () => {};
      const center = new THREE.Vector3(b.x + b.w / 2 - W / 2, H - b.y - b.h / 2, D / 2 - b.z - b.d / 2);
      const pivot = new THREE.Group();
      const base = center.clone();
      if (b.kind === "door") {
        // Pivot sur l'arête côté charnière.
        const sign = b.hinge === "right" ? 1 : -1;
        const inset = c.typePorte === "interieur" ? -1 : 1; // porte intérieure : pivot au nu avant
        base.x += (sign * b.w) / 2;
        base.z -= (inset * b.d) / 2;
        mesh.position.set((-sign * b.w) / 2, 0, (inset * b.d) / 2);
        edges.position.copy(mesh.position);
      }
      pivot.add(mesh, edges);
      if (b.kind === "drawer") {
        // Volume indicatif du tiroir (hors feuille de débit : seules les faces sont débitées).
        const bw = Math.max(10, b.w - 2 * c.epaisseurMontants - 26),
          bh = Math.max(10, b.h - 30),
          bd = Math.max(10, Math.min(D - b.d - 60, 500));
        const ghostGeometry = new THREE.BoxGeometry(bw, bh, bd);
        const ghost = new THREE.LineSegments(
          new THREE.EdgesGeometry(ghostGeometry),
          new THREE.LineBasicMaterial({ color: EDGE, transparent: true, opacity: 0.35 }),
        );
        ghostGeometry.dispose();
        ghost.position.set(0, 0, -b.d / 2 - bd / 2);
        ghost.raycast = () => {};
        pivot.add(ghost);
      }
      pivot.position.copy(base);
      s.root.add(pivot);
      s.parts.push({ box: b, pivot, mesh, base, center, open: previous.get(b.name) ?? 0 });
    }
    // Lignes de cote : largeur (devant, en bas), hauteur (devant, à gauche), profondeur (à droite, en bas).
    const off = Math.max(W, H, D) * 0.07;
    const material = new THREE.LineBasicMaterial({ color: 0x815f31 });
    const dim = (a: [number, number, number], b: [number, number, number], tick: [number, number, number]) => {
      const A = new THREE.Vector3(...a),
        B = new THREE.Vector3(...b),
        T = new THREE.Vector3(...tick).multiplyScalar(off * 0.35);
      const pts = [A, B, A.clone().add(T), A.clone().sub(T), B.clone().add(T), B.clone().sub(T)];
      const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), material);
      line.userData.mid = A.clone().add(B).multiplyScalar(0.5);
      s.dimLines.add(line);
    };
    dim([-W / 2, -off, D / 2 + off], [W / 2, -off, D / 2 + off], [0, 1, 0]);
    dim([-W / 2 - off, 0, D / 2 + off], [-W / 2 - off, H, D / 2 + off], [1, 0, 0]);
    dim([W / 2 + off, -off, -D / 2], [W / 2 + off, -off, D / 2], [0, 1, 0]);
    s.controls.minDistance = s.size.length() * 0.45;
    s.controls.maxDistance = s.size.length() * 6;
    if (lastSize.current !== sizeKey) {
      // Dimensions modifiées : recadrer en gardant l'angle de vue courant.
      const first = lastSize.current === "";
      lastSize.current = sizeKey;
      const target = new THREE.Vector3(0, H / 2, 0);
      if (first) goTo("3d", false);
      else {
        const dir = s.camera.position.clone().sub(s.controls.target).normalize();
        s.controls.target.copy(target);
        s.camera.position.copy(target).add(dir.multiplyScalar(fitDistance(s)));
      }
    }
    s.dirty = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, valid, sizeKey]);

  const chip = "h-8 px-2.5 text-xs";
  return (
    <div className="space-y-2">
      <div
        ref={wrap}
        className="relative mx-auto aspect-[5/4] w-full max-w-[520px] overflow-hidden rounded-md border border-border bg-muted/30"
        style={{ cursor: "grab" }}
      >
        {["L", "H", "P"].map((k, i) => (
          <span
            key={k}
            ref={(n) => {
              labels.current[i] = n;
            }}
            className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground shadow-sm"
            style={{ display: "none" }}
          >
            {k} {formatMm([c.largeur, c.hauteur, c.profondeur][i])}
          </span>
        ))}
        {failed && (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
            La vue 3D n’est pas disponible sur cet appareil. Utilisez la vue Intérieur.
          </p>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-background/90"
            aria-label="Zoomer"
            onClick={() => zoom(0.82)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-background/90"
            aria-label="Dézoomer"
            onClick={() => zoom(1.22)}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        aria-live="polite"
        className="mx-auto flex min-h-10 max-w-[520px] flex-wrap items-center justify-end gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      >
        {selectedBox ? (
          <>
            <span className="min-w-[11rem] flex-1">
              <span className="font-medium">{selectedBox.name}</span>
              {selectedBox.dims && <span className="tabular-nums text-muted-foreground"> · {selectedBox.dims}</span>}
            </span>
            {canOpen(selectedBox) && (
              <Button type="button" variant="outline" size="sm" className={chip} onClick={() => toggle(selectedBox)}>
                {openTargets.current.get(selectedBox.name) ? "Fermer" : "Ouvrir"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={chip}
              onClick={() => onSelect(selectedBox.section, selectedBox.side)}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Désélectionner"
              onClick={() => setSelected(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">
            Glissez pour tourner. Touchez une pièce pour voir ses dimensions
            {openable.length > 0 ? ", une porte ou un tiroir pour l’ouvrir" : ""}.
          </span>
        )}
      </div>

      <div className="mx-auto flex max-w-[520px] flex-wrap items-center gap-1.5">
        <div
          role="group"
          aria-label="Angle de vue"
          className="flex gap-1 rounded-md border border-input bg-muted/40 p-1"
        >
          {(
            [
              ["3d", "3D"],
              ["face", "Face"],
              ["cote", "Côté"],
              ["dessus", "Dessus"],
            ] as Array<[ViewName, string]>
          ).map(([k, text]) => (
            <button
              key={k}
              type="button"
              aria-pressed={view === k}
              onClick={() => {
                setView(k);
                goTo(k);
              }}
              className={`min-h-8 rounded px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${view === k ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {text}
            </button>
          ))}
        </div>
        {openable.length > 0 && (
          <Button type="button" variant="outline" size="sm" className={chip} onClick={() => setAll(!anyOpen)}>
            {anyOpen ? <DoorClosed className="mr-1 h-3.5 w-3.5" /> : <DoorOpen className="mr-1 h-3.5 w-3.5" />}
            {anyOpen ? "Tout fermer" : "Tout ouvrir"}
          </Button>
        )}
        <Button
          type="button"
          variant={showDims ? "secondary" : "outline"}
          size="sm"
          className={chip}
          aria-pressed={showDims}
          onClick={() => setShowDims(!showDims)}
        >
          <Ruler className="mr-1 h-3.5 w-3.5" />
          Cotes
        </Button>
      </div>
      <div className="mx-auto flex max-w-[520px] flex-wrap items-center gap-x-4 gap-y-2">
        {boxes.some(isFront) && (
          <div
            role="group"
            aria-label="Affichage des façades"
            className="flex max-w-full flex-wrap items-center gap-1 rounded-md border border-input bg-muted/40 p-1"
          >
            <span className="px-1 text-xs text-muted-foreground">Façades</span>
            {(
              [
                ["visibles", "Visibles"],
                ["transparentes", "Transparentes"],
                ["masquees", "Masquées"],
              ] as Array<[FrontMode, string]>
            ).map(([k, text]) => (
              <button
                key={k}
                type="button"
                aria-pressed={frontMode === k}
                onClick={() => setFrontMode(k)}
                className={`min-h-8 rounded px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${frontMode === k ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <label
          className="flex min-w-[10rem] flex-1 items-center gap-2 text-xs text-muted-foreground"
          htmlFor="vue-eclatee"
        >
          Vue éclatée
          <input
            id="vue-eclatee"
            type="range"
            min={0}
            max={100}
            value={Math.round(explode * 100)}
            onChange={(e) => setExplode(Number(e.target.value) / 100)}
            className="h-8 min-w-0 flex-1 accent-[hsl(var(--primary))]"
          />
        </label>
      </div>
    </div>
  );
}
