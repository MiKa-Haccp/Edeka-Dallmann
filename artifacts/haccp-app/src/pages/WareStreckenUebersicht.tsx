import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import {
  ChevronLeft, Plus, Pencil, Trash2, X, Save, Loader2, List, Search, CheckSquare, Square,
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
  market_id: number;
  name: string;
  ansprechpartner: string | null;
  telefon: string | null;
  info: string | null;
  kuerzel: string | null;
  mindestbestellwert: number | null;
  wird_bestellt: boolean;
  aussendienst_bestellt: boolean;
  sort_order: number;
}

const EMPTY: Omit<Lieferant, "id" | "market_id"> = {
  name: "",
  ansprechpartner: "",
  telefon: "",
  info: "",
  kuerzel: "",
  mindestbestellwert: null,
  wird_bestellt: false,
  aussendienst_bestellt: false,
  sort_order: 99,
};

function formatEuro(val: number | null) {
  if (val == null) return "–";
  return `€\u00a0${Number(val).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WareStreckenUebersicht({ noLayout }: { noLayout?: boolean } = {}) {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = adminSession?.role === "SUPERADMIN" || adminSession?.role === "ADMIN" || adminSession?.role === "MARKTLEITER" || adminSession?.role === "BEREICHSLEITUNG";

  const [lieferanten, setLieferanten] = useState<Lieferant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState<typeof EMPTY>(EMPTY);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/strecken-lieferanten?marketId=${selectedMarketId}`);
      if (r.ok) setLieferanten(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (l: Lieferant) => {
    setEditId(l.id);
    setEditData({
      name: l.name,
      ansprechpartner: l.ansprechpartner ?? "",
      telefon: l.telefon ?? "",
      info: l.info ?? "",
      kuerzel: l.kuerzel ?? "",
      mindestbestellwert: l.mindestbestellwert ?? null,
      wird_bestellt: l.wird_bestellt,
      aussendienst_bestellt: l.aussendienst_bestellt,
      sort_order: l.sort_order,
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/strecken-lieferanten/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      setEditId(null);
      await load();
    } finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (!addData.name.trim() || !selectedMarketId) return;
    setAdding(true);
    try {
      await fetch(`${BASE}/strecken-lieferanten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: selectedMarketId, ...addData }),
      });
      setShowAdd(false);
      setAddData(EMPTY);
      await load();
    } finally { setAdding(false); }
  };

  const toggleBestellt = async (l: Lieferant) => {
    setLieferanten(prev => prev.map(x => x.id === l.id ? { ...x, wird_bestellt: !x.wird_bestellt } : x));
    await fetch(`${BASE}/strecken-lieferanten/${l.id}/bestellt`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wirdBestellt: !l.wird_bestellt }),
    });
  };

  const toggleAussendienst = async (l: Lieferant) => {
    setLieferanten(prev => prev.map(x => x.id === l.id ? { ...x, aussendienst_bestellt: !x.aussendienst_bestellt } : x));
    await fetch(`${BASE}/strecken-lieferanten/${l.id}/aussendienst`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aussendienstBestellt: !l.aussendienst_bestellt }),
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Lieferant wirklich löschen?")) return;
    await fetch(`${BASE}/strecken-lieferanten/${id}`, { method: "DELETE" });
    await load();
  };

  const filtered = lieferanten.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.ansprechpartner ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (l.info ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const Wrap = noLayout ? NoWrap : AppLayout;

  return (
    <Wrap>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5 pb-10">

        {/* Header – nur im Standalone-Modus */}
        {!noLayout && (
          <PageHeader className="from-[#c73d00] to-[#f94d00]">
            <div className="flex items-center gap-3">
              <Link href="/ware-streckenbestellung" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                <List className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold leading-tight">Übersicht Streckenlieferanten</h1>
                <p className="text-white/70 text-sm">
                  {lieferanten.length > 0 ? `${lieferanten.length} Lieferanten` : "Alle Streckenlieferanten"}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setShowAdd(true); setAddData({ ...EMPTY, sort_order: lieferanten.length + 1 }); }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" /> Neu
                </button>
              )}
            </div>
          </PageHeader>
        )}

        {/* Tab-Modus: kompakte Aktionszeile */}
        {noLayout && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {lieferanten.length > 0 ? `${lieferanten.length} Lieferanten` : "Alle Streckenlieferanten"}
            </p>
            {isAdmin && (
              <button
                onClick={() => { setShowAdd(true); setAddData({ ...EMPTY, sort_order: lieferanten.length + 1 }); }}
                className="flex items-center gap-2 px-3 py-2 bg-[#f94d00] text-white rounded-xl text-sm font-semibold hover:bg-[#f94d00] transition-colors"
              >
                <Plus className="w-4 h-4" /> Neu
              </button>
            )}
          </div>
        )}

        {/* Suche */}
        {lieferanten.length > 5 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Lieferant, Ansprechpartner oder Info suchen …"
              className="w-full pl-9 pr-4 py-2.5 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Kein Markt */}
        {!selectedMarketId && (
          <div className="bg-white rounded-2xl border border-border/60 p-10 text-center text-muted-foreground text-sm">
            Bitte oben einen Markt auswählen.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#f94d00]" />
          </div>
        )}

        {/* Tabelle */}
        {selectedMarketId && !loading && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            {/* Desktop-Tabelle */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[65vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b border-border/60">
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-[15%] bg-gray-50">Name</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-[13%] bg-gray-50">Ansprechpartner</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-[11%] bg-gray-50">Tel.Nr.</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide bg-gray-50">Info</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-[100px] leading-tight bg-gray-50">Mind. Bestell&shy;wert</th>
                    <th className="px-2 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-[62px] text-center leading-tight bg-gray-50">Wir best.</th>
                    <th className="px-2 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-[66px] text-center leading-tight bg-gray-50">AD best.</th>
                    {isAdmin && <th className="px-2 py-2.5 w-[56px] bg-gray-50" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors group">
                      {editId === l.id ? (
                        <>
                          <td className="px-3 py-2">
                            <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                              className="w-full border border-[#f94d00]/40 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 font-semibold" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={editData.ansprechpartner ?? ""} onChange={e => setEditData(p => ({ ...p, ansprechpartner: e.target.value }))}
                              className="w-full border border-border/60 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30" />
                          </td>
                          <td className="px-3 py-2">
                            <textarea value={editData.telefon ?? ""} onChange={e => setEditData(p => ({ ...p, telefon: e.target.value }))}
                              rows={2}
                              className="w-full border border-border/60 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none" />
                          </td>
                          <td className="px-3 py-2">
                            <textarea value={editData.info ?? ""} onChange={e => setEditData(p => ({ ...p, info: e.target.value }))}
                              rows={2}
                              className="w-full border border-border/60 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none" />
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                              <input
                                type="number" min="0" step="0.01"
                                value={editData.mindestbestellwert ?? ""}
                                onChange={e => setEditData(p => ({ ...p, mindestbestellwert: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="–"
                                className="w-full border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30" />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-muted-foreground text-xs">–</td>
                          <td className="px-3 py-2 text-center text-muted-foreground text-xs">–</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={saveEdit} disabled={saving}
                                className="p-1.5 bg-[#f94d00] text-white rounded-lg hover:bg-[#f94d00] disabled:opacity-50">
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => setEditId(null)}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 font-semibold text-foreground text-xs">{l.name}</td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs">{l.ansprechpartner || "–"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-pre-line text-xs">{formatPhone(l.telefon) || "–"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground leading-snug text-xs">{l.info || "–"}</td>
                          <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                            {formatEuro(l.mindestbestellwert)}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <button
                              onClick={() => toggleBestellt(l)}
                              title={l.wird_bestellt ? "Wird von uns bestellt" : "Bestellt selbst / wird nicht von uns bestellt"}
                              className={`transition-colors ${l.wird_bestellt ? "text-green-600 hover:text-green-700" : "text-gray-300 hover:text-gray-400"}`}
                            >
                              {l.wird_bestellt ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <button
                              onClick={() => toggleAussendienst(l)}
                              title={l.aussendienst_bestellt ? "Außendienst bestellt" : "Außendienst bestellt nicht"}
                              className={`transition-colors ${l.aussendienst_bestellt ? "text-blue-600 hover:text-blue-700" : "text-gray-300 hover:text-gray-400"}`}
                            >
                              {l.aussendienst_bestellt ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          {isAdmin && (
                            <td className="px-2 py-2.5">
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(l)}
                                  className="p-1 text-[#f94d00] hover:bg-orange-100 rounded-lg">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(l.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                        {search ? "Kein Lieferant gefunden." : "Noch keine Streckenlieferanten eingetragen."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile-Karten */}
            <div className="md:hidden divide-y divide-border/40">
              {filtered.map(l => (
                <div key={l.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={() => toggleBestellt(l)} title={l.wird_bestellt ? "Wir bestellen" : "Bestellt selbst"}
                        className={`shrink-0 transition-colors ${l.wird_bestellt ? "text-green-600" : "text-gray-300"}`}>
                        {l.wird_bestellt ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                      <button onClick={() => toggleAussendienst(l)} title={l.aussendienst_bestellt ? "Außendienst bestellt" : "Außendienst bestellt nicht"}
                        className={`shrink-0 transition-colors ${l.aussendienst_bestellt ? "text-blue-600" : "text-gray-300"}`}>
                        {l.aussendienst_bestellt ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                      <p className="font-bold text-foreground leading-tight">{l.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {l.kuerzel && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#f94d00]">{l.kuerzel}</span>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => startEdit(l)} className="p-1.5 text-[#f94d00] hover:bg-orange-100 rounded-lg">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {l.ansprechpartner && <p className="text-sm text-muted-foreground">{l.ansprechpartner}</p>}
                  {l.telefon && (
                    <a href={`tel:${l.telefon.split(" ")[0]}`} className="text-sm text-[#f94d00] font-medium">
                      {l.telefon}
                    </a>
                  )}
                  {l.info && <p className="text-sm text-muted-foreground leading-snug">{l.info}</p>}
                  {l.mindestbestellwert != null && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Mindestbestellwert:</span> {formatEuro(l.mindestbestellwert)}
                    </p>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  {search ? "Kein Lieferant gefunden." : "Noch keine Streckenlieferanten eingetragen."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hinzufügen Modal ── */}
        {showAdd && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-base font-bold">Neuer Streckenlieferant</h2>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 pb-5 space-y-3">
                {[
                  { label: "Name *", key: "name", placeholder: "z.B. Hartkorn" },
                  { label: "Ansprechpartner", key: "ansprechpartner", placeholder: "z.B. Stefan Haugg" },
                  { label: "Kürzel", key: "kuerzel", placeholder: "z.B. KW" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</label>
                    <input
                      value={(addData as Record<string, string>)[f.key] ?? ""}
                      onChange={e => setAddData(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      maxLength={f.key === "kuerzel" ? 5 : undefined}
                      className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tel.Nr.</label>
                  <textarea
                    value={addData.telefon ?? ""}
                    onChange={e => setAddData(p => ({ ...p, telefon: e.target.value }))}
                    placeholder={"z.B. 0151/42259352\n0800/1234567"}
                    rows={2}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mindestbestellwert (€)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={addData.mindestbestellwert ?? ""}
                      onChange={e => setAddData(p => ({ ...p, mindestbestellwert: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="z.B. 150"
                      className="w-full border border-border/60 rounded-xl pl-7 pr-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Info</label>
                  <textarea
                    value={addData.info ?? ""}
                    onChange={e => setAddData(p => ({ ...p, info: e.target.value }))}
                    placeholder="z.B. Kommt ca. alle 4 Wochen. Füllt selbst auf."
                    rows={3}
                    className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f94d00]/30 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowAdd(false)}
                    className="px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground">
                    Abbrechen
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!addData.name.trim() || adding}
                    className="flex-1 px-4 py-2.5 bg-[#f94d00] text-white rounded-xl text-sm font-bold hover:bg-[#f94d00] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichern…</> : <><Plus className="w-4 h-4" /> Hinzufügen</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Wrap>
  );
}
