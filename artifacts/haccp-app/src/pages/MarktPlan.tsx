import { useRef, useState, useCallback } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import {
  ChevronLeft, ZoomIn, ZoomOut, Maximize2, MapPin,
  Info, Move,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

// ─── Zoom Controls (muss inside TransformWrapper sein) ───────────────────────
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => zoomIn(0.3)}
        className="w-8 h-8 rounded-lg bg-white border border-border/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        title="Vergrößern">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut(0.3)}
        className="w-8 h-8 rounded-lg bg-white border border-border/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        title="Verkleinern">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => resetTransform()}
        className="w-8 h-8 rounded-lg bg-white border border-border/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        title="Zurücksetzen">
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MarktPlan() {
  const { adminSession } = useAppStore();
  const isAdmin = !!adminSession;
  const [hotspotMode, setHotspotMode] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Koordinaten relativ zum Bild berechnen (für spätere Hotspot-Platzierung)
  const handleImgMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setCoords({ x, y });
  }, []);

  const handleImgMouseLeave = useCallback(() => setCoords(null), []);

  return (
    <AppLayout>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 print:hidden">
          <Link href="/" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Interaktiver Marktplan</h1>
            <p className="text-sm text-muted-foreground">MHD-Kontroll-Hotspots · EDEKA DALLMANN Leeder</p>
          </div>
        </div>

        {/* Karte + Toolbar */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-secondary/30 print:hidden flex-wrap">

            {/* Modus-Anzeige */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Move className="w-3.5 h-3.5" />
              <span>Ziehen zum Navigieren · Pinch / Scroll zum Zoomen</span>
            </div>

            <div className="flex-1" />

            {/* Koordinaten-Readout */}
            {coords && hotspotMode && (
              <span className="text-[10px] font-mono text-muted-foreground bg-secondary rounded px-2 py-1">
                X {coords.x}% / Y {coords.y}%
              </span>
            )}

            {/* Hotspot-Modus Toggle (nur Admin) */}
            {isAdmin && (
              <button
                onClick={() => setHotspotMode(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                  ${hotspotMode
                    ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                    : "bg-white text-[#1a3a6b] border-[#1a3a6b]/30 hover:bg-[#1a3a6b]/5"}`}>
                <MapPin className="w-3.5 h-3.5" />
                {hotspotMode ? "Hotspot-Modus aktiv" : "Hotspot-Modus"}
              </button>
            )}

            {/* Zoom Controls — reagiert nur innerhalb des TransformWrapper,
                deshalb werden sie darunter gerendert und hier als Platzhalter */}
          </div>

          {/* Zoom/Pan-Bereich */}
          <TransformWrapper
            initialScale={1}
            minScale={0.3}
            maxScale={6}
            limitToBounds={false}
            panning={{ disabled: hotspotMode }}
            wheel={{ step: 0.08 }}
            doubleClick={{ disabled: false, step: 0.7 }}
          >
            {() => (
              <div className="relative">
                {/* Zoom-Buttons — innerhalb des Wrappers */}
                <div className="absolute top-3 right-3 z-10">
                  <ZoomControls />
                </div>

                {/* Kartenbereich */}
                <div
                  className={`bg-[#f5f5f0] overflow-hidden select-none
                    ${hotspotMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
                  style={{ height: "calc(100vh - 240px)", minHeight: 400 }}>
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}>
                    <img
                      ref={imgRef}
                      src={`${import.meta.env.BASE_URL}leederplan.svg`}
                      alt="Marktplan EDEKA DALLMANN Leeder"
                      draggable={false}
                      onMouseMove={handleImgMouseMove}
                      onMouseLeave={handleImgMouseLeave}
                      style={{
                        maxWidth: "none",
                        width: "100%",
                        height: "auto",
                        display: "block",
                        userSelect: "none",
                        pointerEvents: hotspotMode ? "auto" : "none",
                      }}
                    />
                  </TransformComponent>
                </div>
              </div>
            )}
          </TransformWrapper>
        </div>

        {/* Info-Leiste */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 print:hidden">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Nächster Schritt: Hotspot-Platzierung</p>
            <p className="text-xs text-blue-700">
              Im Admin-Modus können Regalmeter mit Sortiment, Reduzierungsregel und Kontrollintervall markiert werden.
              Aktiviere dazu den Hotspot-Modus oben rechts in der Toolbar.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
