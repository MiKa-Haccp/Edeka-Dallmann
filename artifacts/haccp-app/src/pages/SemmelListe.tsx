import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useArchivLock } from "@/hooks/useArchivLock";
import { ArchivBanner } from "@/components/ArchivBanner";
import {
  ChevronLeft, ChevronRight, Loader2, Check, X, Lock,
  ArrowLeft, ShoppingBag, Plus, Settings2, Trash2,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const WD_LABELS = ["Mo","Di","Mi","Do","Fr","Sa"] as const;
type WdKey = typeof WD_LABELS[number];
type WdKontingent = Record<WdKey, number>;

type ItemConfig = {
  label: string;
  kontingent: WdKontingent;
};

function defaultKontingent(): WdKontingent {
  return { Mo:0, Di:0, Mi:0, Do:0, Fr:0, Sa:0 };
}

function normalizeItem(ic: any): ItemConfig {
  if (ic && ic.kontingent && typeof ic.kontingent === "object") return ic as ItemConfig;
  const std = ic?.standard || 0;
  return { label: ic?.label || "", kontingent: { Mo:std, Di:std, Mi:std, Do:std, Fr:std, Sa:std } };
}

type SemmelEntry = {
  id: number;
  day: number;
  semmel: string | null;
  sandwich: string | null;
  kuerzel: string;
  zeit: string | null;
  items: Record<string, string> | null;
};

type Kontingent = {
  market_id: number;
  semmel_standard: number;
  freifeld_label: string;
  freifeld_standard: number;
  items: any[];
};

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function getWeekday(year: number, month: number, day: number) { return WOCHENTAGE[new Date(year, month-1, day).getDay()]; }
function getWdKey(year: number, month: number, day: number): WdKey | null {
  const d = new Date(year, month-1, day).getDay();
  if (d === 0) return null; // Sonntag
  return WD_LABELS[d - 1];
}
function isWeekend(year: number, month: number, day: number) { const d=new Date(year,month-1,day).getDay(); return d===0||d===6; }
function isFuture(year: number, month: number, day: number) { const n=new Date();n.setHours(0,0,0,0);return new Date(year,month-1,day)>n; }
function isToday(year: number, month: number, day: number) { const n=new Date(); return n.getFullYear()===year&&n.getMonth()+1===month&&n.getDate()===day; }

function getItemValue(entry: SemmelEntry, label: string, idx: number): number {
  if (entry.items && entry.items[label] !== undefined) return parseInt(entry.items[label] || "0") || 0;
  if (idx === 0) return parseInt(entry.semmel || "0") || 0;
  if (idx === 1) return parseInt(entry.sandwich || "0") || 0;
  return 0;
}

function getDayTotal(dayEntries: SemmelEntry[], label: string, idx: number): number {
  return dayEntries.reduce((s, e) => s + getItemValue(e, label, idx), 0);
}

// ─── PIN-Schritt ─────────────────────────────────────────────────────────────
function PinStep({ onVerified, onBack, loading, setLoading }: {
  onVerified: (name: string, userId: number, kuerzel: string) => void;
  onBack: () => void; loading: boolean; setLoading: (v: boolean) => void;
}) {
  const [pin, setPin] = useState(""); const [error, setError] = useState("");
  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, tenantId: 1 }) });
      const data = await res.json();
      if (data.valid) onVerified(data.userName, data.userId, data.initials);
      else setError("PIN ungültig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2"><Lock className="w-6 h-6 text-primary" /></div>
        <p className="text-sm text-muted-foreground">PIN eingeben zur Bestätigung</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={e => e.key === "Enter" && pin.length >= 3 && verify()}
        className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurück</button>
        <button onClick={verify} disabled={pin.length < 3 || loading}
          className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Bestätigen
        </button>
      </div>
    </div>
  );
}

