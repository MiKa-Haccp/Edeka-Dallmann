import { useState, useRef, useCallback, useEffect } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import {
  ChevronLeft, ZoomIn, ZoomOut, Maximize2, MapPin,
  Move, Plus, X, Trash2, Save, Info, Pencil,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

const BASE = import.meta.env.VITE_API_URL || "/api";

// ─── Typen ───────────────────────────────────────────────────────────────────
interface Marker {
  id: number;
  marketId: number;
  label: string;
  x: string;
  y: string;
  sortiment: string | null;
  reduzierungsRegel: string | null;
  aktionsHinweis: string | null;
  kontrollIntervall: number | null;
  naechsteKontrolle: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  label: "",
  sortiment: "",
  reduzierungsRegel: "",
  aktionsHinweis: "",
  kontrollIntervall: 7,
  naechsteKontrolle: "",
};

// ─── Status-Ampel ────────────────────────────────────────────────────────────
function markerStatus(m: Marker): "neu" | "ok" | "bald" | "faellig" {
  if (!m.naechsteKontrolle) return "neu";
  const today = new Date(); today.setHours(0,0,0,0);
  const next  = new Date(m.naechsteKontrolle + "T00:00:00");
  const diffD = Math.round((next.getTime() - today.getTime()) / 86400000);
  if (diffD < 0)  return "faellig";
  if (diffD <= 2) return "bald";
  return "ok";
}

const STATUS_STYLE = {
  neu:     { dot: "bg-gray-400",  ring: "ring-gray-300",   btn: "border-gray-300 bg-white text-gray-700",       label: "Neu" },
  ok:      { dot: "bg-green-500", ring: "ring-green-300",  btn: "border-green-300 bg-green-50 text-green-800",  label: "OK" },
  bald:    { dot: "bg-amber-400", ring: "ring-amber-300",  btn: "border-amber-300 bg-amber-50 text-amber-800",  label: "Bald" },
  faellig: { dot: "bg-red-500",   ring: "ring-red-300",    btn: "border-red-300 bg-red-50 text-red-800",        label: "Ueberfaellig" },
};

const INTERVALL_OPTIONS = [
  { value: 1,  label: "Taeglich" },
  { value: 2,  label: "Alle 2 Tage" },
  { value: 7,  label: "Woechentlich" },
  { value: 14, label: "Alle 2 Wochen" },
  { value: 30, label: "Monatlich" },
];

// ─── Zoom Controls ───────────────────────────────────────────────────────────
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="flex items-center gap-1">
      {[
        { icon: ZoomIn,    fn: () => zoomIn(0.35),        title: "Vergrossern" },
        { icon: ZoomOut,   fn: () => zoomOut(0.35),       title: "Verkleinern" },
        { icon: Maximize2, fn: () => resetTransform(),    title: "Zurucksetzen" },
      ].map(({ icon: Icon, fn, title }) => (
        <button key={title} onClick={fn} title={title}
          className="w-8 h-8 rounded-lg bg-white border border-border/60 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

// ─── Marker-Button auf dem Plan ───────────────────────────────────────────────
function MarkerPin({ marker, onEdit, isAdmin }: {
  marker: Marker;
  onEdit: (m: Marker) => void;
  isAdmin: boolean;
}) {
  const st = markerStatus(marker);
  const s  = STATUS_STYLE[st];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onEdit(marker); }}
      title={`${marker.label}${marker.sortiment ? " — " + marker.sortiment : ""}`}
      style={{
        position: "absolute",
        left: `${marker.x}%`,
        top:  `${marker.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        pointerEvents: "auto",
      }}
      className={`
        group flex items-center gap-1 px-2 py-1 rounded-lg border-2 shadow-md
        text-xs font-bold whitespace-nowrap transition-all duration-150
        hover:scale-110 hover:shadow-lg active:scale-95
        ${s.btn} ring-2 ${s.ring}
      `}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot} ${st === "faellig" ? "animate-pulse" : ""}`} />
      <span className="max-w-[100px] truncate">{marker.label}</span>
      {isAdmin && (
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
      )}
    </button>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function MarkerModal({
  mode, marker, form, setForm, onSave, onDelete, onClose, saving,
}: {
  mode: "new" | "edit";
  marker?: Marker;
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-[#1a3a6b]/5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1a3a6b]" />
            <span className="font-bold text-[#1a3a6b]">
              {mode === "new" ? "Neuer Regalmeter-Marker" : "Marker bearbeiten"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Felder */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Bezeichnung */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Bezeichnung <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
              placeholder='z.B. "Chips-Regal Mitte"'
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
            />
          </div>

          {/* Sortiment */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sortiment</label>
            <input
              value={form.sortiment}
              onChange={e => setForm({ ...form, sortiment: e.target.value })}
              placeholder='z.B. "Chips, Nuesse, Snacks"'
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
            />
          </div>

          {/* Reduzierungsregel */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Reduzierungsregel</label>
            <input
              value={form.reduzierungsRegel}
              onChange={e => setForm({ ...form, reduzierungsRegel: e.target.value })}
              placeholder='z.B. "2 Wochen vor Ablauf reduzieren"'
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
            />
          </div>

          {/* Aktionshinweis */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Aktionshinweis</label>
            <input
              value={form.aktionsHinweis}
              onChange={e => setForm({ ...form, aktionsHinweis: e.target.value })}
              placeholder='z.B. "Knick ins Etikett"'
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Kontrollintervall */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Kontrollintervall</label>
              <select
                value={form.kontrollIntervall}
                onChange={e => setForm({ ...form, kontrollIntervall: Number(e.target.value) })}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
              >
                {INTERVALL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Nächste Kontrolle */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Naechste Kontrolle</label>
              <input
                type="date"
                value={form.naechsteKontrolle}
                onChange={e => setForm({ ...form, naechsteKontrolle: e.target.value })}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
              />
            </div>
          </div>

          {/* Status-Vorschau */}
          {form.naechsteKontrolle && (() => {
            const preview: Marker = {
              ...(marker ?? {} as Marker),
              ...form,
              x: "0", y: "0",
              naechsteKontrolle: form.naechsteKontrolle || null,
              sortiment: form.sortiment || null,
              reduzierungsRegel: form.reduzierungsRegel || null,
              aktionsHinweis: form.aktionsHinweis || null,
            };
            const st = markerStatus(preview);
            const s  = STATUS_STYLE[st];
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${s.btn}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                Status: {s.label}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border/60 bg-secondary/20">
          {mode === "edit" && onDelete && (
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Loeschen
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
            Abbrechen
          </button>
          <button onClick={onSave} disabled={!form.label.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white text-sm font-bold transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Speichere..." : mode === "new" ? "Anlegen" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────
export default function MarktPlan() {
  const { adminSession, selectedMarketId } = useAppStore();
  const isAdmin = !!adminSession;

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hotspotMode, setHotspotMode] = useState(false);
  const [modal, setModal] = useState<null | { mode: "new" | "edit"; marker?: Marker; x?: number; y?: number }>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Marker laden
  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    try {
      const r = await fetch(`${BASE}/shelf-markers?marketId=${selectedMarketId}`);
      if (r.ok) setMarkers(await r.json());
    } catch { /* ignore */ }
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  // Klick auf Bild im Hotspot-Modus → neuen Marker platzieren
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hotspotMode || !isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setForm(EMPTY_FORM);
    setModal({ mode: "new", x, y });
  }, [hotspotMode, isAdmin]);

  // Marker speichern (neu oder aktualisieren)
  const handleSave = async () => {
    if (!form.label.trim() || !selectedMarketId) return;
    setSaving(true);
    try {
      if (modal?.mode === "new") {
        await fetch(`${BASE}/shelf-markers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marketId: selectedMarketId,
            label: form.label.trim(),
            x: modal.x?.toFixed(3),
            y: modal.y?.toFixed(3),
            sortiment: form.sortiment || null,
            reduzierungsRegel: form.reduzierungsRegel || null,
            aktionsHinweis: form.aktionsHinweis || null,
            kontrollIntervall: form.kontrollIntervall,
            naechsteKontrolle: form.naechsteKontrolle || null,
          }),
        });
      } else if (modal?.marker) {
        await fetch(`${BASE}/shelf-markers/${modal.marker.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            sortiment: form.sortiment || null,
            reduzierungsRegel: form.reduzierungsRegel || null,
            aktionsHinweis: form.aktionsHinweis || null,
            kontrollIntervall: form.kontrollIntervall,
            naechsteKontrolle: form.naechsteKontrolle || null,
          }),
        });
      }
      await load();
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  // Marker löschen
  const handleDelete = async () => {
    if (!modal?.marker) return;
    if (!confirm(`"${modal.marker.label}" wirklich loeschen?`)) return;
    await fetch(`${BASE}/shelf-markers/${modal.marker.id}`, { method: "DELETE" });
    await load();
    setModal(null);
  };

  // Edit öffnen
  const openEdit = (m: Marker) => {
    setForm({
      label: m.label,
      sortiment: m.sortiment ?? "",
      reduzierungsRegel: m.reduzierungsRegel ?? "",
      aktionsHinweis: m.aktionsHinweis ?? "",
      kontrollIntervall: m.kontrollIntervall ?? 7,
      naechsteKontrolle: m.naechsteKontrolle ?? "",
    });
    setModal({ mode: "edit", marker: m });
  };

  // Legende
  const counts = { ok: 0, bald: 0, faellig: 0, neu: 0 };
  markers.forEach(m => counts[markerStatus(m)]++);

  return (
    <AppLayout>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware-mhd" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Interaktiver Marktplan</h1>
            <p className="text-sm text-muted-foreground">MHD-Kontroll-Regalmeter · EDEKA DALLMANN Leeder</p>
          </div>
          {/* Legende */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-bold">
            {counts.faellig > 0 && <span className="flex items-center gap-1 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>{counts.faellig} Ueberfaellig</span>}
            {counts.bald    > 0 && <span className="flex items-center gap-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-400"/>{counts.bald} Bald</span>}
            {counts.ok      > 0 && <span className="flex items-center gap-1 text-green-700"><span className="w-2 h-2 rounded-full bg-green-500"/>{counts.ok} OK</span>}
            {counts.neu     > 0 && <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-400"/>{counts.neu} Neu</span>}
          </div>
        </div>

        {/* Karte */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-secondary/30 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Move className="w-3.5 h-3.5" />
              <span>Ziehen / Pinch / Scroll zum Navigieren</span>
            </div>
            <div className="flex-1" />
            {isAdmin && (
              <button
                onClick={() => setHotspotMode(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                  ${hotspotMode
                    ? "bg-[#1a3a6b] text-white border-[#1a3a6b] shadow-md"
                    : "bg-white text-[#1a3a6b] border-[#1a3a6b]/30 hover:bg-[#1a3a6b]/5"}`}>
                <Plus className="w-3.5 h-3.5" />
                {hotspotMode ? "Auf Karte klicken zum Platzieren" : "Marker hinzufuegen"}
              </button>
            )}
          </div>

          {/* Zoom/Pan */}
          <TransformWrapper
            initialScale={1} minScale={0.3} maxScale={8}
            limitToBounds={false}
            panning={{ disabled: hotspotMode }}
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
                    ${hotspotMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
                  style={{ height: "calc(100vh - 230px)", minHeight: 400 }}>
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}>
                    {/* Wrapper relativ zum Bild — Marker werden darin positioniert */}
                    <div
                      style={{ position: "relative", display: "inline-block", width: "100%", lineHeight: 0 }}
                      onClick={handleImageClick}
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}leederplan.svg`}
                        alt="Marktplan EDEKA DALLMANN Leeder"
                        draggable={false}
                        style={{ display: "block", width: "100%", height: "auto", userSelect: "none" }}
                      />
                      {/* Marker-Buttons */}
                      {markers.map(m => (
                        <MarkerPin key={m.id} marker={m} onEdit={openEdit} isAdmin={isAdmin} />
                      ))}
                    </div>
                  </TransformComponent>
                </div>
              </div>
            )}
          </TransformWrapper>
        </div>

        {/* Info wenn keine Marker vorhanden */}
        {markers.length === 0 && isAdmin && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Noch keine Marker gesetzt</p>
              <p className="text-xs text-blue-700">
                Klicke auf "Marker hinzufuegen" oben rechts und dann auf eine Stelle im Plan um einen Regalmeter zu markieren.
              </p>
            </div>
          </div>
        )}
        {markers.length === 0 && !isAdmin && (
          <div className="flex items-start gap-3 p-4 bg-secondary/50 border border-border/60 rounded-2xl text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Noch keine Regalmeter-Marker vorhanden. Ein Admin kann diese im Hotspot-Modus setzen.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <MarkerModal
          mode={modal.mode}
          marker={modal.marker}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </AppLayout>
  );
}
