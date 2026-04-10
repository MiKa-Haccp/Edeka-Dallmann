import { useState, useRef, useCallback, useEffect } from "react";
import { Copy, Check, Trash2, X, RotateCw, CopyPlus, ZoomIn, ZoomOut } from "lucide-react";

type Rect = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  rotation: number;
};

type Handle = "nw" | "ne" | "se" | "sw";

type DragMode =
  | { kind: "draw"; startX: number; startY: number; curX: number; curY: number }
  | { kind: "move"; id: string; startMX: number; startMY: number; origX: number; origY: number }
  | { kind: "resize"; id: string; handle: Handle; startMX: number; startMY: number; orig: Rect }
  | null;

const IMAGE_URL = "/images/plan-leeder.png";
const HANDLE_R = 6;

export default function PlanEditor() {
  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [rects, setRects] = useState<Rect[]>(() => {
    try {
      const saved = localStorage.getItem("planeditor-rects");
      return saved ? (JSON.parse(saved) as Rect[]) : [];
    } catch { return []; }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragMode>(null);
  const [nextId, setNextId] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("planeditor-nextid") ?? "1");
    } catch { return 1; }
  });
  const [copied, setCopied] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [baseWidth, setBaseWidth] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const changeZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.25, Math.min(4, Math.round((z + delta) * 20) / 20)));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        changeZoom(-e.deltaY * 0.002);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [changeZoom]);

  useEffect(() => {
    try {
      localStorage.setItem("planeditor-rects", JSON.stringify(rects));
      localStorage.setItem("planeditor-nextid", String(nextId));
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1200);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
  }, [rects, nextId]);

  const imgRect = useCallback(() => imgRef.current?.getBoundingClientRect() ?? null, []);

  const toNat = useCallback(
    (dispX: number, dispY: number) => {
      const r = imgRect();
      if (!r || !naturalSize) return { x: dispX, y: dispY };
      return { x: (dispX / r.width) * naturalSize.w, y: (dispY / r.height) * naturalSize.h };
    },
    [naturalSize, imgRect]
  );

  const deltaToNat = useCallback(
    (ddx: number, ddy: number) => {
      const r = imgRect();
      if (!r || !naturalSize) return { dx: ddx, dy: ddy };
      return { dx: (ddx / r.width) * naturalSize.w, dy: (ddy / r.height) * naturalSize.h };
    },
    [naturalSize, imgRect]
  );

  const toDisp = useCallback(
    (natX: number, natY: number) => {
      const r = imgRect();
      if (!r || !naturalSize) return { x: natX, y: natY };
      return { x: (natX / naturalSize.w) * r.width, y: (natY / naturalSize.h) * r.height };
    },
    [naturalSize, imgRect]
  );

  const dispRect = useCallback(
    (r: Rect) => {
      const tl = toDisp(r.x, r.y);
      const br = toDisp(r.x + r.w, r.y + r.h);
      return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
    },
    [toDisp]
  );

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const ir = imgRect();
    if (!ir) return { x: clientX, y: clientY };
    return { x: clientX - ir.left, y: clientY - ir.top };
  }, [imgRect]);

  const onSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      const pos = clientToSvg(e.clientX, e.clientY);
      const el = e.target as Element;
      const rectId = el.getAttribute("data-rect-id");
      const handleId = el.getAttribute("data-handle-id");

      if (handleId && rectId) {
        e.stopPropagation();
        const orig = rects.find((r) => r.id === rectId);
        if (!orig) return;
        setDrag({ kind: "resize", id: rectId, handle: handleId as Handle, startMX: e.clientX, startMY: e.clientY, orig: { ...orig } });
        return;
      }

      if (rectId) {
        e.stopPropagation();
        setSelectedId(rectId);
        const orig = rects.find((r) => r.id === rectId);
        if (!orig) return;
        setDrag({ kind: "move", id: rectId, startMX: e.clientX, startMY: e.clientY, origX: orig.x, origY: orig.y });
        return;
      }

      setSelectedId(null);
      setDrag({ kind: "draw", startX: pos.x, startY: pos.y, curX: pos.x, curY: pos.y });
    },
    [clientToSvg, rects]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!drag) return;
      if (drag.kind === "draw") {
        const pos = clientToSvg(e.clientX, e.clientY);
        setDrag((d) => (d?.kind === "draw" ? { ...d, curX: pos.x, curY: pos.y } : d));
        return;
      }
      if (drag.kind === "move") {
        const { dx, dy } = deltaToNat(e.clientX - drag.startMX, e.clientY - drag.startMY);
        setRects((prev) =>
          prev.map((r) =>
            r.id === drag.id ? { ...r, x: Math.round(drag.origX + dx), y: Math.round(drag.origY + dy) } : r
          )
        );
        return;
      }
      if (drag.kind === "resize") {
        const { dx, dy } = deltaToNat(e.clientX - drag.startMX, e.clientY - drag.startMY);
        const o = drag.orig;
        setRects((prev) =>
          prev.map((r) => {
            if (r.id !== drag.id) return r;
            let { x, y, w, h } = o;
            switch (drag.handle) {
              case "nw":
                x = Math.round(o.x + dx); y = Math.round(o.y + dy);
                w = Math.round(o.w - dx); h = Math.round(o.h - dy);
                break;
              case "ne":
                y = Math.round(o.y + dy);
                w = Math.round(o.w + dx); h = Math.round(o.h - dy);
                break;
              case "se":
                w = Math.round(o.w + dx); h = Math.round(o.h + dy);
                break;
              case "sw":
                x = Math.round(o.x + dx);
                w = Math.round(o.w - dx); h = Math.round(o.h + dy);
                break;
            }
            if (w < 10) w = 10;
            if (h < 10) h = 10;
            return { ...r, x, y, w, h };
          })
        );
        return;
      }
    },
    [drag, clientToSvg, deltaToNat]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!drag) return;
      if (drag.kind === "draw") {
        const pos = clientToSvg(e.clientX, e.clientY);
        const x = Math.min(drag.startX, pos.x);
        const y = Math.min(drag.startY, pos.y);
        const w = Math.abs(pos.x - drag.startX);
        const h = Math.abs(pos.y - drag.startY);
        if (w > 5 && h > 5) {
          const tl = toNat(x, y);
          const br = toNat(x + w, y + h);
          setRects((prev) => [
            ...prev,
            {
              id: `rect-${Date.now()}`,
              x: tl.x, y: tl.y,
              w: br.x - tl.x, h: br.y - tl.y,
              label: `Regal-${String(nextId).padStart(2, "0")}`,
              rotation: 0,
            },
          ]);
          setNextId((n) => n + 1);
        }
      }
      setDrag(null);
    },
    [drag, clientToSvg, toNat, nextId]
  );

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setBaseWidth(img.getBoundingClientRect().width);
  };

  const updateLabel = (id: string, label: string) =>
    setRects((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));

  const updateRotation = (id: string, rotation: number) =>
    setRects((prev) => prev.map((r) => (r.id === id ? { ...r, rotation } : r)));

  const deleteRect = (id: string) => {
    if (selectedId === id) setSelectedId(null);
    setRects((prev) => prev.filter((r) => r.id !== id));
  };

  const duplicateRect = (id: string) => {
    const orig = rects.find((r) => r.id === id);
    if (!orig) return;
    const newId = `rect-${Date.now()}`;
    const newLabel = `Regal-${String(nextId).padStart(2, "0")}`;
    const copy: Rect = { ...orig, id: newId, label: newLabel, x: orig.x + 30, y: orig.y + 30 };
    setRects((prev) => [...prev, copy]);
    setSelectedId(newId);
    setNextId((n) => n + 1);
  };

  const clearAll = () => { setRects([]); setSelectedId(null); };

  const rectLines = rects
    .map((r) => {
      const cx = r.x + Math.round(r.w / 2);
      const cy = r.y + Math.round(r.h / 2);
      const transform = r.rotation !== 0 ? ` transform="rotate(${r.rotation}, ${cx}, ${cy})"` : "";
      return `  <rect id="${r.label}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"${transform} fill="rgba(26,58,107,0.25)" stroke="#1a3a6b" stroke-width="2" />`;
    })
    .join("\n");

  const svgCode = naturalSize
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${naturalSize.w} ${naturalSize.h}">\n${rectLines}\n</svg>`
    : rectLines;

  const handleCopy = async () => {
    if (!naturalSize || rects.length === 0) return;
    await navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cursorStyle = drag?.kind === "move" ? "grabbing" : drag?.kind === "resize" ? "nwse-resize" : "crosshair";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-[#1a3a6b] px-6 py-3 flex items-center gap-4 shadow-lg shrink-0">
        <h1 className="text-lg font-bold tracking-wide">Plan-Editor — Regal-Koordinaten</h1>
        <span className="text-xs bg-amber-500 text-black font-bold px-2 py-0.5 rounded">TEMPORÄR</span>
        <div className="ml-auto flex items-center gap-3">
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Gespeichert
            </span>
          )}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-1 py-0.5">
            <button onClick={() => changeZoom(-0.25)} className="p-1 hover:text-blue-300 transition-colors" title="Herauszoomen">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="text-xs font-mono w-12 text-center hover:text-blue-300 transition-colors"
              title="Zurücksetzen"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => changeZoom(0.25)} className="p-1 hover:text-blue-300 transition-colors" title="Reinzoomen">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-blue-200">{rects.length} Rechteck{rects.length !== 1 ? "e" : ""}</span>
          {rects.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Alle löschen
            </button>
          )}
        </div>
      </div>

      <div className="p-4 shrink-0">
        <p className="text-sm text-gray-400">
          Ziehen = neues Rechteck · Klick auf Regal = auswählen · Ecken ziehen = Größe · Mitte ziehen = verschieben
        </p>
      </div>

      <div ref={viewportRef} className="flex-1 px-4 pb-4 overflow-auto">
        <div className="relative inline-block select-none">
          <img
            ref={imgRef}
            src={IMAGE_URL}
            alt="Ladenplan Leeder"
            onLoad={onImgLoad}
            draggable={false}
            style={{ width: baseWidth ? `${Math.round(baseWidth * zoom)}px` : "100%", display: "block", userSelect: "none" }}
          />

          <svg
            ref={svgRef}
            onMouseDown={onSvgMouseDown}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%",
              cursor: cursorStyle,
            }}
          >
            {rects.map((r) => {
              const d = dispRect(r);
              const cx = d.x + d.w / 2;
              const cy = d.y + d.h / 2;
              const isSelected = r.id === selectedId;
              const transformStr = r.rotation !== 0 ? `rotate(${r.rotation}, ${cx}, ${cy})` : undefined;

              return (
                <g key={r.id} transform={transformStr}>
                  <rect
                    data-rect-id={r.id}
                    x={d.x} y={d.y} width={d.w} height={d.h}
                    fill={isSelected ? "rgba(45,90,160,0.35)" : "rgba(26,58,107,0.25)"}
                    stroke={isSelected ? "#60a5fa" : "#1a3a6b"}
                    strokeWidth={isSelected ? 2 : 1.5}
                    style={{ cursor: "grab" }}
                  />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(7, Math.min(12, d.w / 9))}
                    fill={isSelected ? "#bfdbfe" : "white"}
                    style={{ pointerEvents: "none", fontFamily: "monospace" }}
                  >
                    {r.label}
                  </text>

                  {isSelected && (
                    <>
                      {(["nw", "ne", "se", "sw"] as Handle[]).map((h) => {
                        const hx = h.includes("e") ? d.x + d.w : d.x;
                        const hy = h.includes("s") ? d.y + d.h : d.y;
                        const cur = h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize";
                        return (
                          <circle
                            key={h}
                            data-rect-id={r.id}
                            data-handle-id={h}
                            cx={hx} cy={hy} r={HANDLE_R}
                            fill="#60a5fa" stroke="white" strokeWidth={1.5}
                            style={{ cursor: cur }}
                          />
                        );
                      })}
                    </>
                  )}
                </g>
              );
            })}

            {drag?.kind === "draw" && (() => {
              const x = Math.min(drag.startX, drag.curX);
              const y = Math.min(drag.startY, drag.curY);
              const w = Math.abs(drag.curX - drag.startX);
              const h = Math.abs(drag.curY - drag.startY);
              return (
                <rect
                  x={x} y={y} width={w} height={h}
                  fill="rgba(59,130,246,0.15)" stroke="#3b82f6"
                  strokeWidth={1.5} strokeDasharray="4 2"
                  style={{ pointerEvents: "none" }}
                />
              );
            })()}
          </svg>
        </div>
      </div>

      {rects.length > 0 && (
        <div className="px-4 pb-4 shrink-0 space-y-3">
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-gray-300 mb-3">Gezeichnete Rechtecke</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rects.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${selectedId === r.id ? "bg-blue-900/60 ring-1 ring-blue-500" : "bg-gray-700 hover:bg-gray-600"}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: "rgba(26,58,107,0.8)", border: "2px solid #60a5fa" }} />

                  <input
                    type="text"
                    value={r.label}
                    onChange={(e) => updateLabel(r.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-36 bg-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="ID…"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <RotateCw className="w-3.5 h-3.5 text-gray-400" />
                    <button
                      onClick={(e) => { e.stopPropagation(); updateRotation(r.id, r.rotation - 15); }}
                      className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-xs font-bold flex items-center justify-center"
                    >−</button>
                    <input
                      type="number"
                      value={r.rotation}
                      onChange={(e) => updateRotation(r.id, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-14 bg-gray-600 text-white text-xs rounded px-1 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      min={-180} max={180}
                    />
                    <span className="text-xs text-gray-400">°</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateRotation(r.id, r.rotation + 15); }}
                      className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-xs font-bold flex items-center justify-center"
                    >+</button>
                  </div>

                  <span className="text-xs text-gray-500 font-mono shrink-0 ml-1 hidden lg:block">
                    {r.w}×{r.h}
                  </span>

                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateRect(r.id); }}
                    className="ml-auto text-gray-400 hover:text-green-400 transition-colors shrink-0"
                    title="Duplizieren"
                  >
                    <CopyPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteRect(r.id); }}
                    className="text-gray-400 hover:text-red-400 transition-colors shrink-0"
                    title="Löschen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-300">SVG-Code zum Kopieren</h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs px-3 py-1.5 bg-[#2d5aa0] hover:bg-[#1a3a6b] rounded-lg transition-colors font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Kopiert!" : "Code kopieren"}
              </button>
            </div>
            <pre className="text-xs font-mono text-green-400 bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {svgCode}
            </pre>
            {naturalSize && (
              <p className="text-xs text-gray-500 mt-2">
                Bildgröße: {naturalSize.w} × {naturalSize.h} px — Koordinaten auf diese Größe skaliert.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

