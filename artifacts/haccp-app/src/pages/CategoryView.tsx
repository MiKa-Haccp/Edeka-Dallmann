import { AppLayout } from "@/components/layout/AppLayout";
import { useListSections, useListCategories } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { FileText, ArrowRight, ChevronLeft, ShieldCheck, ShoppingCart, Beef } from "lucide-react";

const CATEGORY_META: Record<number, { label: string; icon: React.ElementType; color: string; bgColor: string; nummer: string }> = {
  1: { label: "Allgemein", icon: ShieldCheck,    color: "text-[#1a3a6b]",  bgColor: "bg-[#1a3a6b]/10", nummer: "HACCP 1" },
  2: { label: "Markt",     icon: ShoppingCart,   color: "text-emerald-700", bgColor: "bg-emerald-50",   nummer: "HACCP 2" },
  3: { label: "Metzgerei", icon: Beef,            color: "text-red-700",    bgColor: "bg-red-50",       nummer: "HACCP 3" },
};

const SECTION_HREFS: Record<string, string> = {
  "1.1": "/responsibilities",
  "1.2": "/mitarbeiter-liste",
  "1.3": "/info-documentation",
  "1.4": "/training-records",
  "1.5": "/annual-cleaning-plan",
  "1.6": "/betriebsbegehung",
  "1.7": "/hinweisschild-gesperrte-ware",
  "1.8": "/produktfehlermeldung",
  "1.9": "/probeentnahme",
  "1.10": "/anti-vektor-zugang",
  "1.11": "/bescheinigungen",
  "1.12": "/kontrollberichte",
  "2.1": "/warencheck-og",
  "2.2": "/reinigung-taeglich",
  "2.3": "/carrier-portal",
  "2.5": "/wareneingaenge",
  "3.1": "/metzgerei-wareneingaenge",
  "3.2": "/reinigungsplan-metzgerei",
  "3.3": "/oeffnung-salate",
  "3.4": "/kaesetheke-kontrolle",
  "3.5": "/semmelliste",
  "3.6": "/eingefrorenes-fleisch",
  "3.7": "/rezepturen",
  "3.8": "/gq-begehung",
  "3.9": "/abteilungsfremde-personen",
};

export default function CategoryView() {
  const [match, params] = useRoute("/category/:categoryId");
  const categoryId = match ? Number(params?.categoryId) : 0;

  const { data: categories } = useListCategories();
  const { data: sections, isLoading } = useListSections(categoryId);

  const category = categories?.find(c => c.id === categoryId);
  const meta = CATEGORY_META[categoryId];
  const Icon = meta?.icon ?? ShieldCheck;

  const visible = sections?.filter(s => {
    if (s.number.includes("_")) return false;
    if (s.number.startsWith("hidden")) return false;
    const m = s.number.match(/^3\.(\d+)$/);
    if (m && parseInt(m[1]) >= 10) return false;
    return true;
  }) ?? [];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/haccp" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className={`w-10 h-10 rounded-xl ${meta?.bgColor ?? "bg-primary/10"} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${meta?.color ?? "text-primary"}`} />
          </div>
          <div>
            <div className={`text-xs font-bold uppercase tracking-wide ${meta?.color ?? "text-primary"}`}>
              {meta?.nummer ?? "HACCP"} · {category?.label ?? ""}
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{meta?.label ?? category?.label ?? "Lade..."}</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-gray-50/60 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Formulare & Protokolle</h2>
            <span className="text-xs text-gray-400">{visible.length} Einträge</span>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Lade Formulare...</div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Keine Formulare in dieser Kategorie.</div>
            ) : (
              visible.map((section) => {
                const href = SECTION_HREFS[section.number] ?? `/section/${section.id}`;
                return (
                  <Link
                    key={section.id}
                    href={href}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg ${meta?.bgColor ?? "bg-primary/10"} flex items-center justify-center flex-shrink-0`}>
                        <FileText className={`w-4 h-4 ${meta?.color ?? "text-primary"}`} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium">{section.number}</span>
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 leading-tight">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
