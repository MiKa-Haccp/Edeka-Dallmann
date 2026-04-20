import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Loader2, Check, X, Lock,
  Printer, ArrowLeft, ShoppingBag, Plus, Pencil, Settings2, Trash2,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

type ItemConfig = { label: string; standard: number };

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
  items: ItemConfig[];
};

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function getWeekday(year: number, month: number, day: number) { return WOCHENTAGE[new Date(year, month-1, day).getDay()]; }
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

// ─── Eingabe-Modal (immer neuer Eintrag) ─────────────────────────────────────
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

  const handleVerified = (_name: string, userId: number, kuerzel: string) => {
    const semmel = values[itemConfigs[0]?.label] || "";
    const sandwich = itemConfigs[1] ? values[itemConfigs[1].label] || "" : "";
    onConfirm({ items: values, semmel, sandwich, kuerzel, userId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {existingEntries.length > 0 ? "Nachbuchen" : "Eintragen"} – {dayStr}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Bereits gebuchte Mengen anzeigen */}
        {existingEntries.length > 0 && step === "form" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
            <p className="font-semibold text-amber-800 mb-1">Bereits gebucht:</p>
            {existingEntries.map(e => (
              <div key={e.id} className="text-amber-700">
                {itemConfigs.map((ic, idx) => {
                  const v = getItemValue(e, ic.label, idx);
                  return v > 0 ? `${ic.label}: +${v}` : null;
                }).filter(Boolean).join(" · ")} – {e.kuerzel} {e.zeit ? `um ${e.zeit}` : ""}
              </div>
            ))}
            <div className="mt-1 pt-1 border-t border-amber-200 font-semibold text-amber-800">
              Gesamt: {itemConfigs.map((ic, idx) => {
                const t = getDayTotal(existingEntries, ic.label, idx);
                return t > 0 ? `${ic.label} +${t}` : null;
              }).filter(Boolean).join(" · ")}
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {existingEntries.length > 0 ? "Zusätzliche Menge (on top zur bereits gebuchten Menge)" : "Zusätzliche Menge zum Standardkontingent (on top)"}
            </p>
            <div className={`grid gap-3 ${itemConfigs.length === 1 ? "grid-cols-1" : itemConfigs.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
              {itemConfigs.map((ic, idx) => (
                <div key={ic.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{ic.label} (Stück)</label>
                  <input type="text" inputMode="numeric" placeholder="z.B. 20"
                    value={values[ic.label] || ""}
                    onChange={e => setValues(v => ({ ...v, [ic.label]: e.target.value }))}
                    autoFocus={idx === 0}
                    className="w-full border rounded-lg px-3 py-2.5 text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
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

// ─── Kontingent-Modal (Admin) ─────────────────────────────────────────────────
function KontingentModal({ marketId, current, onSave, onClose }: {
  marketId: number; current: Kontingent;
  onSave: (k: Kontingent) => void; onClose: () => void;
}) {
  const initItems = (): ItemConfig[] => {
    if (current.items && current.items.length > 0) return current.items.map(i => ({ ...i }));
    const result: ItemConfig[] = [{ label: "Semmel", standard: current.semmel_standard }];
    if (current.freifeld_label) result.push({ label: current.freifeld_label, standard: current.freifeld_standard });
    return result;
  };
  const [items, setItems] = useState<ItemConfig[]>(initItems);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const updateItem = (idx: number, field: keyof ItemConfig, val: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === "standard" ? parseInt(val) || 0 : val } : item));
  };
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const addItem = () => {
    const label = newLabel.trim();
    if (!label || items.find(i => i.label === label)) return;
    setItems(prev => [...prev, { label, standard: 0 }]);
    setNewLabel("");
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      marketId,
      semmelStandard: items[0]?.standard ?? 0,
      freifelLabel: items[1]?.label ?? "Sandwich",
      freifelStandard: items[1]?.standard ?? 0,
      items,
    };
    const res = await fetch(`${BASE}/semmelliste/kontingent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" /><h3 className="font-bold text-lg">Standardkontingent</h3></div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground">Tägliche Standardmengen und Spalten konfigurieren. Mitarbeiter buchen zusätzlich (on top).</p>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 border rounded-lg p-2.5">
              <div className="flex-1">
                <input type="text" value={item.label} onChange={e => updateItem(idx, "label", e.target.value)}
                  placeholder="Bezeichnung"
                  className="w-full text-sm font-medium border-0 p-0 focus:outline-none mb-1" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Standard:</span>
                  <input type="text" inputMode="numeric" value={item.standard || ""}
                    onChange={e => updateItem(idx, "standard", e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="w-16 text-xs text-center border rounded px-1 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <span className="text-xs text-muted-foreground">Stk./Tag</span>
                </div>
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Neue Spalte hinzufügen */}
        <div className="flex gap-2">
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="Neue Spalte (z.B. Krusti)"
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
  const [entries, setEntries] = useState<SemmelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<number | null>(null);
  const [kontingentModal, setKontingentModal] = useState(false);
  const [kontingent, setKontingent] = useState<Kontingent>({
    market_id: selectedMarketId ?? 0,
    semmel_standard: 0,
    freifeld_label: "Sandwich",
    freifeld_standard: 0,
    items: [],
  });

  const marketId = selectedMarketId ?? 0;
  const todayRef = useRef<HTMLTableRowElement | null>(null);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  // Welche Spalten anzeigen?
  const itemConfigs: ItemConfig[] = useMemo(() => {
    if (kontingent.items && kontingent.items.length > 0) return kontingent.items;
    return [
      { label: "Semmel", standard: kontingent.semmel_standard },
      { label: kontingent.freifeld_label || "Sandwich", standard: kontingent.freifeld_standard },
    ];
  }, [kontingent]);

  const fetchKontingent = useCallback(async () => {
    if (!marketId) return;
    const res = await fetch(`${BASE}/semmelliste/kontingent?marketId=${marketId}`);
    const data = await res.json();
    setKontingent(data);
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

  // Einträge nach Tag gruppieren
  const entriesByDay = useMemo(() => {
    const m: Record<number, SemmelEntry[]> = {};
    for (const e of entries) { if (!m[e.day]) m[e.day] = []; m[e.day].push(e); }
    return m;
  }, [entries]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSave = async (day: number, data: { items: Record<string, string>; semmel: string; sandwich: string; kuerzel: string; userId: number | null }) => {
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
  const hasKontingent = itemConfigs.some(ic => ic.standard > 0);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>

        {/* Seitenheader */}
        <PageHeader className="mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/kaesetheke-kontrolle")}
              className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Semmelliste</h1>
              <p className="text-sm text-white/70">Zusätzliches Kontingent Bäckerei – on top zum Standard</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {adminSession && (
                <button onClick={() => setKontingentModal(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors" title="Standardkontingent bearbeiten">
                  <Settings2 className="w-4 h-4" /><span className="hidden sm:inline">Kontingent</span>
                </button>
              )}
            </div>
          </div>
        </PageHeader>

        {/* Monatsnavigation */}
        <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 mb-2 shrink-0">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5" /></button>
          <div className="text-center">
            <div className="font-bold text-lg">{MONTH_NAMES[month - 1]} {year}</div>
            {marketName && <div className="text-xs text-muted-foreground">Markt {marketName}</div>}
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Standardkontingent-Anzeige */}
        {hasKontingent && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 mb-2 shrink-0">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Standard täglich:</span>
            <div className="flex gap-4 flex-1 flex-wrap">
              {itemConfigs.filter(ic => ic.standard > 0).map(ic => (
                <div key={ic.label} className="text-sm">
                  <span className="text-muted-foreground">{ic.label} </span>
                  <span className="font-bold text-primary text-base">{ic.standard}</span>
                  <span className="text-xs text-muted-foreground"> Stk.</span>
                </div>
              ))}
            </div>
            {adminSession && (
              <button onClick={() => setKontingentModal(true)} className="p-1 rounded hover:bg-primary/10 shrink-0">
                <Pencil className="w-3.5 h-3.5 text-primary/60" />
              </button>
            )}
          </div>
        )}
        {!hasKontingent && adminSession && (
          <button onClick={() => setKontingentModal(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-primary/30 rounded-xl px-4 py-2 text-xs text-primary/60 hover:bg-primary/5 mb-2 shrink-0">
            <Settings2 className="w-3.5 h-3.5" />Standardkontingent festlegen
          </button>
        )}

        {/* Tabelle – scrollbar, thead sticky */}
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
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-20">Tag</th>
                    <th className="text-left px-2 py-2.5 text-xs font-semibold text-muted-foreground w-8">Wt</th>
                    {itemConfigs.map(ic => (
                      <th key={ic.label} className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                        {ic.label}
                        <div className="text-[10px] font-normal text-primary/40">on top</div>
                      </th>
                    ))}
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Kürzel</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                    const dayEntries = entriesByDay[day] ?? [];
                    const wt = getWeekday(year, month, day);
                    const future = isFuture(year, month, day);
                    const today = isToday(year, month, day);
                    const weekend = isWeekend(year, month, day);
                    const clickable = !future;
                    const hasEntries = dayEntries.length > 0;
                    const multiEntry = dayEntries.length > 1;

                    return (
                      <tr key={day}
                        ref={today ? todayRef : null}
                        onClick={() => clickable && setModal(day)}
                        className={[
                          "border-b last:border-0 transition-colors align-top",
                          today ? "bg-blue-50/70" : weekend ? "bg-muted/20" : "",
                          clickable ? "cursor-pointer hover:bg-primary/5 active:bg-primary/10" : "opacity-40",
                        ].filter(Boolean).join(" ")}>

                        {/* Tag */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-base">{String(day).padStart(2, "0")}</span>
                            {today && <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HEUTE</span>}
                          </div>
                        </td>

                        {/* Wochentag */}
                        <td className={`px-2 py-2.5 text-xs font-medium ${weekend ? "text-red-500" : "text-muted-foreground"}`}>{wt}</td>

                        {/* Item-Spalten: Summe + Einzeleinträge */}
                        {itemConfigs.map((ic, idx) => {
                          const total = getDayTotal(dayEntries, ic.label, idx);
                          return (
                            <td key={ic.label} className="px-3 py-2 text-center">
                              {total > 0 ? (
                                <div>
                                  <div className="font-mono font-bold text-green-600 text-lg leading-tight">+{total}</div>
                                  {multiEntry && dayEntries.map(e => {
                                    const v = getItemValue(e, ic.label, idx);
                                    return v > 0 ? (
                                      <div key={e.id} className="text-[10px] text-muted-foreground leading-tight flex items-center justify-center gap-0.5">
                                        <span>+{v}</span>
                                        <span className="text-muted-foreground/60">{e.kuerzel}</span>
                                        {e.zeit && <span className="text-muted-foreground/40">{e.zeit}</span>}
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              ) : clickable ? (
                                <span className="text-muted-foreground/30 text-xs">—</span>
                              ) : <span className="text-muted-foreground/20 text-xs">—</span>}
                            </td>
                          );
                        })}

                        {/* Kürzel-Spalte */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            {hasEntries ? (
                              dayEntries.map(e => (
                                <div key={e.id} className="flex items-center gap-1">
                                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">{e.kuerzel}</span>
                                  {e.zeit && <span className="text-[10px] text-muted-foreground/60">{e.zeit}</span>}
                                  {adminSession && (
                                    <button onClick={ev => handleDelete(e.id, ev)}
                                      className="text-muted-foreground hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : clickable ? (
                              <span className="flex items-center gap-0.5 text-[10px] text-primary/40 border border-dashed border-primary/20 rounded px-1.5 py-0.5 w-fit">
                                <Plus className="w-2.5 h-2.5" />Eintragen
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal !== null && (
        <SemmelModal
          day={modal} year={year} month={month}
          existingEntries={entriesByDay[modal] ?? []}
          itemConfigs={itemConfigs}
          onConfirm={data => handleSave(modal, data)}
          onClose={() => setModal(null)}
        />
      )}

      {kontingentModal && marketId > 0 && (
        <KontingentModal
          marketId={marketId} current={kontingent}
          onSave={k => { setKontingent(k); setKontingentModal(false); fetchEntries(); }}
          onClose={() => setKontingentModal(false)}
        />
      )}
    </AppLayout>
  );
}
