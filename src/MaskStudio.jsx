import React, { useState, useRef, useEffect, useCallback } from "react";

/* ---------------------------------------------------------------------------
   Mask Studio — foto revelada por uma grade de furos "softpoint",
   com o recorte da pessoa tendo a própria grade e extrapolando a máscara.
   Sem dependências: canvas + CSS próprio. Mesma família de gri.d.maker.
--------------------------------------------------------------------------- */

const LOGO_VIEWBOX = "0 0 472.32 121.65";
const LOGO_PATHS = [
  "M17.44,86.13h36.04c10.06,0,16.83-6.44,16.83-16.09s-6.77-15.54-16.83-15.54h-20.21c-2.56,0-3.93-1.2-3.93-3.4s1.37-3.4,3.93-3.4h34.48v-12.14h-35.67c-10.06,0-16.83,6.44-16.83,16.09s6.77,15.36,16.83,15.36h20.22c2.56,0,3.93,1.29,3.93,3.5s-1.37,3.5-3.93,3.5H17.44v12.14ZM106.54,87.05c18.84,0,30.19-9.75,30.19-26.21s-11.34-26.21-30.19-26.21-30.19,9.75-30.19,26.21,11.34,26.21,30.19,26.21h0ZM106.54,74.91c-9.42,0-14.27-4.78-14.27-14.07s4.85-14.07,14.27-14.07,14.27,4.78,14.27,14.07-4.85,14.07-14.27,14.07h0ZM150.08,86.13h15.73v-38.44h16.83v-12.14h-16.83v-1.1c0-3.95,2.1-6.16,7.87-6.16,3.75,0,7.23.37,10.34,1.01v-10.76c-3.2-1.2-7.23-1.93-11.34-1.93-15.55,0-22.59,6.62-22.59,17.2v1.75h-8.05v12.14h8.05v38.44ZM220.6,86.77c4.66,0,8.6-1.01,11.89-2.58v-10.85c-3.75.74-6.77,1.1-10.06,1.1-5.49,0-8.41-2.21-8.41-8.37v-18.39h18.48v-12.14h-18.48v-13.7h-15.73v13.7h-8.05v12.14h8.05v17.57c0,14.16,5.95,21.52,22.32,21.52h0ZM242.83,104.21h15.73v-22.49c4.85,3.68,9.7,5.33,16.28,5.33,15.73,0,25.98-9.75,25.98-26.21s-8.51-26.21-24.15-26.21c-6.95,0-12.35,1.93-18.29,6.99v-6.07h-15.55v68.66ZM270.91,74.91c-4.39,0-8.69-1.56-12.35-4.41v-18.03c3.29-3.31,8.41-5.7,14.27-5.7,7.68,0,12.08,4.97,12.08,13.89,0,9.75-5.76,14.26-14,14.26h0ZM309.7,86.13h15.73V17.15h-15.73v68.98ZM354.43,87.05c7.78,0,14.27-3.31,19.3-8.37,0,2.21.28,5.24.82,7.45h15.37c-.91-3.03-1.28-7.27-1.28-12.05v-17.29c0-13.15-5.67-22.17-26.07-22.17-10.15,0-19.76,2.21-27.08,6.62l5.21,10.76c7.59-3.68,12.81-5.24,20.31-5.24,9.33,0,12.08,2.3,12.08,8.18-29.73.65-38.69,5.61-38.69,16.37,0,10.02,7.96,15.73,20.03,15.73h0ZM356.53,75.65c-4.76,0-6.77-1.38-6.77-4.51,0-4.05,3.66-6.62,23.33-7.82v6.35c-6.5,4.23-11.53,5.98-16.56,5.98h0ZM399.98,86.13h15.73v-33.38c4.21-3.5,9.24-5.61,14.55-5.61,6.49,0,8.87,3.5,8.87,10.85v28.14h15.73v-29.52c0-14.72-5.03-21.98-19.67-21.98-8.14,0-13.26,2.3-19.67,7.27v-6.35h-15.55v50.58Z",
  "M21.44,90.61h9.6v9.6c0,2.21-1.79,4-4,4h-9.6v-9.6c0-2.21,1.79-4,4-4Z"
];

