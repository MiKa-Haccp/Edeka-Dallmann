import { useState, useEffect, useCallback, type ReactNode, type ElementType } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import {
  ShoppingBag, Phone, User, Info, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Loader2, Trash2, X, KeyRound, Pencil, Save, Ban,
  ArrowUp, ArrowDown, AlignLeft, ArrowDownAZ, CalendarClock, ChevronLeft,
} from "lucide-react";

const NoWrap = ({ children }: { children: ReactNode }) => <>{children}</>;

const BASE = import.meta.env.VITE_API_URL || "/api";

function formatPhoneLine(raw: string): string {
  const clean = raw.trim().replace(/[\s\-\/\.\(\)]/g, "");
  if (!clean) return raw;
  const plus = clean.startsWith("+") ? "+" : "";
  const digits = clean.replace(/^\+/, "");
  const chunk = (s: string, sizes: number[]) => {
    const parts: string[] = [];
    let i = 0;
    for (const n of sizes) { if (i < s.length) { parts.push(s.slice(i, i + n)); i += n; } }
    if (i < s.length) parts.push(s.slice(i));
    return parts.join(" ");
  };
  if (plus && digits.startsWith("49")) {
    const rest = digits.slice(2);
    return /^1[5-7]/.test(rest) ? `+49 ${chunk(rest, [3, 4, 4])}` : `+49 ${chunk(rest, [3, 3, 4])}`;
  }
  if (/^01[5-7]/.test(digits)) return `${digits.slice(0, 4)} ${chunk(digits.slice(4), [4, 3])}`;
  if (/^0800/.test(digits)) return `0800 ${chunk(digits.slice(4), [3, 4])}`;
  if (digits.startsWith("0")) return `${digits.slice(0, 4)} ${chunk(digits.slice(4), [3, 2, 2])}`;
  return raw;
}
function formatPhone(raw: string | null): string {
  if (!raw) return "";
  return raw.split("\n").map(l => l.trim() ? formatPhoneLine(l) : l).join("\n");
}

interface Lieferant {
  id: number;
  name: string;
  ansprechpartner: string | null;
  telefon: string | null;
  info: string | null;
  kuerzel: string | null;
  mindestbestellwert: number | null;
  wird_bestellt: boolean;
  sort_order: number;
}

type SortMode = "eigen" | "alpha" | "datum";

