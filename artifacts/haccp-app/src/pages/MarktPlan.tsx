import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import {
  ChevronLeft, ZoomIn, ZoomOut, Maximize2, MapPin,
  Move, Plus, X, Trash2, Save, Info, Pencil, RotateCcw, MoveIcon, RotateCw,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { PinVerification } from "@/components/PinVerification";

const BASE = import.meta.env.VITE_API_URL || "/api";

const REDUZIEREN_TAGE: Record<string, number> = {
  "4 Tage": 4, "1 Woche": 7, "2 Wochen": 14, "4 Wochen": 28,
};

function calcReduzierenDatum(wert: string): string | null {
  const tage = REDUZIEREN_TAGE[wert];
  if (!tage) return null;
  const d = new Date();
  d.setDate(d.getDate() + tage);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const KNICK_MONATE: Record<string, number> = {
  "8 Tage": 0, "2 Monate": 2, "4 Monate": 4, "5 Monate": 5,
};
const KNICK_TAGE_EXTRA: Record<string, number> = { "8 Tage": 8 };

function calcKnickDatum(wert: string): string | null {
  if (!wert || !(wert in KNICK_MONATE) && !(wert in KNICK_TAGE_EXTRA)) return null;
  const d = new Date();
  if (wert === "8 Tage") {
    d.setDate(d.getDate() + 8);
  } else {
    d.setMonth(d.getMonth() + KNICK_MONATE[wert]);
  }
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Typen ───────────────────────────────────────────────────────────────────
interface Marker {
  id: number;
  marketId: number;
  label: string;
  x: string;
  y: string;
  size: string | null;
  rotated: boolean | null;
  sortiment: string | null;
  reduzierungsRegel:  string | null;
  reduzierungsDatum:  string | null;
  aktionsHinweis:     string | null;
  knickDatum:         string | null;
  kontrollRhythmus:   string | null;
  naechsteKontrolle:  string | null;
  letzteKontrolleAt:  string | null;
  letzteKontrolleVon: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  label: "",
  sortiment: "",
  reduzierungsRegel: "",
  aktionsHinweis: "",
  kontrollRhythmus: "",
  size: "xs",
  rotated: false,
  // Ersterfassung: direkte Datumseingabe (ueberschreibt berechnete Werte)
  erstReduzierungsDatum: "",
  erstKnickDatum: "",
  erstNaechsteKontrolle: "",
  erstLetzteKontrolleAt: "",
  erstLetzteKontrolleVon: "",
};

const KONTROLL_RHYTHMUS_OPTIONEN = [
  { value: "1 Monat",   monate: 1 },
  { value: "2 Monate",  monate: 2 },
  { value: "3 Monate",  monate: 3 },
  { value: "4 Monate",  monate: 4 },
  { value: "Jaehrlich", monate: 0 },
];

function calcNaechsteKontrolleDatum(rhythmus: string, knickIso: string | null): string | null {
  if (!rhythmus) return null;
  if (rhythmus === "Jaehrlich") {
    return `${new Date().getFullYear() + 1}-01-01`;
  }
  const base = knickIso ? new Date(knickIso + "T00:00:00") : new Date();
  const opt = KONTROLL_RHYTHMUS_OPTIONEN.find(o => o.value === rhythmus);
  if (!opt) return null;
  base.setMonth(base.getMonth() + opt.monate);
  return base.toISOString().split("T")[0];
}

function isoToDE(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function calcIsoDate(wert: string, type: "reduzieren" | "knick"): string | null {
  const d = new Date();
  if (type === "reduzieren") {
    const tage = REDUZIEREN_TAGE[wert];
    if (!tage) return null;
    d.setDate(d.getDate() + tage);
  } else {
    if (wert === "8 Tage") { d.setDate(d.getDate() + 8); }
    else if (wert === "2 Monate") { d.setMonth(d.getMonth() + 2); }
    else if (wert === "4 Monate") { d.setMonth(d.getMonth() + 4); }
    else if (wert === "5 Monate") { d.setMonth(d.getMonth() + 5); }
    else return null;
  }
  return d.toISOString().split("T")[0];
}

// ─── Status-Ampel ─────────────────────────────────────────────────────────────
// Gruen  = heute <= knickDatum
// Gelb   = knickDatum ueberschritten, naechsteKontrolle noch nicht erreicht
// Rot    = naechsteKontrolle ueberschritten
// Neu    = keine Datumsangaben vorhanden
type St = "neu" | "ok" | "bald" | "faellig";
function markerStatus(m: Marker): St {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const knick = m.knickDatum        ? new Date(m.knickDatum        + "T00:00:00") : null;
  const next  = m.naechsteKontrolle ? new Date(m.naechsteKontrolle + "T00:00:00") : null;
  if (!knick && !next) return "neu";
  if (knick && today <= knick)  return "ok";
  if (next  && today <= next)   return "bald";
  if (next  && today >  next)   return "faellig";
  return "bald";
}
const ST: Record<St, { dot: string; btn: string; ring: string; label: string }> = {
  neu:     { dot: "bg-gray-400",  btn: "border-gray-300 bg-white/95 text-gray-700",       ring: "ring-gray-200",  label: "Neu" },
  ok:      { dot: "bg-green-500", btn: "border-green-300 bg-green-50/95 text-green-800",  ring: "ring-green-200", label: "Im Limit" },
  bald:    { dot: "bg-amber-400", btn: "border-amber-300 bg-amber-50/95 text-amber-800",  ring: "ring-amber-200", label: "Knick ueberschritten" },
  faellig: { dot: "bg-red-500",   btn: "border-red-300 bg-red-50/95 text-red-800",        ring: "ring-red-200",   label: "Kontrolle faellig" },
};

const SIZE_CLASSES: Record<string, string> = {
  xs: "px-0.5 py-px  text-[5px]  gap-px  rounded-sm  border   ring-1",
  sm: "px-1   py-0.5 text-[7px]  gap-0.5 rounded     border   ring-1",
  md: "px-1.5 py-0.5 text-[9px]  gap-0.5 rounded-md  border-2 ring-2",
  lg: "px-2   py-1   text-xs     gap-1   rounded-lg  border-2 ring-2",
};
const DOT_CLASSES: Record<string, string> = {
  xs: "w-1   h-1   flex-shrink-0",
  sm: "w-1.5 h-1.5 flex-shrink-0",
  md: "w-2   h-2   flex-shrink-0",
  lg: "w-2.5 h-2.5 flex-shrink-0",
};


// ─── Zoom Controls ───────────────────────────────────────────────────────────
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="flex flex-col gap-1">
      {[
        { icon: ZoomIn,    fn: () => zoomIn(0.4),     title: "Vergrossern" },
        { icon: ZoomOut,   fn: () => zoomOut(0.4),    title: "Verkleinern" },
        { icon: Maximize2, fn: () => resetTransform(), title: "Zurucksetzen" },
      ].map(({ icon: Icon, fn, title }) => (
        <button key={title} onClick={fn} title={title}
          className="w-8 h-8 rounded-lg bg-white border border-border/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

// Referenzbreite: bei dieser angezeigten Bildbreite (px) sind die Buttons "1×" groß.
// Alles darunter wird kleiner, alles darüber größer – proportional zum Bild.
const MARKER_REFERENCE_WIDTH = 900;

// ─── Marker-Button auf dem Plan ───────────────────────────────────────────────
function MarkerPin({
  marker, onEdit, moveMode,
  onPointerDown, onPointerMove, onPointerUp,
  isDragging, mapRotated, markerScale,
}: {
  marker: Marker;
  onEdit: (m: Marker) => void;
  moveMode: boolean;
  onPointerDown: (e: React.PointerEvent, m: Marker) => void;
  onPointerMove: (e: React.PointerEvent, m: Marker) => void;
  onPointerUp:   (e: React.PointerEvent, m: Marker) => void;
  isDragging: boolean;
  mapRotated?: boolean;
  markerScale: number;
}) {
  const st  = markerStatus(marker);
  const s   = ST[st];
  const sz  = marker.size || "xs";
  const rot = marker.rotated ?? false;

  const baseTransform = mapRotated
    ? `translate(-50%, -50%) rotate(-180deg) scale(${markerScale})`
    : `translate(-50%, -50%) scale(${markerScale})`;

  return (
    <div
      onPointerDown={e => onPointerDown(e, marker)}
      onPointerMove={e => onPointerMove(e, marker)}
      onPointerUp={e => onPointerUp(e, marker)}
      onClick={e => { if (!moveMode) { e.stopPropagation(); onEdit(marker); } }}
      title={moveMode ? "Ziehen zum Verschieben" : marker.label}
      style={{
        position: "absolute",
        left: `${marker.x}%`,
        top:  `${marker.y}%`,
        transform: baseTransform,
        transformOrigin: "50% 50%",
        zIndex: isDragging ? 50 : 10,
        pointerEvents: "auto",
        cursor: moveMode ? (isDragging ? "grabbing" : "grab") : "pointer",
        touchAction: "none",
      }}
    >
      <div className={`
        flex items-center justify-center font-bold shadow-md transition-shadow whitespace-nowrap select-none
        ${s.ring} ${s.btn} ${SIZE_CLASSES[sz] ?? SIZE_CLASSES.xs}
        ${isDragging ? "shadow-xl scale-110 opacity-90" : "hover:shadow-lg hover:scale-105"}
      `}
        style={rot
          ? { writingMode: "vertical-rl", textOrientation: "mixed", minHeight: "5ch" }
          : { minWidth: "5ch" }}
      >
        <span className={`rounded-full flex-shrink-0 ${DOT_CLASSES[sz] ?? DOT_CLASSES.md} ${s.dot} ${st === "faellig" ? "animate-pulse" : ""}`} />
        <span>{marker.label.slice(0, 5)}</span>
        {moveMode && <MoveIcon className="w-2.5 h-2.5 opacity-40 flex-shrink-0" />}
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function MarkerModal({
  mode, marker, form, setForm, onSave, onDelete, onClose, saving, canEditSettings, onKontrolliert,
}: {
  mode: "new" | "edit";
  marker?: Marker;
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  saving: boolean;
  canEditSettings: boolean;
  onKontrolliert: (userId: number, userName: string) => void;
}) {
  const [pinOpen, setPinOpen] = useState(false);
  const [ersterfassung, setErsterfassung] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border/60 overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-[#1a3a6b]/5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1a3a6b]" />
            <span className="font-bold text-[#1a3a6b]">
              {mode === "new" ? "Neuer Regalmeter-Marker"
                : canEditSettings ? "Marker bearbeiten"
                : marker?.label ?? "Regalmeter-Info"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* ── ADMIN / BEREICHSLEITUNG / MARKTLEITUNG: Vollbearbeitung ── */}
          {canEditSettings ? (<>

            {/* Bezeichnung */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Bezeichnung <span className="text-red-500">*</span>
              </label>
              <input autoFocus value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder='z.B. "Chips-Regal Mitte"'
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
            </div>

            {/* Darstellung */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Groesse</label>
                <div className="flex gap-1">
                  {(["xs","sm"] as const).map(sz => (
                    <button key={sz} onClick={() => setForm({ ...form, size: sz })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors
                        ${form.size === sz ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                      {sz === "xs" ? "XS" : "S"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Ausrichtung</label>
                <div className="flex gap-1">
                  <button onClick={() => setForm({ ...form, rotated: false })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1
                      ${!form.rotated ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                    <span>ABC</span>
                  </button>
                  <button onClick={() => setForm({ ...form, rotated: true })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center
                      ${form.rotated ? "bg-[#1a3a6b] text-white border-[#1a3a6b]" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Vorschau */}
            <div className="flex items-center gap-3 py-2">
              <span className="text-xs text-muted-foreground">Vorschau:</span>
              <div className={`inline-flex items-center font-bold border-gray-300 bg-white shadow-sm ring-gray-200 ${SIZE_CLASSES[form.size] ?? SIZE_CLASSES.xs}`}
                style={form.rotated ? { writingMode: "vertical-rl", textOrientation: "mixed" } : {}}>
                <span className={`rounded-full bg-gray-400 flex-shrink-0 ${DOT_CLASSES[form.size] ?? DOT_CLASSES.md}`} />
                <span className="text-gray-700">{form.label || "Bezeichnung"}</span>
              </div>
            </div>

            {/* Sortiment */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sortiment</label>
              <input value={form.sortiment}
                onChange={e => setForm({ ...form, sortiment: e.target.value })}
                placeholder='z.B. "Chips, Nuesse, Snacks"'
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30" />
            </div>

            {/* Reduzieren bis */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Reduzieren bis</label>
                {calcReduzierenDatum(form.reduzierungsRegel) && (
                  <span className="text-xs font-bold text-white bg-amber-500 rounded-md px-2 py-0.5">
                    {calcReduzierenDatum(form.reduzierungsRegel)}
                  </span>
                )}
              </div>
              <select value={form.reduzierungsRegel}
                onChange={e => setForm({ ...form, reduzierungsRegel: e.target.value })}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30">
                <option value="">— keine Angabe —</option>
                <option value="4 Tage">4 Tage</option>
                <option value="1 Woche">1 Woche</option>
                <option value="2 Wochen">2 Wochen</option>
                <option value="4 Wochen">4 Wochen</option>
              </select>
            </div>

            {/* Knick bis */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Knick bis</label>
                {calcKnickDatum(form.aktionsHinweis) && (
                  <span className="text-xs font-bold text-white bg-amber-500 rounded-md px-2 py-0.5">
                    {calcKnickDatum(form.aktionsHinweis)}
                  </span>
                )}
              </div>
              <select value={form.aktionsHinweis}
                onChange={e => setForm({ ...form, aktionsHinweis: e.target.value })}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30">
                <option value="">— keine Angabe —</option>
                <option value="8 Tage">8 Tage</option>
                <option value="2 Monate">2 Monate</option>
                <option value="4 Monate">4 Monate</option>
                <option value="5 Monate">5 Monate</option>
              </select>
            </div>

            {/* Naechste Kontrolle */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Naechste Kontrolle</label>
                {(() => {
                  const knickIso = calcIsoDate(form.aktionsHinweis, "knick");
                  const d = calcNaechsteKontrolleDatum(form.kontrollRhythmus, knickIso);
                  return d ? (
                    <span className="text-xs font-bold text-white bg-[#1a3a6b] rounded-md px-2 py-0.5">
                      {isoToDE(d)}
                    </span>
                  ) : null;
                })()}
              </div>
              <select value={form.kontrollRhythmus}
                onChange={e => setForm({ ...form, kontrollRhythmus: e.target.value })}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30">
                <option value="">— keine Angabe —</option>
                {KONTROLL_RHYTHMUS_OPTIONEN.map(o => (
                  <option key={o.value} value={o.value}>{o.value}</option>
                ))}
              </select>
            </div>

            {/* ── Ersterfassung: Historische Daten direkt eingeben ── */}
            <div>
              <button type="button"
                onClick={() => setErsterfassung(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                  ${ersterfassung
                    ? "bg-orange-50 border-orange-300 text-orange-800"
                    : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"}`}>
                <span className="flex items-center gap-2">
                  <span className="text-base">{ersterfassung ? "✏️" : "📋"}</span>
                  Ersterfassung — Historische Daten
                </span>
                <span className="text-xs">{ersterfassung ? "▲ schliessen" : "▼ oeffnen"}</span>
              </button>

              {ersterfassung && (
                <div className="mt-2 p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
                  <p className="text-xs text-orange-700 font-medium">
                    Datum ueberschreibt den berechneten Wert aus dem Rhythmus-Dropdown.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Naechste Kontrolle (Datum)</label>
                    <input type="date" value={form.erstNaechsteKontrolle}
                      onChange={e => setForm({ ...form, erstNaechsteKontrolle: e.target.value })}
                      className="w-full text-sm border border-orange-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>
              )}
            </div>

          </>) : (<>

            {/* ── MITARBEITER: Nur Anzeige + Kontrolliert melden ── */}
            {marker?.sortiment && (
              <div className="bg-secondary/40 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground font-semibold mb-1">Sortiment</p>
                <p className="text-sm font-medium">{marker.sortiment}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl px-4 py-3 ${marker?.reduzierungsDatum ? "bg-amber-50 border border-amber-200" : "bg-secondary/30"}`}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Reduzieren bis</p>
                <p className={`text-sm font-bold ${marker?.reduzierungsDatum ? "text-amber-700" : "text-muted-foreground"}`}>
                  {marker?.reduzierungsDatum ? isoToDE(marker.reduzierungsDatum) : "—"}
                </p>
              </div>
              <div className={`rounded-xl px-4 py-3 ${marker?.knickDatum ? "bg-amber-50 border border-amber-200" : "bg-secondary/30"}`}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Knick bis</p>
                <p className={`text-sm font-bold ${marker?.knickDatum ? "text-amber-700" : "text-muted-foreground"}`}>
                  {marker?.knickDatum ? isoToDE(marker.knickDatum) : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl px-4 py-3 bg-secondary/30">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Letzte Kontrolle</p>
                {marker?.letzteKontrolleAt ? (
                  <p className="text-sm font-medium text-green-700">
                    {isoToDE(marker.letzteKontrolleAt)}
                    {marker.letzteKontrolleVon && <span className="block text-xs text-muted-foreground mt-0.5">{marker.letzteKontrolleVon}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className={`rounded-xl px-4 py-3 ${marker?.naechsteKontrolle ? "bg-[#1a3a6b]/5 border border-[#1a3a6b]/20" : "bg-secondary/30"}`}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Naechste Kontrolle</p>
                <p className={`text-sm font-bold ${marker?.naechsteKontrolle ? "text-[#1a3a6b]" : "text-muted-foreground"}`}>
                  {marker?.naechsteKontrolle ? isoToDE(marker.naechsteKontrolle) : "—"}
                </p>
              </div>
            </div>

            <button onClick={() => setPinOpen(true)}
              className="w-full py-3 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" />
              Kontrolliert melden
            </button>

          </>)}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-border/60 bg-secondary/20">
          {canEditSettings && mode === "edit" && onDelete && (
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Loeschen
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
            {canEditSettings ? "Abbrechen" : "Schliessen"}
          </button>
          {canEditSettings && (
            <button onClick={onSave} disabled={!form.label.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-sm font-bold transition-colors disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {saving ? "Speichere..." : mode === "new" ? "Anlegen" : "Speichern"}
            </button>
          )}
        </div>
      </div>

      <PinVerification
        open={pinOpen}
        onVerified={(userId, userName) => {
          setPinOpen(false);
          onKontrolliert(userId, userName);
        }}
        onCancel={() => setPinOpen(false)}
      />
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────
export default function MarktPlan() {
  const { adminSession, selectedMarketId } = useAppStore();
  const isAdmin = !!adminSession;
  const canEditSettings = !!adminSession;

  const [markers, setMarkers]     = useState<Marker[]>([]);
  const [hotspotMode, setHotspotMode] = useState(false);
  const [moveMode, setMoveMode]   = useState(false);
  const [modal, setModal]         = useState<null | { mode: "new" | "edit"; marker?: Marker; x?: number; y?: number }>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  // rotateMap: aus DB laden (geraeteuebergreifend), localStorage nur als sofortiger Fallback
  const [rotateMap, setRotateMap] = useState<boolean>(
    () => localStorage.getItem("marktplan_rotated") === "1"
  );
  const [rotateMapLoaded, setRotateMapLoaded] = useState(false);

  // Drag-State
  const dragId  = useRef<number | null>(null);
  const imgRef  = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // Bildbreite tracken → Marker proportional skalieren
  const [imageWidth, setImageWidth] = useState(MARKER_REFERENCE_WIDTH);
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setImageWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const markerScale = useMemo(
    () => Math.min(1.0, Math.max(0.2, imageWidth / MARKER_REFERENCE_WIDTH)),
    [imageWidth]
  );

  // Marker laden + Plan-Rotation aus DB laden
  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    try {
      const [markersRes, marketsRes] = await Promise.all([
        fetch(`${BASE}/shelf-markers?marketId=${selectedMarketId}`),
        fetch(`${BASE}/markets`),
      ]);
      if (markersRes.ok) setMarkers(await markersRes.json());
      if (marketsRes.ok) {
        const markets: Array<{ id: number; planRotiert?: boolean | null }> = await marketsRes.json();
        const market = markets.find(m => m.id === selectedMarketId);
        if (market && !rotateMapLoaded) {
          const serverRotated = !!market.planRotiert;
          setRotateMap(serverRotated);
          localStorage.setItem("marktplan_rotated", serverRotated ? "1" : "0");
          setRotateMapLoaded(true);
        }
      }
    } catch { /* ignore */ }
  }, [selectedMarketId, rotateMapLoaded]);

  // Plan-Rotation umschalten und in DB speichern
  const toggleRotateMap = useCallback(async () => {
    const next = !rotateMap;
    setRotateMap(next);
    localStorage.setItem("marktplan_rotated", next ? "1" : "0");
    if (selectedMarketId) {
      try {
        await fetch(`${BASE}/markets/${selectedMarketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planRotiert: next }),
        });
      } catch { /* ignore */ }
    }
  }, [rotateMap, selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  // Nur eines der Modi aktiv
  const activateHotspot = () => { setHotspotMode(true);  setMoveMode(false); };
  const activateMove    = () => { setMoveMode(true);    setHotspotMode(false); };
  const deactivateModes = () => { setHotspotMode(false); setMoveMode(false); };

  // Koordinaten-Hilfe: visuell → Layout (bei 90° CW-Rotation)
  const toLayout = useCallback((vx: number, vy: number) => {
    if (!rotateMap) return { x: vx, y: vy };
    return { x: vy, y: 100 - vx };
  }, [rotateMap]);

  // Klick auf Bild (im Hotspot-Modus) → neuen Marker
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hotspotMode || !isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = toLayout(
      ((e.clientX - rect.left) / rect.width)  * 100,
      ((e.clientY - rect.top)  / rect.height) * 100,
    );
    setForm(EMPTY_FORM);
    setModal({ mode: "new", x: raw.x, y: raw.y });
  }, [hotspotMode, isAdmin, toLayout]);

  // ── Drag-Handlers ────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent, m: Marker) => {
    if (!moveMode || !isAdmin) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragId.current = m.id;
    setDraggingId(m.id);
  }, [moveMode, isAdmin]);

  const handlePointerMove = useCallback((e: React.PointerEvent, m: Marker) => {
    if (!moveMode || dragId.current !== m.id || !imgRef.current) return;
    e.stopPropagation();
    const rect = imgRef.current.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0.5, Math.min(99.5, v));
    const raw = toLayout(
      clamp(((e.clientX - rect.left) / rect.width)  * 100),
      clamp(((e.clientY - rect.top)  / rect.height) * 100),
    );
    setMarkers(prev => prev.map(mk =>
      mk.id === m.id ? { ...mk, x: clamp(raw.x).toFixed(3), y: clamp(raw.y).toFixed(3) } : mk
    ));
  }, [moveMode, toLayout]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent, m: Marker) => {
    if (dragId.current !== m.id) return;
    dragId.current = null;
    setDraggingId(null);
    const updated = markers.find(mk => mk.id === m.id);
    if (!updated) return;
    await fetch(`${BASE}/shelf-markers/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: updated.x, y: updated.y }),
    });
  }, [markers]);

  // Speichern (neu / edit) — nur für canEditSettings
  const handleSave = async () => {
    if (!form.label.trim() || !selectedMarketId) return;
    setSaving(true);
    // Berechnete Werte — werden durch Ersterfassung-Felder ueberschrieben wenn gesetzt
    const calcReduzierung = calcIsoDate(form.reduzierungsRegel, "reduzieren") || null;
    const calcKnick       = calcIsoDate(form.aktionsHinweis,    "knick")      || null;
    const reduzierungsDatum = form.erstReduzierungsDatum || calcReduzierung;
    const knickDatum        = form.erstKnickDatum        || calcKnick;
    const calcKontrolle = calcNaechsteKontrolleDatum(form.kontrollRhythmus, knickDatum) || null;
    const naechsteKontrolle = form.erstNaechsteKontrolle || calcKontrolle;
    // Letzte Kontrolle aus Ersterfassung
    const letzteKontrolleAt  = form.erstLetzteKontrolleAt
      ? new Date(form.erstLetzteKontrolleAt + "T00:00:00").toISOString()
      : undefined;
    const letzteKontrolleVon = form.erstLetzteKontrolleVon || undefined;
    const common = {
      sortiment: form.sortiment || null,
      reduzierungsRegel: form.reduzierungsRegel || null,
      reduzierungsDatum,
      aktionsHinweis: form.aktionsHinweis || null,
      knickDatum,
      kontrollRhythmus: form.kontrollRhythmus || null,
      naechsteKontrolle,
      ...(letzteKontrolleAt  !== undefined ? { letzteKontrolleAt }  : {}),
      ...(letzteKontrolleVon !== undefined ? { letzteKontrolleVon } : {}),
      size: form.size,
      rotated: form.rotated,
    };
    try {
      if (modal?.mode === "new") {
        await fetch(`${BASE}/shelf-markers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marketId: selectedMarketId,
            label: form.label.trim(),
            x: modal.x?.toFixed(3), y: modal.y?.toFixed(3),
            ...common,
          }),
        });
      } else if (modal?.marker) {
        await fetch(`${BASE}/shelf-markers/${modal.marker.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: form.label.trim(), ...common }),
        });
      }
      await load();
      setModal(null);
    } finally { setSaving(false); }
  };

  // Kontrolliert melden — nach PIN-Bestätigung (nur letzteKontrolle, kein naechsteKontrolle-Reset)
  const handleKontrolliert = useCallback(async (_userId: number, userName: string) => {
    if (!modal?.marker) return;
    await fetch(`${BASE}/shelf-markers/${modal.marker.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letzteKontrolleAt:  new Date().toISOString(),
        letzteKontrolleVon: userName,
      }),
    });
    await load();
    setModal(null);
  }, [modal, load]);

  const handleDelete = async () => {
    if (!modal?.marker || !confirm(`"${modal.marker.label}" wirklich loeschen?`)) return;
    await fetch(`${BASE}/shelf-markers/${modal.marker.id}`, { method: "DELETE" });
    await load();
    setModal(null);
  };

  const openEdit = (m: Marker) => {
    setForm({
      label: m.label,
      sortiment: m.sortiment ?? "",
      reduzierungsRegel: m.reduzierungsRegel ?? "",
      aktionsHinweis: m.aktionsHinweis ?? "",
      kontrollRhythmus: m.kontrollRhythmus ?? "",
      size: m.size ?? "xs",
      rotated: m.rotated ?? false,
      // Ersterfassung: immer leer starten (nur fuer manuelle Neueingabe)
      erstReduzierungsDatum:  "",
      erstKnickDatum:         "",
      erstNaechsteKontrolle:  "",
      erstLetzteKontrolleAt:  "",
      erstLetzteKontrolleVon: "",
    });
    setModal({ mode: "edit", marker: m });
  };

  const panningDisabled = hotspotMode || moveMode;

  // Legende
  const counts = { ok: 0, bald: 0, faellig: 0, neu: 0 };
  markers.forEach(m => counts[markerStatus(m)]++);

  return (
    <AppLayout>
      <div className="space-y-3">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 sm:p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Link href="/mhd-kontrolle" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Interaktiver Marktplan</h1>
              <p className="text-sm text-white/75">MHD-Kontroll-Regalmeter · EDEKA DALLMANN</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold">
              {counts.faellig > 0 && <span className="flex items-center gap-1 text-white/90"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>{counts.faellig} Überfällig</span>}
              {counts.bald    > 0 && <span className="flex items-center gap-1 text-white/80"><span className="w-2 h-2 rounded-full bg-amber-300"/>{counts.bald} Bald</span>}
              {counts.ok      > 0 && <span className="flex items-center gap-1 text-white/80"><span className="w-2 h-2 rounded-full bg-green-400"/>{counts.ok} OK</span>}
            </div>
          </div>
        </div>

        {/* Karte */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-secondary/30 flex-wrap">

            {!isAdmin && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Move className="w-3.5 h-3.5" />
                <span>Ziehen / Scroll zum Navigieren</span>
              </div>
            )}

            {isAdmin && (
              <>
                {/* Modus-Buttons */}
                <button
                  onClick={panningDisabled && !moveMode && !hotspotMode ? deactivateModes : deactivateModes}
                  title="Karte frei navigieren"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                    ${!hotspotMode && !moveMode
                      ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                      : "bg-white text-muted-foreground border-border hover:bg-secondary"}`}>
                  <Move className="w-3.5 h-3.5" /> Navigieren
                </button>

                <button
                  onClick={hotspotMode ? deactivateModes : activateHotspot}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                    ${hotspotMode
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"}`}>
                  <Plus className="w-3.5 h-3.5" />
                  {hotspotMode ? "Auf Plan klicken..." : "Marker setzen"}
                </button>

                <button
                  onClick={moveMode ? deactivateModes : activateMove}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                    ${moveMode
                      ? "bg-violet-600 text-white border-violet-600 shadow-md"
                      : "bg-white text-violet-700 border-violet-300 hover:bg-violet-50"}`}>
                  <MoveIcon className="w-3.5 h-3.5" />
                  {moveMode ? "Marker ziehen..." : "Marker verschieben"}
                </button>
              </>
            )}

            <div className="flex-1" />

            {/* Plan drehen */}
            <button
              onClick={toggleRotateMap}
              title={rotateMap ? "Plan horizontal (original)" : "Plan vertikal (90 Grad)"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                ${rotateMap
                  ? "bg-teal-600 text-white border-teal-600 shadow-md"
                  : "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"}`}>
              <RotateCw className="w-3.5 h-3.5" />
              {rotateMap ? "Vertikal" : "Drehen"}
            </button>

            <span className="text-xs text-muted-foreground">{markers.length} Marker</span>
          </div>

          {/* Zoom/Pan */}
          <TransformWrapper
            key={String(rotateMap)}
            initialScale={rotateMap ? 0.55 : 1} minScale={0.1} maxScale={10}
            limitToBounds={false}
            panning={{ disabled: panningDisabled }}
            wheel={{ step: 0.08 }}
            doubleClick={{ disabled: false, step: 0.7 }}
          >
            {() => (
              <div className="relative">
                <div className="absolute top-3 right-3 z-20">
                  <ZoomControls />
                </div>
                <div
                  className={`bg-[#f0f0eb] overflow-hidden select-none
                    ${hotspotMode ? "cursor-crosshair" : moveMode ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                  style={{ height: "calc(100vh - 220px)", minHeight: 420 }}>
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}>
                    {/* Bild-Container — Marker werden relativ dazu positioniert */}
                    <div
                      ref={imgRef}
                      style={{
                        position: "relative",
                        display: "block",
                        width: "100%",
                        alignSelf: "flex-start",
                        lineHeight: 0,
                        transform: rotateMap ? "rotate(90deg)" : undefined,
                        transformOrigin: "center center",
                      }}
                      onClick={handleImageClick}
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}leederplan.svg`}
                        alt="Marktplan EDEKA DALLMANN Leeder"
                        draggable={false}
                        style={{ display: "block", width: "100%", height: "auto", userSelect: "none" }}
                      />
                      {markers.map(m => (
                        <MarkerPin
                          key={m.id}
                          marker={m}
                          onEdit={openEdit}
                          moveMode={moveMode}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          isDragging={draggingId === m.id}
                          mapRotated={rotateMap}
                          markerScale={markerScale}
                        />
                      ))}
                    </div>
                  </TransformComponent>
                </div>
              </div>
            )}
          </TransformWrapper>
        </div>

        {/* Hinweis-Banner */}
        {markers.length === 0 && isAdmin && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs">
              Noch keine Marker. Klicke auf <strong>Marker setzen</strong> und dann auf eine Stelle im Plan.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <MarkerModal
          mode={modal.mode} marker={modal.marker}
          form={form} setForm={setForm}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onClose={() => setModal(null)}
          saving={saving}
          canEditSettings={canEditSettings}
          onKontrolliert={handleKontrolliert}
        />
      )}
    </AppLayout>
  );
}