const CSS = `
.ms { --ink:#1a1b20; --muted:#75757f; --line:#e2e2e6; --panel:#fff; --page:#f6f5f3; --accent:#6d4af0;
      display:flex; flex-direction:column; min-height:100vh; background:var(--page); color:var(--ink);
      font-family:"Host Grotesk","Inter",system-ui,-apple-system,sans-serif; font-size:14px; }
.ms *, .ms *::before, .ms *::after { box-sizing:border-box; }
.ms-stage { position:sticky; top:0; z-index:5; background:var(--page); border-bottom:1px solid var(--line);
            padding:12px 16px 14px; display:flex; flex-direction:column; align-items:center; gap:10px; }
.ms-bar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; width:100%; max-width:900px; }
.ms-frame { position:relative; width:100%; max-width:900px; }
.ms canvas { display:block; width:100%; height:auto; max-height:50vh; object-fit:contain; border-radius:10px;
             border:1px solid var(--line); background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.06); }
.ms-hint { margin-top:8px; text-align:center; font-size:12px; color:var(--muted); }
.ms-count { margin-left:auto; font-size:12px; color:var(--muted); }
.ms-side { background:var(--panel); }
.ms-grp { border-bottom:1px solid var(--line); background:var(--panel); padding:14px 16px; }
.ms-grp h2 { margin:0 0 10px; font-size:14px; font-weight:600; }
.ms-note { margin:0 0 8px; font-size:12px; color:var(--muted); line-height:1.45; }
.ms-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:4px 0; }
.ms-row > span:first-child { font-size:12px; color:var(--muted); flex:none; }
.ms-val { font-size:12px; color:var(--muted); width:42px; text-align:right; font-variant-numeric:tabular-nums; }
.ms input[type=range] { width:150px; accent-color:var(--accent); }
.ms input[type=color] { width:42px; height:26px; padding:0; border:1px solid var(--line); border-radius:6px; background:#fff; }
.ms input[type=text], .ms input[type=number], .ms select {
  font:inherit; font-size:12px; padding:5px 8px; border:1px solid var(--line); border-radius:7px;
  background:#fff; color:var(--ink); max-width:190px; }
.ms input[type=number] { width:76px; }
.ms-chk { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); padding:3px 0; }
.ms-chk input { accent-color:var(--accent); }
.ms button { font:inherit; font-size:12px; padding:7px 12px; border-radius:8px; cursor:pointer;
             border:1px solid var(--line); background:#fff; color:var(--ink); }
.ms button:hover { background:#f0eff2; }
.ms button.dark { background:var(--ink); color:#fff; border-color:var(--ink); }
.ms button.dark:hover { background:#35363f; }
.ms button.go { background:var(--accent); color:#fff; border-color:var(--accent); }
.ms button.go:hover { background:#5b3ad8; }
.ms-btns { display:flex; gap:8px; margin:10px 0 8px; }
.ms-btns > * { flex:1; }
.ms-seg { display:inline-flex; gap:2px; background:#e7e6ea; padding:2px; border-radius:8px; }
.ms-seg button { border:0; background:transparent; padding:5px 10px; }
.ms-seg button[aria-pressed=true] { background:#fff; }
.ms-seg.icons button { padding:5px 8px; line-height:0; }
.ms-seg.icons svg { display:block; }
.ms-seg.icons svg path { fill:#9a99a4; }
.ms-seg.icons button[aria-pressed=true] svg path { fill:var(--accent); }
.ms-file { display:flex; align-items:center; gap:10px; margin-top:8px; }
.ms-file img { width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid var(--line); }
.ms-file span { flex:1; font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ms-txtrow { display:flex; gap:6px; margin-bottom:6px; }
.ms-txtrow input[type=text] { flex:1; max-width:none; }
.ms-txtrow.sel input[type=text] { border-color:var(--accent); }
.ms-sub { background:#f4f3f6; border-radius:8px; padding:8px 10px; margin-top:10px; }
.ms-head { padding:16px; background:var(--panel); border-bottom:1px solid var(--line);
           display:flex; align-items:center; gap:12px; }
.ms-head h1 { margin:0; font-size:17px; font-weight:600; letter-spacing:-.01em; }
.ms-logo { display:block; width:96px; height:auto; flex:none; }
.ms-logo path { fill:#1a1b20; }
.ms-sep { width:1px; height:20px; background:var(--line); flex:none; }
@media (min-width:900px) {
  .ms { flex-direction:row; height:100vh; }
  .ms-side { order:1; width:330px; flex:none; overflow-y:auto; border-right:1px solid var(--line); }
  .ms-stage { order:2; position:static; flex:1; min-width:0; justify-content:center; border-bottom:0; padding:24px; }
  .ms canvas { max-height:74vh; }
}
`;

const PRESETS = [
  { label: "16:9 — 1200×675", w: 1200, h: 675 },
  { label: "wide — 1500×760", w: 1500, h: 760 },
  { label: "quadrado — 1080×1080", w: 1080, h: 1080 },
  { label: "story — 1080×1920", w: 1080, h: 1920 },
  { label: "post — 1080×1350", w: 1080, h: 1350 },
];

/* k = [cima-esq, cima-dir, baixo-dir, baixo-esq]; 1 = canto curvo.
   softpoint = dois cantos opostos curvos, como o SVG da marca. */
