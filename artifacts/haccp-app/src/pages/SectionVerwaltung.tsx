import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { Link, useLocation } from "wouter";
import { useListCategories, useListSections } from "@workspace/api-client-react";
import { ChevronLeft, Eye, EyeOff, Loader2, LayoutList } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

function SectionRow({ section, categoryPrefix, displayIndex, enabled, onToggle, saving }: {
  section: { id: number; number: string; title: string };
  categoryPrefix: number;
  displayIndex: number;
  enabled: boolean;
  onToggle: () => void;
  saving: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-all ${enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${enabled ? "bg-[#1a3a6b]/10 text-[#1a3a6b]" : "bg-gray-200 text-gray-400"}`}>
          {categoryPrefix}.{displayIndex}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate ${enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
            {section.title}
          </div>
          <div className="text-xs text-muted-foreground">
            Original: {section.number}
            {enabled ? "" : " — ausgeblendet"}
          </div>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          enabled
            ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
            : "bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700"
        } disabled:opacity-50`}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : enabled ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
        {enabled ? "Sichtbar" : "Ausgeblendet"}
      </button>
    </div>
  );
}

function CategoryBlock({ category, visibility, onToggle, savingIds }: {
  category: { id: number; label: string };
  visibility: Record<number, boolean>;
  onToggle: (sectionId: number, enabled: boolean) => void;
  savingIds: Set<number>;
}) {
  const { data: sections, isLoading } = useListSections(category.id);

  const visibleSections = sections?.filter(s => !s.number.includes("_") && !s.number.startsWith("hidden")) ?? [];

  let displayIndex = 0;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-[#1a3a6b]/5 flex items-center gap-2">
        <LayoutList className="w-4 h-4 text-[#1a3a6b]"/>
        <span className="font-semibold text-sm text-[#1a3a6b]">{category.label}</span>
        {sections && (
          <span className="ml-auto text-xs text-muted-foreground">
            {visibleSections.filter(s => visibility[s.id] !== false).length} von {visibleSections.length} sichtbar
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        {isLoading && <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/></div>}
        {visibleSections.map(section => {
          const enabled = visibility[section.id] !== false;
          if (enabled) displayIndex++;
          return (
            <SectionRow
              key={section.id}
              section={section}
              categoryPrefix={category.id}
              displayIndex={enabled ? displayIndex : displayIndex + 1}
              enabled={enabled}
              onToggle={() => onToggle(section.id, !enabled)}
              saving={savingIds.has(section.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SectionVerwaltung() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const { data: categories } = useListCategories();
  const [visibility, setVisibility] = useState<Record<number, boolean>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!adminSession || adminSession.role !== "SUPERADMIN") navigate("/");
  }, [adminSession, navigate]);

  useEffect(() => {
    fetch(`${BASE}/section-visibility?tenantId=1`)
      .then(r => r.json())
      .then(d => { if (d.settings) setVisibility(d.settings); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  async function handleToggle(sectionId: number, enabled: boolean) {
    setSavingIds(prev => new Set(prev).add(sectionId));
    try {
      await fetch(`${BASE}/section-visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1, sectionId, enabled }),
      });
      setVisibility(prev => ({ ...prev, [sectionId]: enabled }));
    } catch (e) { console.error(e); }
    finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(sectionId); return n; });
    }
  }

  if (!adminSession || adminSession.role !== "SUPERADMIN") return null;

  const haccpCategories = categories?.filter(c => [1, 2, 3].includes(c.id)) ?? [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/admin/system" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5"/>
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <LayoutList className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Abschnitt-Sichtbarkeit</h1>
              <p className="text-white/70 text-sm">Einzelne Punkte aus der Sidebar ausblenden. Nummerierung passt sich automatisch an.</p>
            </div>
          </div>
        </PageHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>Hinweis:</strong> Ausgeblendete Abschnitte werden in der Sidebar nicht mehr angezeigt.
          Die verbleibenden Punkte werden automatisch neu nummeriert (z.B. 1.10 ausgeblendet → 1.11 wird zu 1.10).
          Die Daten bleiben unverändert.
        </div>

        {!loaded ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
        ) : (
          <div className="space-y-4">
            {haccpCategories.map(cat => (
              <CategoryBlock
                key={cat.id}
                category={cat}
                visibility={visibility}
                onToggle={handleToggle}
                savingIds={savingIds}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