// ─── Reste-Eintrag-Modal ──────────────────────────────────────────────────────
function SemmelModal({ day, year, month, existingEntries, itemConfigs, onConfirm, onClose }: {
  day: number; year: number; month: number;
  existingEntries: SemmelEntry[];
  itemConfigs: ItemConfig[];
  onConfirm: (data: { items: Record<string, string>; semmel: string; sandwich: string; kuerzel: string; userId: number | null }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "pin">("form");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const dayStr = `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
  const wt = getWeekday(year, month, day);

  const handleVerified = (_name: string, userId: number, kuerzel: string) => {
    const semmel = values[itemConfigs[0]?.label] || "";
    const sandwich = itemConfigs[1] ? values[itemConfigs[1].label] || "" : "";
    onConfirm({ items: values, semmel, sandwich, kuerzel, userId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Reste eintragen – {wt} {dayStr}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Übrig gebliebene Menge eingeben</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {existingEntries.length > 0 && step === "form" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
            <p className="font-semibold text-amber-800 mb-1">Bereits eingetragen heute:</p>
            {existingEntries.map(e => (
              <div key={e.id} className="text-amber-700">
                {itemConfigs.map((ic, idx) => {
                  const v = getItemValue(e, ic.label, idx);
                  return v > 0 ? `${ic.label}: ${v} Reste` : null;
                }).filter(Boolean).join(" · ")} – {e.kuerzel} {e.zeit ? `um ${e.zeit}` : ""}
              </div>
            ))}
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            <div className={`grid gap-3 ${itemConfigs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {itemConfigs.map((ic, idx) => (
                <div key={ic.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{ic.label} – Reste (Stück)</label>
                  <input type="text" inputMode="numeric" placeholder="0"
                    value={values[ic.label] || ""}
                    onChange={e => setValues(v => ({ ...v, [ic.label]: e.target.value }))}
                    autoFocus={idx === 0}
                    className="w-full border rounded-lg px-3 py-2.5 text-xl text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button onClick={() => setStep("pin")}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90">Weiter</button>
            </div>
          </div>
        )}

        {step === "pin" && (
          <PinStep onVerified={handleVerified} onBack={() => setStep("form")} loading={loading} setLoading={setLoading} />
        )}
      </div>
    </div>
  );
}

// ─── Kontingent-Modal (Wochentag-basiert) ────────────────────────────────────
function KontingentModal({ marketId, current, onSave, onClose }: {
  marketId: number; current: ItemConfig[];
  onSave: (items: ItemConfig[]) => void; onClose: () => void;
}) {
  const [items, setItems] = useState<ItemConfig[]>(() =>
    current.length > 0 ? current.map(i => ({ ...i, kontingent: { ...i.kontingent } }))
      : [{ label: "Semmel", kontingent: defaultKontingent() }]
  );
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const updateLabel = (idx: number, val: string) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, label: val } : it));

  const updateKont = (idx: number, wd: WdKey, val: string) =>
    setItems(prev => prev.map((it, i) => i === idx
      ? { ...it, kontingent: { ...it.kontingent, [wd]: parseInt(val) || 0 } }
      : it));

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const addItem = () => {
    const label = newLabel.trim();
    if (!label || items.find(i => i.label === label)) return;
    setItems(prev => [...prev, { label, kontingent: defaultKontingent() }]);
    setNewLabel("");
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      marketId,
      semmelStandard: items[0]?.kontingent.Mo ?? 0,
      freifelLabel: items[1]?.label ?? "",
      freifelStandard: items[1]?.kontingent.Mo ?? 0,
      items,
    };
    await fetch(`${BASE}/semmelliste/kontingent`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    onSave(items);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Bestellkontingent pro Wochentag</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground">Wie viel wird an welchem Wochentag bestellt? Mitarbeiter tragen täglich die Reste ein.</p>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input type="text" value={item.label}
                  onChange={e => updateLabel(idx, e.target.value)}
                  placeholder="Bezeichnung (z.B. Semmel)"
                  className="flex-1 text-sm font-semibold border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary" />
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {WD_LABELS.map(wd => (
                  <div key={wd} className="text-center">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{wd}</div>
                    <input type="text" inputMode="numeric"
                      value={item.kontingent[wd] || ""}
                      onChange={e => updateKont(idx, wd, e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-full border rounded-lg px-1 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="Neue Sorte hinzufügen (z.B. Laugenbrezel)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={addItem} disabled={!newLabel.trim()}
            className="bg-primary text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────
export default function SemmelListe() {
  const { selectedMarketId, adminSession } = useAppStore();
  const { data: markets } = useListMarkets();
  const marketName = useMemo(() => markets?.find((m: any) => m.id === selectedMarketId)?.name ?? null, [markets, selectedMarketId]);
  const [, navigate] = useLocation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { isLocked, lockInfo } = useArchivLock(year, selectedMarketId ?? null);

  const [entries, setEntries] = useState<SemmelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<number | null>(null);
  const [kontingentModal, setKontingentModal] = useState(false);
  const [itemConfigs, setItemConfigs] = useState<ItemConfig[]>([
    { label: "Semmel", kontingent: defaultKontingent() },
  ]);

  const marketId = selectedMarketId ?? 0;
  const todayRef = useRef<HTMLTableRowElement | null>(null);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const fetchKontingent = useCallback(async () => {
    if (!marketId) return;
    const res = await fetch(`${BASE}/semmelliste/kontingent?marketId=${marketId}`);
    const raw: Kontingent = await res.json();
    const normalized: ItemConfig[] =
      raw.items && raw.items.length > 0
        ? raw.items.map(normalizeItem)
        : [normalizeItem({ label: "Semmel", standard: raw.semmel_standard }),
           raw.freifeld_label ? normalizeItem({ label: raw.freifeld_label, standard: raw.freifeld_standard }) : null
          ].filter(Boolean) as ItemConfig[];
    setItemConfigs(normalized.length > 0 ? normalized : [{ label: "Semmel", kontingent: defaultKontingent() }]);
  }, [marketId]);

  const fetchEntries = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/semmelliste?marketId=${marketId}&year=${year}&month=${month}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [marketId, year, month]);

  useEffect(() => { fetchKontingent(); }, [fetchKontingent]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    if (isCurrentMonth && todayRef.current) {
      setTimeout(() => todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [isCurrentMonth, loading]);

  const entriesByDay = useMemo(() => {
    const m: Record<number, SemmelEntry[]> = {};
    for (const e of entries) { if (!m[e.day]) m[e.day] = []; m[e.day].push(e); }
    return m;
  }, [entries]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSave = async (day: number, data: { items: Record<string, string>; semmel: string; sandwich: string; kuerzel: string; userId: number | null }) => {
    if (isLocked) return;
    await fetch(`${BASE}/semmelliste`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId, year, month, day, semmel: data.semmel || null, sandwich: data.sandwich || null, kuerzel: data.kuerzel, userId: data.userId, items: data.items })
    });
    setModal(null); fetchEntries();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${BASE}/semmelliste/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const days = daysInMonth(year, month);

  // Prüfen ob Kontingent konfiguriert ist
  const hasKontingent = itemConfigs.some(ic => WD_LABELS.some(wd => ic.kontingent[wd] > 0));

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>

        <PageHeader className="mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/category/3")}
              className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Semmelliste</h1>
              <p className="text-sm text-white/70">Resterfassung Bäckerei</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {adminSession && (
                <button onClick={() => setKontingentModal(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors" title="Bestellkontingent bearbeiten">
                  <Settings2 className="w-4 h-4" /><span className="hidden sm:inline">Kontingent</span>
                </button>
              )}
            </div>
          </div>
        </PageHeader>

        {isLocked && <ArchivBanner lockInfo={lockInfo} year={year} className="print:hidden" />}

        {/* Monatsnavigation */}
        <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 mb-2 shrink-0">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5" /></button>
          <div className="text-center">
            <div className="font-bold text-lg">{MONTH_NAMES[month - 1]} {year}</div>
            {marketName && <div className="text-xs text-muted-foreground">Markt {marketName}</div>}
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Bestellkontingent-Anzeige pro Wochentag */}
        {hasKontingent ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-2 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Bestellkontingent</span>
              {adminSession && (
                <button onClick={() => setKontingentModal(true)} className="text-xs text-primary/50 hover:text-primary flex items-center gap-1">
                  <Settings2 className="w-3 h-3" /> bearbeiten
                </button>
              )}
            </div>
            {itemConfigs.map(ic => (
              <div key={ic.label} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{ic.label}:</span>
                <div className="flex gap-2 flex-wrap">
                  {WD_LABELS.map(wd => {
                    const val = ic.kontingent[wd];
                    return (
                      <div key={wd} className={`flex items-center gap-1 text-xs rounded-lg px-2 py-1 ${val > 0 ? "bg-white border border-primary/20" : "opacity-30"}`}>
                        <span className="font-semibold text-muted-foreground">{wd}</span>
                        <span className="font-bold text-primary">{val > 0 ? val : "–"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : adminSession ? (
          <button onClick={() => setKontingentModal(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-primary/30 rounded-xl px-4 py-2 text-xs text-primary/60 hover:bg-primary/5 mb-2 shrink-0">
            <Settings2 className="w-3.5 h-3.5" />Bestellkontingent pro Wochentag festlegen
          </button>
        ) : null}

        {/* Tabelle */}
        <div className="flex-1 min-h-0 border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !marketId ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Bitte einen Markt auswählen.</div>
          ) : (
            <div className="overflow-y-auto h-full">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="border-b bg-muted/60">
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-14">Tag</th>
                    {itemConfigs.map(ic => (
                      <th key={ic.label} className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                        {ic.label}
                        <div className="text-[10px] font-normal text-amber-600/70">Reste</div>
                      </th>
                    ))}
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Kürzel</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                    const dayEntries = entriesByDay[day] ?? [];
                    const wt = getWeekday(year, month, day);
                    const wdKey = getWdKey(year, month, day);
                    const future = isFuture(year, month, day);
                    const today = isToday(year, month, day);
                    const weekend = isWeekend(year, month, day);
                    const clickable = !future && !isLocked;
                    const hasEntries = dayEntries.length > 0;
                    const isSunday = wdKey === null;

                    return (
                      <tr key={day}
                        ref={today ? todayRef : null}
                        onClick={() => !future && !isLocked && setModal(day)}
                        className={[
                          "border-b last:border-0 transition-colors",
                          isSunday ? "opacity-30 pointer-events-none" : "",
                          today ? "bg-blue-50/60" : weekend ? "bg-muted/20" : "",
                          hasEntries && !today ? "bg-green-50/30" : "",
                          clickable && !isSunday ? "cursor-pointer hover:bg-primary/5 active:bg-primary/10" : "",
                          future ? "opacity-40" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col leading-none">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-sm">{String(day).padStart(2, "0")}</span>
                              {today && <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HEUTE</span>}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[10px] font-medium ${weekend ? "text-red-500" : "text-muted-foreground"}`}>{wt}</span>
                              {wdKey && hasKontingent && (
                                <span className="text-[10px] text-primary/50">
                                  {itemConfigs.map(ic => {
                                    const k = ic.kontingent[wdKey];
                                    return k > 0 ? `${k}` : null;
                                  }).filter(Boolean).join("/")}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {itemConfigs.map((ic, idx) => {
                          const total = getDayTotal(dayEntries, ic.label, idx);
                          const wdKont = wdKey ? ic.kontingent[wdKey] : 0;
                          const hasRest = total > 0;
                          return (
                            <td key={ic.label} className="px-3 py-2.5 text-center">
                              {hasEntries ? (
                                <div>
                                  <span className={`font-mono font-bold text-base ${hasRest ? "text-amber-600" : "text-green-600"}`}>
                                    {total}
                                  </span>
                                  {hasRest && wdKont > 0 && (
                                    <div className="text-[10px] text-muted-foreground/60">
                                      von {wdKont}
                                    </div>
                                  )}
                                  {dayEntries.length > 1 && (
                                    <div className="text-[10px] text-muted-foreground">({dayEntries.length}×)</div>
                                  )}
                                </div>
                              ) : !isSunday && !future ? (
                                <span className="text-muted-foreground/30 text-xs">—</span>
                              ) : null}
                            </td>
                          );
                        })}

                        <td className="px-3 py-2.5">
                          {hasEntries ? (
                            <div className="flex flex-col gap-0.5">
                              {dayEntries.map(e => (
                                <div key={e.id} className="flex items-center gap-1">
                                  <span className="bg-primary/10 text-primary text-[11px] font-bold px-1.5 py-0.5 rounded">{e.kuerzel}</span>
                                  {e.zeit && <span className="text-[10px] text-muted-foreground/60">{e.zeit}</span>}
                                  {adminSession && (
                                    <button onClick={ev => handleDelete(e.id, ev)} className="text-muted-foreground hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors ml-0.5" title="Löschen">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : !isSunday && !future ? (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {modal !== null && (
          <SemmelModal
            day={modal} year={year} month={month}
            existingEntries={entriesByDay[modal] ?? []}
            itemConfigs={itemConfigs}
            onConfirm={data => handleSave(modal, data)}
            onClose={() => setModal(null)}
          />
        )}

        {kontingentModal && (
          <KontingentModal
            marketId={marketId}
            current={itemConfigs}
            onSave={saved => { setItemConfigs(saved); setKontingentModal(false); }}
            onClose={() => setKontingentModal(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}