const SOFT_A = [1, 0, 1, 0];
const SOFT_B = [0, 1, 0, 1];
const ROUND = [1, 1, 1, 1];
const SQUARE = [0, 0, 0, 0];
const CYCLE = [SOFT_A, SOFT_B, ROUND, SQUARE];

const uid = () => Math.random().toString(36).slice(2, 9);

const cover = (iw, ih, W, H, zoom, ox, oy) => {
  const ratio = Math.max(W / iw, H / ih) * zoom;
  const dw = iw * ratio;
  const dh = ih * ratio;
  return { dx: (W - dw) / 2 + (ox / 100) * W, dy: (H - dh) / 2 + (oy / 100) * H, dw, dh };
};

const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pathRR = (c, x, y, w, h, r) => {
  c.moveTo(x + r[0], y);
  c.lineTo(x + w - r[1], y); c.quadraticCurveTo(x + w, y, x + w, y + r[1]);
  c.lineTo(x + w, y + h - r[2]); c.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
  c.lineTo(x + r[3], y + h); c.quadraticCurveTo(x, y + h, x, y + h - r[3]);
  c.lineTo(x, y + r[0]); c.quadraticCurveTo(x, y, x + r[0], y);
  c.closePath();
};

const dRR = (x, y, w, h, r) =>
  `M${x + r[0]} ${y}H${x + w - r[1]}Q${x + w} ${y} ${x + w} ${y + r[1]}` +
  `V${y + h - r[2]}Q${x + w} ${y + h} ${x + w - r[2]} ${y + h}` +
  `H${x + r[3]}Q${x} ${y + h} ${x} ${y + h - r[3]}` +
  `V${y + r[0]}Q${x} ${y} ${x + r[0]} ${y}Z`;

const pickK = (shape, orient) => {
  if (shape === "mixed") return CYCLE[Math.floor(Math.random() * CYCLE.length)].slice();
  if (shape === "round") return ROUND.slice();
  if (shape === "square") return SQUARE.slice();
  if (orient === "a") return SOFT_A.slice();
  if (orient === "b") return SOFT_B.slice();
  return (Math.random() < 0.5 ? SOFT_B : SOFT_A).slice();
};

const makeCells = (cols, rows, prev, density, shape, orient) => {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const old = prev && prev.find((p) => p.c === c && p.r === r);
      out.push(old || { c, r, on: Math.random() * 100 < density, front: false, cutOn: true, k: pickK(shape, orient) });
    }
  }
  return out;
};

/* ------------------------- componentes de painel ------------------------- */

const Section = ({ title, children }) => (
  <div className="ms-grp"><h2>{title}</h2>{children}</div>
);

const Row = ({ label, children }) => (
  <label className="ms-row"><span>{label}</span><span style={{ display: "flex", alignItems: "center", gap: 8 }}>{children}</span></label>
);

const Slider = ({ value, onChange, min, max, step = 1 }) => (
  <>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    <b className="ms-val">{value}</b>
  </>
);

const Check = ({ checked, onChange, children }) => (
  <label className="ms-chk"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{children}</label>
);

const Upload = ({ accept, onFile, label, filled }) => {
  const ref = useRef(null);
  return (
    <div style={{ position: "relative" }}>
      <input ref={ref} type="file" accept={accept}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, left: 0, top: 0 }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onFile(f); e.target.value = ""; }} />
      <button type="button" className={filled ? "dark" : ""} style={{ width: "100%" }}
        onClick={() => ref.current && ref.current.click()}>{label}</button>
    </div>
  );
};

const FilePreview = ({ item, onRemove }) => (
  <div className="ms-file">
    <img src={item.src} alt="" />
    <span>{item.name}</span>
    <button onClick={onRemove} style={{ border: 0, background: "none", padding: 0, color: "#9a99a4" }}>remover</button>
  </div>
);

const ShapeIcon = ({ variant }) => (
  <svg width="24" height="22" viewBox="0 0 24 22">
    <path d={variant === "a"
      ? "M7,0 H24 V15 A7,7 0 0 1 17,22 H0 V7 A7,7 0 0 1 7,0 Z"
      : "M0,0 H17 A7,7 0 0 1 24,7 V22 H7 A7,7 0 0 1 0,15 Z"} />
  </svg>
);

/* ------------------------------ ferramenta ------------------------------ */

