import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  ShoppingBag, Phone, User, Info, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Loader2, Trash2, X, KeyRound,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface Lieferant {
  id: number;
  name: string;
  ansprechpartner: string | null;
  telefon: string | null;
  info: string | null;
  kuerzel: string | null;
  wird_bestellt: boolean;
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
  onConfirm,
  onClose,
}: {
  lieferant: Lieferant;
  onConfirm: (kuerzel: string, notiz: string) => Promise<void>;
  onClose: () => void;
}) {
  const [kuerzel, setKuerzel] = useState("");
  const [notiz, setNotiz] = useState("");
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
            <h2 className="text-lg font-bold text-foreground">Bestellung bestätigen</h2>
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
              className="w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Notiz (optional)
            </label>
            <textarea
              value={notiz}
              onChange={e => setNotiz(e.target.value)}
              placeholder="z.B. Sonderbestellung, Menge geändert …"
              rows={2}
              className="w-full border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 resize-none"
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-semibold hover:bg-[#2d5aa0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Bestätigen
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
  onDeleteBestellung,
  isAdmin,
}: {
  lieferant: Lieferant;
  bestellungen: Bestellung[];
  onBestellen: (l: Lieferant) => void;
  onDeleteBestellung: (id: number) => void;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const last = bestellungen[0];
  const recent = bestellungen.slice(0, expanded ? 10 : 3);

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-base">{lieferant.name}</h3>
            {lieferant.kuerzel && (
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lieferant.kuerzel}</span>
            )}
          </div>
          {last && (
            <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Zuletzt: {new Date(last.bestellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })} – {last.mitarbeiter_kuerzel}
            </p>
          )}
        </div>
        <button
          onClick={() => onBestellen(lieferant)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#1a3a6b] text-white rounded-xl text-xs font-bold hover:bg-[#2d5aa0] transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Bestellen
        </button>
      </div>

      {/* Info-Bereich */}
      {(lieferant.ansprechpartner || lieferant.telefon || lieferant.info) && (
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
                <a href={`tel:${lieferant.telefon}`} className="text-[#1a3a6b] font-medium hover:underline text-sm">{lieferant.telefon}</a>
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
        </div>
      )}

      {/* Verlauf */}
      <div className="px-5 py-3">
        {bestellungen.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-2">Noch keine Bestellungen erfasst</p>
        ) : (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Bestellverlauf
            </p>
            <div className="space-y-1.5">
              {recent.map(b => (
                <div key={b.id} className="flex items-start justify-between gap-2 text-sm group">
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground">{b.mitarbeiter_kuerzel}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{formatDate(b.bestellt_am)}</span>
                    {b.notiz && <p className="text-xs text-muted-foreground mt-0.5 truncate">↳ {b.notiz}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => onDeleteBestellung(b.id)}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {bestellungen.length > 3 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-2 flex items-center gap-1 text-xs text-[#1a3a6b] font-medium hover:underline"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" /> Weniger anzeigen</> : <><ChevronDown className="w-3 h-3" /> Alle {bestellungen.length} anzeigen</>}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WareStreckenBestellung({ noLayout }: { noLayout?: boolean } = {}) {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const [lieferanten, setLieferanten] = useState<Lieferant[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogLieferant, setDialogLieferant] = useState<Lieferant | null>(null);

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

  const getBestellungenForLieferant = (lieferantId: number) =>
    bestellungen.filter(b => b.lieferant_id === lieferantId);

  const Wrap = noLayout
    ? ({ children }: { children: ReactNode }) => <>{children}</>
    : ({ children }: { children: ReactNode }) => <AppLayout>{children}</AppLayout>;

  if (!selectedMarketId) {
    return (
      <Wrap>
        <div className="p-10 text-center text-muted-foreground text-sm">Bitte Markt auswählen.</div>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : lieferanten.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Noch keine Streckenlieferanten angelegt.
          </div>
        ) : (
          lieferanten.map(l => (
            <LieferantCard
              key={l.id}
              lieferant={l}
              bestellungen={getBestellungenForLieferant(l.id)}
              onBestellen={setDialogLieferant}
              onDeleteBestellung={handleDeleteBestellung}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {dialogLieferant && (
        <BestellDialog
          lieferant={dialogLieferant}
          onConfirm={handleBestellen}
          onClose={() => setDialogLieferant(null)}
        />
      )}
    </Wrap>
  );
}
