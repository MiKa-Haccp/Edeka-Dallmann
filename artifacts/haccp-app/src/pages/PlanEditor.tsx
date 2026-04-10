import { useState, useRef, useCallback, useEffect } from "react";
import { Copy, Check, Trash2, X } from "lucide-react";

type Rect = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
};

type DrawingState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

const IMAGE_URL = "/images/plan-leeder.png";

export default function PlanEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<DrawingState>(null);
  const [nextId, setNextId] = useState(1);
  const [copied, setCopied] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const getRelativePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const toNatural = useCallback(
    (px: number, py: number) => {
      const img = imgRef.current;
      if (!img || !naturalSize) return { x: px, y: py };
      const dispW = img.getBoundingClientRect().width;
      const dispH = img.getBoundingClientRect().height;
      return {
        x: Math.round((px / dispW) * naturalSize.w),
        y: Math.round((py / dispH) * naturalSize.h),
      };
    },
    [naturalSize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const pos = getRelativePos(e);
      setDrawing({ startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
    },
    [getRelativePos]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!drawing) return;
      const pos = getRelativePos(e);
      setDrawing((d) => d ? { ...d, currentX: pos.x, currentY: pos.y } : null);
    },
    [drawing, getRelativePos]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!drawing) return;
      const pos = getRelativePos(e);
      const x = Math.min(drawing.startX, pos.x);
      const y = Math.min(drawing.startY, pos.y);
      const w = Math.abs(pos.x - drawing.startX);
      const h = Math.abs(pos.y - drawing.startY);
      if (w > 5 && h > 5) {
        const nat = toNatural(x, y);
        const natW = toNatural(x + w, y + h);
        setRects((prev) => [
          ...prev,
          {
            id: `rect-${Date.now()}`,
            x: nat.x,
            y: nat.y,
            w: natW.x - nat.x,
            h: natW.y - nat.y,
            label: `Regal-${String(nextId).padStart(2, "0")}`,
          },
        ]);
        setNextId((n) => n + 1);
      }
      setDrawing(null);
    },
    [drawing, getRelativePos, toNatural, nextId]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (img) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const updateLabel = (id: string, label: string) => {
    setRects((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
  };

  const deleteRect = (id: string) => {
    setRects((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => setRects([]);

  const svgCode = rects
    .map(
      (r) =>
        `<rect id="${r.label}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="rgba(26,58,107,0.25)" stroke="#1a3a6b" stroke-width="2" />`
    )
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayRects = drawing
    ? [
        ...rects,
        {
          id: "__preview",
          label: "…",
          x: Math.min(drawing.startX, drawing.currentX),
          y: Math.min(drawing.startY, drawing.currentY),
          w: Math.abs(drawing.currentX - drawing.startX),
          h: Math.abs(drawing.currentY - drawing.startY),
          display: true,
        },
      ]
    : rects;

  const toDisplay = useCallback(
    (r: { x: number; y: number; w: number; h: number }) => {
      if (!naturalSize || !imgRef.current) return r;
      const img = imgRef.current;
      const dispW = img.getBoundingClientRect().width;
      const dispH = img.getBoundingClientRect().height;
      return {
        x: (r.x / naturalSize.w) * dispW,
        y: (r.y / naturalSize.h) * dispH,
        w: (r.w / naturalSize.w) * dispW,
        h: (r.h / naturalSize.h) * dispH,
      };
    },
    [naturalSize]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-[#1a3a6b] px-6 py-3 flex items-center gap-4 shadow-lg shrink-0">
        <h1 className="text-lg font-bold tracking-wide">Plan-Editor — Regal-Koordinaten</h1>
        <span className="text-xs bg-amber-500 text-black font-bold px-2 py-0.5 rounded">TEMPORÄR</span>
        <div className="ml-auto flex items-center gap-3">
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
          Halte die Maustaste gedrückt und ziehe über ein Regal, um ein Rechteck zu definieren. Vergib dann eine ID.
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-auto">
        <div
          ref={containerRef}
          className="relative inline-block select-none"
          style={{ cursor: "crosshair" }}
        >
          <img
            ref={imgRef}
            src={IMAGE_URL}
            alt="Ladenplan Leeder"
            onLoad={onImgLoad}
            onMouseDown={handleMouseDown}
            draggable={false}
            style={{ maxWidth: "100%", display: "block", userSelect: "none" }}
          />

          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            {displayRects.map((r) => {
              const isPreview = r.id === "__preview";
              const disp = isPreview
                ? { x: r.x, y: r.y, w: r.w, h: r.h }
                : toDisplay(r);
              return (
                <rect
                  key={r.id}
                  x={disp.x}
                  y={disp.y}
                  width={disp.w}
                  height={disp.h}
                  fill={isPreview ? "rgba(59,130,246,0.2)" : "rgba(26,58,107,0.3)"}
                  stroke={isPreview ? "#3b82f6" : "#1a3a6b"}
                  strokeWidth={isPreview ? 1.5 : 2}
                  strokeDasharray={isPreview ? "4 2" : undefined}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {rects.length > 0 && (
        <div className="px-4 pb-4 shrink-0 space-y-3">
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-gray-300 mb-3">Gezeichnete Rechtecke</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rects.map((r) => (
                <div key={r.id} className="flex items-center gap-3 bg-gray-700 rounded-lg px-3 py-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: "rgba(26,58,107,0.8)", border: "2px solid #1a3a6b" }} />
                  <input
                    type="text"
                    value={r.label}
                    onChange={(e) => updateLabel(r.id, e.target.value)}
                    className="flex-1 bg-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="ID eingeben…"
                  />
                  <span className="text-xs text-gray-400 font-mono shrink-0">
                    {r.x},{r.y} {r.w}×{r.h}
                  </span>
                  <button
                    onClick={() => deleteRect(r.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors shrink-0"
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
              {svgCode || "— noch keine Rechtecke —"}
            </pre>
            {naturalSize && (
              <p className="text-xs text-gray-500 mt-2">
                Bildgröße: {naturalSize.w} × {naturalSize.h} px — Koordinaten sind auf diese Größe skaliert.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