export default function MaskStudio() {
  const [W, setW] = useState(1200);
  const [H, setH] = useState(675);
  const [cols, setCols] = useState(8);
  const [rows, setRows] = useState(5);
  const [radius, setRadius] = useState(30);
  const [density, setDensity] = useState(38);
  const [shape, setShape] = useState("soft");
  const [orient, setOrient] = useState("mix");
  const [frontMix, setFrontMix] = useState(true);
  const [guides, setGuides] = useState(true);

  const [bgType, setBgType] = useState("gradient");
  const [c1, setC1] = useState("#f1eafe");
  const [c2, setC2] = useState("#8e5bf5");
  const [angle, setAngle] = useState(135);

  const [photo, setPhoto] = useState(null);
  const [pZoom, setPZoom] = useState(1);
  const [pX, setPX] = useState(0);
  const [pY, setPY] = useState(0);

  const [cut, setCut] = useState(null);
  const [cZoom, setCZoom] = useState(1);
  const [cX, setCX] = useState(0);
  const [cY, setCY] = useState(0);

  const [family, setFamily] = useState("Host Grotesk, Poppins, Inter, sans-serif");
  const [behind, setBehind] = useState(true);
  const [texts, setTexts] = useState([]);
  const [sel, setSel] = useState(null);

  const [mode, setMode] = useState("grade");
  const [scale, setScale] = useState(2);
  const [cells, setCells] = useState(() => makeCells(8, 5, null, 38, "soft", "mix"));

  const canvasRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    setCells((prev) => makeCells(cols, rows, prev, density, shape, orient));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows]);

  /* ---------------------------- geometria ---------------------------- */
  const rectOf = useCallback((cell, s) => {
    const cw = (W / cols) * s;
    const ch = (H / rows) * s;
    return { x: cell.c * cw, y: cell.r * ch, w: cw, h: ch };
  }, [W, H, cols, rows]);

  const radiiOf = useCallback((cell, w, h) => {
    const b = Math.min((radius / 100) * Math.min(w, h), Math.min(w, h) / 2);
    return cell.k.map((on) => (on ? b : 0));
  }, [radius]);

  /* células vizinhas se fundem: o canto só arredonda na borda de fora */
  const mergedRadii = useCallback((cell, w, h, key, list) => {
    const b = Math.min((radius / 100) * Math.min(w, h), Math.min(w, h) / 2);
    const at = (c, r) => { const f = list.find((x) => x.c === c && x.r === r); return !!(f && f[key]); };
    const L = at(cell.c - 1, cell.r), R = at(cell.c + 1, cell.r);
    const T = at(cell.c, cell.r - 1), B = at(cell.c, cell.r + 1);
    return [
      cell.k[0] && !L && !T ? b : 0,
      cell.k[1] && !R && !T ? b : 0,
      cell.k[2] && !R && !B ? b : 0,
      cell.k[3] && !L && !B ? b : 0,
    ];
  }, [radius]);

  const cutPath = useCallback((c, s) => {
    const list = cells.filter((x) => x.cutOn);
    c.beginPath();
    list.forEach((cell) => {
      const r = rectOf(cell, s);
      pathRR(c, r.x, r.y, r.w, r.h, mergedRadii(cell, r.w, r.h, "cutOn", cells));
    });
    return list.length;
  }, [cells, rectOf, mergedRadii]);

  /* ------------------------------ desenho ------------------------------ */
  const paint = useCallback((c, s) => {
    const w = W * s, h = H * s;
    c.clearRect(0, 0, w, h);

    if (bgType === "solid") c.fillStyle = c1;
    else {
      const a = (angle * Math.PI) / 180;
      const len = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2;
      const g = c.createLinearGradient(w / 2 - Math.cos(a) * len, h / 2 - Math.sin(a) * len,
                                       w / 2 + Math.cos(a) * len, h / 2 + Math.sin(a) * len);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      c.fillStyle = g;
    }
    c.fillRect(0, 0, w, h);

    if (guides) {
      c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = s;
      for (let i = 1; i < cols; i++) { c.beginPath(); c.moveTo(i * w / cols, 0); c.lineTo(i * w / cols, h); c.stroke(); }
      for (let i = 1; i < rows; i++) { c.beginPath(); c.moveTo(0, i * h / rows); c.lineTo(w, i * h / rows); c.stroke(); }
    }

    const paintTexts = () => texts.forEach((t) => {
      c.save();
      c.translate((t.x / 100) * w, (t.y / 100) * h);
      c.rotate((t.rot * Math.PI) / 180);
      c.fillStyle = t.color;
      c.font = `${t.weight} ${t.size * s}px ${family}`;
      c.textBaseline = "alphabetic";
      c.fillText(t.t, 0, 0);
      c.restore();
    });

    const tiles = (list) => {
      if (!list.length) return;
      c.save();
      c.beginPath();
      list.forEach((cell) => {
        const r = rectOf(cell, s);
        pathRR(c, r.x, r.y, r.w, r.h, radiiOf(cell, r.w, r.h));
      });
      c.clip();
      if (photo) {
        const f = cover(photo.img.width, photo.img.height, w, h, pZoom, pX, pY);
        c.drawImage(photo.img, f.dx, f.dy, f.dw, f.dh);
      } else { c.fillStyle = "rgba(255,255,255,.42)"; c.fillRect(0, 0, w, h); }
      c.restore();
    };

    const drawCut = () => {
      if (!cut) return;
      const f = cover(cut.img.width, cut.img.height, w, h, cZoom, cX, cY);
      const picked = cells.filter((x) => x.cutOn).length;
      if (!picked) return;
      if (picked === cells.length) { c.drawImage(cut.img, f.dx, f.dy, f.dw, f.dh); return; }
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(w)); off.height = Math.max(1, Math.round(h));
      const o = off.getContext("2d");
      o.drawImage(cut.img, f.dx, f.dy, f.dw, f.dh);
      const mk = document.createElement("canvas");
      mk.width = off.width; mk.height = off.height;
      const m = mk.getContext("2d");
      m.fillStyle = "#fff";
      cutPath(m, s);
      m.fill();
      o.globalCompositeOperation = "destination-in";
      o.drawImage(mk, 0, 0);
      c.drawImage(off, 0, 0);
    };

    if (behind) paintTexts();
    tiles(cells.filter((x) => x.on && !x.front));
    drawCut();
    tiles(cells.filter((x) => x.on && x.front));
    if (!behind) paintTexts();
  }, [W, H, cols, rows, bgType, c1, c2, angle, guides, texts, family, behind, cells, photo, pZoom, pX, pY, cut, cZoom, cX, cY, rectOf, radiiOf, cutPath]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    paint(c, 1);
    if (mode === "recorte") {
      c.save();
      c.strokeStyle = "#6d4af0"; c.lineWidth = 2.5;
      if (c.setLineDash) c.setLineDash([8, 6]);
      cutPath(c, 1);
      c.stroke();
      c.restore();
    }
  }, [paint, W, H, mode, cutPath]);

  /* ---------------------------- arquivos ---------------------------- */
  const readFile = useCallback((file, setter) => {
    if (!file || !file.type.startsWith("image/")) return;
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => setter({ src: fr.result, img, name: file.name });
      img.onerror = () => window.alert("Não consegui abrir essa imagem.");
      img.src = fr.result;
    };
    fr.onerror = () => window.alert("Falha ao ler o arquivo.");
    fr.readAsDataURL(file);
  }, []);

  /* ---------------------------- edição ---------------------------- */
  const patchCell = (c, r, fn) =>
    setCells((prev) => prev.map((cell) => (cell.c === c && cell.r === r ? fn({ ...cell }) : cell)));

  const cycleShape = (cell, key) => {
    let at = 4;
    if (cell[key]) {
      at = 0;
      for (let j = 0; j < CYCLE.length; j++) if (CYCLE[j].join() === cell.k.join()) { at = j; break; }
    }
    const next = (at + 1) % 5;
    if (next === 4) cell[key] = false;
    else { cell[key] = true; cell.k = CYCLE[next].slice(); }
    return cell;
  };

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };

  const onDown = (e) => {
    const p = point(e);
    if (mode === "grade" || mode === "recorte") {
      const c = Math.floor((p.x / W) * cols), r = Math.floor((p.y / H) * rows);
      patchCell(c, r, (cell) => {
        if (mode === "recorte") {
          if (e.shiftKey) return cycleShape(cell, "cutOn");
          cell.cutOn = !cell.cutOn; return cell;
        }
        if (e.altKey) { cell.front = !cell.front; cell.on = true; return cell; }
        if (e.shiftKey) return cycleShape(cell, "on");
        cell.on = !cell.on; return cell;
      });
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      ctx.font = `${t.weight} ${t.size}px ${family}`;
      const tw = ctx.measureText(t.t).width;
      const x = (t.x / 100) * W, y = (t.y / 100) * H;
      if (p.x >= x - 10 && p.x <= x + tw + 10 && p.y >= y - t.size && p.y <= y + t.size * 0.3) {
        setSel(t.id);
        drag.current = { id: t.id, ox: p.x - x, oy: p.y - y };
        break;
      }
    }
  };

  const onMove = (e) => {
    if (!drag.current) return;
    const p = point(e);
    const { id, ox, oy } = drag.current;
    setTexts((prev) => prev.map((t) => (t.id === id
      ? { ...t, x: Math.round(((p.x - ox) / W) * 1000) / 10, y: Math.round(((p.y - oy) / H) * 1000) / 10 }
      : t)));
  };

  const stopDrag = () => { drag.current = null; };

  const randomize = () => setCells((prev) => prev.map((cell) => {
    const on = Math.random() * 100 < density;
    return { ...cell, on, front: on && frontMix && Math.random() < 0.22, k: pickK(shape, orient) };
  }));
  const setAllHoles = (v) => setCells((prev) => prev.map((c) => ({ ...c, on: v })));
  const setCutAll = (fn) => { setCells((prev) => prev.map((c) => ({ ...c, cutOn: fn(c) }))); setMode("recorte"); };
  const reshapeAll = (sh, or) => setCells((prev) => prev.map((c) => ({ ...c, k: pickK(sh, or) })));

  const patchText = (patch) => setTexts((prev) => prev.map((t) => (t.id === sel ? { ...t, ...patch } : t)));
  const selected = texts.find((t) => t.id === sel);

  /* ---------------------------- exportação ---------------------------- */
  const save = (href, name) => {
    const a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPNG = () => {
    const o = document.createElement("canvas");
    o.width = W * scale; o.height = H * scale;
    paint(o.getContext("2d"), scale);
    save(o.toDataURL("image/png"), `mask-studio-${W}x${H}@${scale}x.png`);
  };

  const exportSVG = () => {
    const on = cells.filter((x) => x.on);
    const back = on.filter((x) => !x.front);
    const front = on.filter((x) => x.front);
    const shapesOf = (list) => list.map((cell) => {
      const r = rectOf(cell, 1);
      return `<path d="${dRR(r.x, r.y, r.w, r.h, radiiOf(cell, r.w, r.h))}" fill="#fff"/>`;
    }).join("");
    const hole = (id, list) =>
      `<mask id="${id}"><rect width="${W}" height="${H}" fill="#000"/>${shapesOf(list)}</mask>`;

    const a = (angle * Math.PI) / 180;
    const grad = `<linearGradient id="g" x1="${0.5 - Math.cos(a) / 2}" y1="${0.5 - Math.sin(a) / 2}" x2="${0.5 + Math.cos(a) / 2}" y2="${0.5 + Math.sin(a) / 2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
    const bg = `<rect width="${W}" height="${H}" fill="${bgType === "solid" ? c1 : "url(#g)"}"/>`;

    let guideEls = "";
    if (guides) {
      for (let i = 1; i < cols; i++) guideEls += `<line x1="${i * W / cols}" y1="0" x2="${i * W / cols}" y2="${H}" stroke="rgba(255,255,255,.45)"/>`;
      for (let i = 1; i < rows; i++) guideEls += `<line x1="0" y1="${i * H / rows}" x2="${W}" y2="${i * H / rows}" stroke="rgba(255,255,255,.45)"/>`;
    }

    const f = photo ? cover(photo.img.width, photo.img.height, W, H, pZoom, pX, pY) : null;
    const layer = (list, id) => {
      if (!list.length) return "";
      const inner = photo
        ? `<image href="${photo.src}" x="${f.dx}" y="${f.dy}" width="${f.dw}" height="${f.dh}" preserveAspectRatio="none"/>`
        : `<rect width="${W}" height="${H}" fill="rgba(255,255,255,.42)"/>`;
      return `<g mask="url(#${id})">${inner}</g>`;
    };

    let cutEl = "", cutDefs = "";
    if (cut) {
      const fc = cover(cut.img.width, cut.img.height, W, H, cZoom, cX, cY);
      const img = `<image href="${cut.src}" x="${fc.dx}" y="${fc.dy}" width="${fc.dw}" height="${fc.dh}" preserveAspectRatio="none"/>`;
      const picked = cells.filter((x) => x.cutOn);
      if (!picked.length) cutEl = "";
      else if (picked.length === cells.length) cutEl = img;
      else {
        const body = picked.map((cell) => {
          const r = rectOf(cell, 1);
          return `<path d="${dRR(r.x, r.y, r.w, r.h, mergedRadii(cell, r.w, r.h, "cutOn", cells))}" fill="#fff"/>`;
        }).join("");
        cutDefs = `<mask id="me"><rect width="${W}" height="${H}" fill="#000"/>${body}</mask>`;
        cutEl = `<g mask="url(#me)">${img}</g>`;
      }
    }

    const tx = texts.map((t) => {
      const x = (t.x / 100) * W, y = (t.y / 100) * H;
      return `<text x="${x}" y="${y}" fill="${t.color}" font-family="${esc(family)}" font-size="${t.size}" font-weight="${t.weight}" transform="rotate(${t.rot} ${x} ${y})">${esc(t.t)}</text>`;
    }).join("");

    const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<defs>${grad}${hole("mb", back)}${hole("mf", front)}${cutDefs}</defs>` +
      bg + guideEls + (behind ? tx : "") + layer(back, "mb") + cutEl + layer(front, "mf") + (behind ? "" : tx) + `</svg>`;

    save(URL.createObjectURL(new Blob([out], { type: "image/svg+xml" })), `mask-studio-${W}x${H}.svg`);
  };

  const holeKey = mode === "recorte" ? "cutOn" : "on";
  const openCount = cells.filter((x) => x[holeKey]).length;

  /* ------------------------------- interface ------------------------------- */
  return (
    <div className="ms"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) readFile(f, photo ? setCut : setPhoto);
      }}>
      <style>{CSS}</style>

      <div className="ms-stage">
        <div className="ms-bar">
          <div className="ms-seg">
            {[["grade", "Furos da foto"], ["recorte", "Furos do recorte"], ["texto", "Mover texto"]].map(([m, label]) => (
              <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{label}</button>
            ))}
          </div>
          <button className="dark" onClick={randomize}>Gerar furos</button>
          <button onClick={() => setAllHoles(false)}>Limpar</button>
          <span className="ms-count">
            {openCount} de {cells.length} {mode === "recorte" ? "furos no recorte" : "furos abertos"}
          </span>
        </div>

        <div className="ms-frame">
          <canvas ref={canvasRef}
            style={{ cursor: mode === "texto" ? "move" : "crosshair" }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} />
          {!photo && <div className="ms-hint">Envie uma foto no painel, ou arraste um arquivo até aqui</div>}
        </div>
      </div>

      <div className="ms-side">
        <header className="ms-head">
          <svg className="ms-logo" viewBox={LOGO_VIEWBOX}>
            {LOGO_PATHS.map((d, i) => <path key={i} d={d} />)}
          </svg>
          <span className="ms-sep" />
          <h1>Mask Studio</h1>
        </header>

        <Section title="1. Foto dentro dos furos">
          <Upload accept="image/*" filled label={photo ? "Trocar foto" : "Enviar foto"}
            onFile={(f) => readFile(f, setPhoto)} />
          {photo && <FilePreview item={photo} onRemove={() => setPhoto(null)} />}
          <Row label="Zoom"><Slider min={0.3} max={3} step={0.01} value={pZoom} onChange={setPZoom} /></Row>
          <Row label="Horizontal"><Slider min={-60} max={60} value={pX} onChange={setPX} /></Row>
          <Row label="Vertical"><Slider min={-60} max={60} value={pY} onChange={setPY} /></Row>
        </Section>

        <Section title="2. Recorte por cima">
          <p className="ms-note">PNG sem fundo, mesmo enquadramento da foto. É esta camada que faz a pessoa escapar dos quadrados.</p>
          <Upload accept="image/png,image/webp" label={cut ? "Trocar recorte" : "Enviar recorte (PNG)"}
            onFile={(f) => readFile(f, setCut)} />
          {cut && <FilePreview item={cut} onRemove={() => setCut(null)} />}
          <Row label="Zoom"><Slider min={0.3} max={3} step={0.01} value={cZoom} onChange={setCZoom} /></Row>
          <Row label="Horizontal"><Slider min={-60} max={60} value={cX} onChange={setCX} /></Row>
          <Row label="Vertical"><Slider min={-60} max={60} value={cY} onChange={setCY} /></Row>
          <p className="ms-note" style={{ marginTop: 12 }}>
            O recorte tem a própria grade. Escolha <b>Furos do recorte</b> acima do palco e clique nas células para
            decidir por onde a pessoa aparece — o resto dela é cortado.
          </p>
          <div className="ms-btns">
            <button onClick={() => setCutAll(() => true)}>Tudo</button>
            <button onClick={() => setCutAll(() => false)}>Limpar</button>
            <button onClick={() => setCutAll((c) => c.on)}>Igual à foto</button>
          </div>
        </Section>

        <Section title="Grade">
          <Row label="Colunas"><Slider min={2} max={16} value={cols} onChange={setCols} /></Row>
          <Row label="Linhas"><Slider min={2} max={16} value={rows} onChange={setRows} /></Row>
          <Row label="Curva do canto"><Slider min={0} max={50} value={radius} onChange={setRadius} /></Row>
          <Row label="Ocupação"><Slider min={5} max={95} value={density} onChange={setDensity} /></Row>
          <div className="ms-btns">
            <button className="dark" onClick={randomize}>Gerar furos</button>
            <button onClick={() => setAllHoles(true)}>Tudo</button>
            <button onClick={() => setAllHoles(false)}>Limpar</button>
          </div>
          <Row label="Forma">
            <select value={shape} onChange={(e) => { setShape(e.target.value); reshapeAll(e.target.value, orient); }}>
              <option value="soft">softpoint (2 cantos opostos)</option>
              <option value="round">arredondada (4 cantos)</option>
              <option value="square">quadrada</option>
              <option value="mixed">misturada</option>
            </select>
          </Row>
          {shape === "soft" && (
            <Row label="Lado do buraco">
              <span className="ms-seg icons">
                {["a", "b"].map((o) => (
                  <button key={o} aria-pressed={orient === o}
                    onClick={() => { setOrient(o); reshapeAll("soft", o); }}>
                    <ShapeIcon variant={o} />
                  </button>
                ))}
                <button aria-pressed={orient === "mix"}
                  onClick={() => { setOrient("mix"); reshapeAll("soft", "mix"); }}>alternar</button>
              </span>
            </Row>
          )}
          <Check checked={frontMix} onChange={setFrontMix}>Alguns furos passam na frente da pessoa</Check>
          <Check checked={guides} onChange={setGuides}>Linhas-guia</Check>
          <p className="ms-note" style={{ margin: "8px 0 0" }}>
            shift+clique percorre as formas e termina no vazio, apagando o furo · alt+clique joga ele para a frente.
          </p>
        </Section>

        <Section title="Fundo">
          <Row label="Tipo">
            <select value={bgType} onChange={(e) => setBgType(e.target.value)}>
              <option value="gradient">degradê</option>
              <option value="solid">sólido</option>
            </select>
          </Row>
          <Row label="Cor 1"><input type="color" value={c1} onChange={(e) => setC1(e.target.value)} /></Row>
          {bgType === "gradient" && <>
            <Row label="Cor 2"><input type="color" value={c2} onChange={(e) => setC2(e.target.value)} /></Row>
            <Row label="Ângulo"><Slider min={0} max={360} value={angle} onChange={setAngle} /></Row>
          </>}
        </Section>

        <Section title="Tela">
          <Row label="Formato">
            <select value={`${W}x${H}`} onChange={(e) => {
              const p = PRESETS.find((x) => `${x.w}x${x.h}` === e.target.value);
              if (p) { setW(p.w); setH(p.h); }
            }}>
              {PRESETS.map((p) => <option key={p.label} value={`${p.w}x${p.h}`}>{p.label}</option>)}
              {!PRESETS.some((p) => p.w === W && p.h === H) && <option value={`${W}x${H}`}>personalizado</option>}
            </select>
          </Row>
          <Row label="Largura"><input type="number" value={W} onChange={(e) => setW(Math.max(1, +e.target.value || 1))} /></Row>
          <Row label="Altura"><input type="number" value={H} onChange={(e) => setH(Math.max(1, +e.target.value || 1))} /></Row>
        </Section>

        <Section title="Texto">
          <Row label="Fonte"><input type="text" value={family} onChange={(e) => setFamily(e.target.value)} /></Row>
          <Check checked={behind} onChange={setBehind}>Texto atrás dos quadrados</Check>
          {texts.map((t) => (
            <div key={t.id} className={"ms-txtrow" + (sel === t.id ? " sel" : "")}>
              <input type="text" value={t.t} onFocus={() => setSel(t.id)}
                onChange={(e) => setTexts((prev) => prev.map((x) => (x.id === t.id ? { ...x, t: e.target.value } : x)))} />
              <button onClick={() => { setTexts((prev) => prev.filter((x) => x.id !== t.id)); if (sel === t.id) setSel(null); }}>×</button>
            </div>
          ))}
          <button style={{ width: "100%", marginTop: 8 }} onClick={() => {
            const t = { id: uid(), t: "texto", x: 30, y: 50, size: 80, weight: 400, color: "#2b2f45", rot: 0 };
            setTexts((prev) => [...prev, t]); setSel(t.id);
          }}>Adicionar texto</button>
          {selected && (
            <div className="ms-sub">
              <Row label="Tamanho"><Slider min={10} max={400} value={selected.size} onChange={(v) => patchText({ size: v })} /></Row>
              <Row label="Peso"><Slider min={100} max={900} step={100} value={selected.weight} onChange={(v) => patchText({ weight: v })} /></Row>
              <Row label="Rotação"><Slider min={-180} max={180} value={selected.rot} onChange={(v) => patchText({ rot: v })} /></Row>
              <Row label="Cor"><input type="color" value={selected.color} onChange={(e) => patchText({ color: e.target.value })} /></Row>
            </div>
          )}
        </Section>

        <Section title="Exportar">
          <Row label="Escala PNG">
            <select value={scale} onChange={(e) => setScale(+e.target.value)}>
              <option value={1}>1×</option><option value={2}>2×</option><option value={3}>3×</option>
            </select>
          </Row>
          <div className="ms-btns">
            <button className="go" onClick={exportPNG}>Baixar PNG</button>
            <button onClick={exportSVG}>Baixar SVG</button>
          </div>
        </Section>
      </div>
    </div>
  );
}