function formatEuro(val: number | null) {
  if (val == null) return null;
  return `€\u00a0${Number(val).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Bestellung {
  id: number;
  lieferant_id: number;
  bestellt_am: string;
  mitarbeiter_kuerzel: string;
  notiz: string | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

function BestellDialog({
  lieferant,
  mode = "bestellen",
  onConfirm,
  onClose,
}: {
  lieferant: Lieferant;
  mode?: "bestellen" | "nicht_bestellt";
  onConfirm: (kuerzel: string, notiz: string) => Promise<void>;
  onClose: () => void;
}) {
  const istNichtBestellt = mode === "nicht_bestellt";
  const [kuerzel, setKuerzel] = useState("");
  const [notiz, setNotiz] = useState(istNichtBestellt ? "nicht bestellt" : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!kuerzel.trim()) { setError("Bitte Code / Kürzel eingeben."); return; }
    setSaving(true);
    try {
      await onConfirm(kuerzel.trim(), notiz.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {istNichtBestellt && <Ban className="w-4 h-4 text-orange-500" />}
              <h2 className="text-lg font-bold text-foreground">
                {istNichtBestellt ? "Nicht bestellt erfassen" : "Bestellung bestätigen"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{lieferant.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Mitarbeiter-Code / Kürzel *
            </label>
            <input
              autoFocus
              value={kuerzel}
              onChange={e => { setKuerzel(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="z.B. MK, 1234, …"
              maxLength={20}
              className="w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Notiz {istNichtBestellt ? "(Grund, optional)" : "(optional)"}
            </label>
            <textarea
              value={notiz}
              onChange={e => setNotiz(e.target.value)}
              placeholder={istNichtBestellt ? "z.B. kein Bedarf, Urlaub, Lager voll …" : "z.B. Sonderbestellung, Menge geändert …"}
              rows={2}
              className="w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
              istNichtBestellt ? "bg-orange-500 hover:bg-orange-600" : "bg-[#f94d00] hover:bg-[#f94d00]"
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : istNichtBestellt ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {istNichtBestellt ? "Nicht bestellt" : "Bestätigen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LieferantCard({
  lieferant,
  bestellungen,
  onBestellen,
  onNichtBestellen,
  onDeleteBestellung,
  onUpdateLieferant,
  isAdmin,
  onMoveUp,
  onMoveDown,
}: {
  lieferant: Lieferant;
  bestellungen: Bestellung[];
  onBestellen: (l: Lieferant) => void;
  onNichtBestellen: (l: Lieferant) => void;
  onDeleteBestellung: (id: number) => void;
  onUpdateLieferant: (id: number, data: Partial<Lieferant>) => Promise<void>;
  isAdmin: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    ansprechpartner: lieferant.ansprechpartner ?? "",
    telefon: lieferant.telefon ?? "",
    info: lieferant.info ?? "",
    mindestbestellwert: lieferant.mindestbestellwert as number | null,
  });

  const last = bestellungen[0];
  const lastIsNichtBestellt = last?.notiz?.toLowerCase().includes("nicht bestellt");

  const startEdit = () => {
    setEditData({
      ansprechpartner: lieferant.ansprechpartner ?? "",
      telefon: lieferant.telefon ?? "",
      info: lieferant.info ?? "",
      mindestbestellwert: lieferant.mindestbestellwert,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onUpdateLieferant(lieferant.id, editData);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      {/* Kompakte Zeile – immer sichtbar, klickbar zum Auf-/Zuklappen */}
      <div
        onClick={() => setOpen(o => !o)}
        className="px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50/60 transition-colors select-none"
      >
        {(onMoveUp !== undefined || onMoveDown !== undefined) && (
          <div className="flex flex-col gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="p-0.5 rounded text-muted-foreground enabled:hover:text-[#f94d00] enabled:hover:bg-orange-100 disabled:opacity-25 transition-colors"
              title="Nach oben"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="p-0.5 rounded text-muted-foreground enabled:hover:text-[#f94d00] enabled:hover:bg-orange-100 disabled:opacity-25 transition-colors"
              title="Nach unten"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-sm">{lieferant.name}</span>
          </div>
          {last ? (
            <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${lastIsNichtBestellt ? "text-orange-500" : "text-green-600"}`}>
              {lastIsNichtBestellt ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {new Date(last.bestellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
              {" "}– {last.mitarbeiter_kuerzel}
              {lastIsNichtBestellt && <span className="ml-1 opacity-70">(nicht best.)</span>}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5 italic">Noch keine Bestellung</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onNichtBestellen(lieferant)}
            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            title="Nicht bestellt erfassen"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onBestellen(lieferant)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#f94d00] text-white rounded-xl text-xs font-bold hover:bg-[#f94d00] transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Bestellen
          </button>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>

      {/* Ausgeklappter Inhalt */}
      {open && (<>
      {/* Aktionsleiste */}
      {isAdmin && (
        <div className="px-5 py-2 border-t border-border/40 flex items-center gap-2">
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 p-1.5 text-xs text-muted-foreground hover:text-[#f94d00] hover:bg-orange-100 rounded-lg transition-colors"
              title="Lieferantendaten bearbeiten"
            >
              <Pencil className="w-3.5 h-3.5" /> Daten bearbeiten
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs border border-border/60 rounded-xl text-muted-foreground hover:text-foreground">
                Abbrechen
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f94d00] text-white rounded-xl text-xs font-bold hover:bg-[#f94d00] disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Speichern
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info-Bereich – Ansicht */}
      {!editing && (lieferant.ansprechpartner || lieferant.telefon || lieferant.info || lieferant.mindestbestellwert != null) && (
        <div className="px-5 py-3 bg-gray-50/60 border-b border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          {lieferant.ansprechpartner && (
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ansprechpartner</p>
                <p className="text-foreground text-sm">{lieferant.ansprechpartner}</p>
              </div>
            </div>
          )}
          {lieferant.telefon && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefon</p>
                <a href={`tel:${lieferant.telefon}`} className="text-[#f94d00] font-medium hover:underline text-sm whitespace-pre-line">{formatPhone(lieferant.telefon)}</a>
              </div>
            </div>
          )}
          {lieferant.info && (
            <div className="flex items-start gap-2 sm:col-span-1">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bestellbesonderheiten</p>
                <p className="text-foreground text-sm whitespace-pre-wrap">{lieferant.info}</p>
              </div>
            </div>
          )}
          {lieferant.mindestbestellwert != null && (
            <div className="flex items-start gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mindestbestellwert</p>
                <p className="text-foreground text-sm font-semibold">{formatEuro(lieferant.mindestbestellwert)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info-Bereich – Bearbeiten */}
      {editing && (
        <div className="px-5 py-4 bg-blue-50/40 border-b border-[#f94d00]/20 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ansprechpartner</label>
              <input
                value={editData.ansprechpartner}
                onChange={e => setEditData(p => ({ ...p, ansprechpartner: e.target.value }))}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mindestbestellwert (€)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                <input
                  type="number" min="0" step="0.01"
                  value={editData.mindestbestellwert ?? ""}
                  onChange={e => setEditData(p => ({ ...p, mindestbestellwert: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="–"
                  className="w-full border border-border/60 rounded-xl pl-7 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tel.Nr.</label>
              <textarea
                value={editData.telefon}
                onChange={e => setEditData(p => ({ ...p, telefon: e.target.value }))}
                rows={2}
                placeholder={"z.B. 0151/42259352\n0800/1234567"}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bestellbesonderheiten</label>
              <textarea
                value={editData.info}
                onChange={e => setEditData(p => ({ ...p, info: e.target.value }))}
                rows={2}
                className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Verlauf */}
      <div className="px-5 pb-3 pt-1">
        {bestellungen.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-2">Noch keine Bestellungen erfasst</p>
        ) : (
          <>
            {historyOpen && (
              <div className="space-y-1.5 mb-2 mt-1">
                {bestellungen.map(b => {
                  const istNichtBestellt = b.notiz?.toLowerCase().includes("nicht bestellt");
                  return (
                    <div key={b.id} className="flex items-start justify-between gap-2 text-sm group">
                      <div className="min-w-0 flex items-start gap-2">
                        {istNichtBestellt
                          ? <Ban className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                          : <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                        }
                        <div>
                          <span className={`font-semibold ${istNichtBestellt ? "text-orange-600" : "text-foreground"}`}>
                            {b.mitarbeiter_kuerzel}
                          </span>
                          <span className="text-muted-foreground ml-2 text-xs">{formatDate(b.bestellt_am)}</span>
                          {b.notiz && !istNichtBestellt && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">↳ {b.notiz}</p>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onDeleteBestellung(b.id)}
                          className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                          title="Eintrag löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setHistoryOpen(h => !h)}
              className="flex items-center gap-1 text-xs text-[#f94d00] font-medium hover:underline"
            >
              {historyOpen
                ? <><ChevronUp className="w-3 h-3" /> Verlauf ausblenden</>
                : <><ChevronDown className="w-3 h-3" /> Bestellverlauf ({bestellungen.length})</>
              }
            </button>
          </>
        )}
      </div>
        </>
      )}
    </div>
  );
}

export default function WareStreckenBestellung({ noLayout }: { noLayout?: boolean } = {}) {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN" || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [lieferanten, setLieferanten] = useState<Lieferant[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogLieferant, setDialogLieferant] = useState<Lieferant | null>(null);
  const [dialogMode, setDialogMode] = useState<"bestellen" | "nicht_bestellt">("bestellen");
  const [sortMode, setSortMode] = useState<SortMode>("eigen");
  const [reorderSaving, setReorderSaving] = useState(false);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const [lRes, bRes] = await Promise.all([
        fetch(`${BASE}/strecken-lieferanten?marketId=${selectedMarketId}&tenantId=1`),
        fetch(`${BASE}/strecken-bestellungen?marketId=${selectedMarketId}&tenantId=1`),
      ]);
      const lData = await lRes.json();
      const bData = await bRes.json();
      setLieferanten(lData.filter((l: Lieferant) => l.wird_bestellt));
      setBestellungen(bData);
    } finally {
      setLoading(false);
    }
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  // ── Sortierte Liste ──────────────────────────────────────────────
  const lastBestellungDate = (lieferantId: number): number => {
    const b = bestellungen.find(b => b.lieferant_id === lieferantId);
    return b ? new Date(b.bestellt_am).getTime() : 0;
  };

  const sortedLieferanten = (() => {
    const copy = [...lieferanten];
    if (sortMode === "alpha") return copy.sort((a, b) => a.name.localeCompare(b.name, "de"));
    if (sortMode === "datum") return copy.sort((a, b) => lastBestellungDate(a.id) - lastBestellungDate(b.id));
    return copy; // "eigen" – already sorted by sort_order from server / local state
  })();

  // ── Reihenfolge ändern (eigen) ───────────────────────────────────
  const moveItem = async (index: number, direction: "up" | "down") => {
    const newList = [...lieferanten];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    const reassigned = newList.map((l, i) => ({ ...l, sort_order: i + 1 }));
    setLieferanten(reassigned);
    setReorderSaving(true);
    try {
      await fetch(`${BASE}/strecken-lieferanten/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: reassigned.map(l => ({ id: l.id, sortOrder: l.sort_order })) }),
      });
    } finally {
      setReorderSaving(false);
    }
  };

  const openBestellen = (l: Lieferant) => { setDialogMode("bestellen"); setDialogLieferant(l); };
  const openNichtBestellen = (l: Lieferant) => { setDialogMode("nicht_bestellt"); setDialogLieferant(l); };

  const handleBestellen = async (kuerzel: string, notiz: string) => {
    if (!dialogLieferant || !selectedMarketId) return;
    const res = await fetch(`${BASE}/strecken-bestellungen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketId: selectedMarketId,
        tenantId: 1,
        lieferantId: dialogLieferant.id,
        mitarbeiterKuerzel: kuerzel,
        notiz: notiz || null,
      }),
    });
    if (res.ok) {
      const neu = await res.json();
      setBestellungen(prev => [neu, ...prev]);
      setDialogLieferant(null);
    }
  };

  const handleDeleteBestellung = async (id: number) => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    await fetch(`${BASE}/strecken-bestellungen/${id}`, { method: "DELETE" });
    setBestellungen(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateLieferant = async (id: number, data: Partial<Lieferant>) => {
    const res = await fetch(`${BASE}/strecken-lieferanten/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: 1, marketId: selectedMarketId, ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLieferanten(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    }
  };

  const getBestellungenForLieferant = (lieferantId: number) =>
    bestellungen.filter(b => b.lieferant_id === lieferantId);

  const Wrap = noLayout ? NoWrap : AppLayout;

  if (!selectedMarketId) {
    return (
      <Wrap>
        <div className="p-10 text-center text-muted-foreground text-sm">Bitte Markt auswählen.</div>
      </Wrap>
    );
  }

  const showMoveButtons = isAdmin && sortMode === "eigen";

  return (
    <Wrap>
      <div className="space-y-4">
        {/* Header – nur im Standalone-Modus */}
        {!noLayout && (
          <PageHeader className="from-[#c73d00] to-[#f94d00]">
            <div className="flex items-center gap-3">
              <Link href="/ware-streckenbestellung" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white">Streckenbestellung</h1>
                <p className="text-white/70 text-sm">Lieferanten & Bestellungen</p>
              </div>
            </div>
          </PageHeader>
        )}

        {/* Sortier-Leiste */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">Sortierung:</span>
          {([
            { key: "eigen", label: "Eigene", icon: AlignLeft },
            { key: "alpha", label: "A–Z", icon: ArrowDownAZ },
            { key: "datum", label: "Letztes Datum", icon: CalendarClock },
          ] as { key: SortMode; label: string; icon: ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                sortMode === key
                  ? "bg-[#f94d00] text-white border-[#f94d00]"
                  : "bg-white text-muted-foreground border-border/60 hover:border-[#f94d00]/40 hover:text-[#f94d00]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          {showMoveButtons && reorderSaving && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Reihenfolge wird gespeichert…
            </span>
          )}
          {showMoveButtons && !reorderSaving && (
            <span className="text-xs text-[#f94d00]/70 ml-2 italic">Reihenfolge mit ↑↓ anpassen</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedLieferanten.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Noch keine Streckenlieferanten angelegt.
          </div>
        ) : (
          sortedLieferanten.map((l, idx) => {
            const eigenIdx = lieferanten.findIndex(x => x.id === l.id);
            return (
              <LieferantCard
                key={l.id}
                lieferant={l}
                bestellungen={getBestellungenForLieferant(l.id)}
                onBestellen={openBestellen}
                onNichtBestellen={openNichtBestellen}
                onDeleteBestellung={handleDeleteBestellung}
                onUpdateLieferant={handleUpdateLieferant}
                isAdmin={isAdmin}
                onMoveUp={showMoveButtons && eigenIdx > 0 ? () => moveItem(eigenIdx, "up") : undefined}
                onMoveDown={showMoveButtons && eigenIdx < lieferanten.length - 1 ? () => moveItem(eigenIdx, "down") : undefined}
              />
            );
          })
        )}
      </div>

      {dialogLieferant && (
        <BestellDialog
          lieferant={dialogLieferant}
          mode={dialogMode}
          onConfirm={handleBestellen}
          onClose={() => setDialogLieferant(null)}
        />
      )}
    </Wrap>
  );
}
