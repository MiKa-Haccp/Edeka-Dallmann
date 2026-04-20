import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets, useListResponsibilities, useGetMarketInfo, useUpsertResponsibilities, useUpsertMarketInfo } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Save, Pencil, X, Plus, Trash2, Building2, ChevronLeft, ChevronRight, Calendar, Users, ChevronDown } from "lucide-react";

import { Link } from "wouter";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface EmployeeOption {
  id: number;
  name: string;
  phone: string | null;
  status: string;
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_DEPARTMENTS = [
  "Marktleitung / Betreiber",
  "HACCP- bzw. Hygiene-Beauftragter",
  "Fleisch und Wurst",
  "Molkereiprodukte und Feinkost",
  "(MSC) Fisch",
  "Obst und Gemüse",
  "Backshop",
  "Kühl- und Tiefkühlware",
  "Trockensortiment",
  "Freiverkäufliche Arzneimittel",
];

interface ResponsibilityRow {
  department: string;
  responsibleName: string;
  responsiblePhone: string;
  deputyName: string;
  deputyPhone: string;
  sortOrder: number;
}

export default function Responsibilities() {
  const selectedMarketId = useAppStore((s) => s.selectedMarketId);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const setDate = useAppStore((s) => s.setDate);
  const { data: markets } = useListMarkets();
  const selectedMarket = markets?.find((m) => m.id === selectedMarketId);
  const currentYear = new Date().getFullYear();

  // Beim Mounten immer auf aktuelles Jahr zuruecksetzen
  useEffect(() => {
    const now = new Date();
    setDate(now.getFullYear(), now.getMonth() + 1);
  }, []);

  const { data: responsibilities, refetch: refetchResponsibilities } = useListResponsibilities(
    selectedMarketId || 0,
    { year: selectedYear },
    { query: { enabled: !!selectedMarketId } }
  );

  const { data: prevYearResponsibilities } = useListResponsibilities(
    selectedMarketId || 0,
    { year: selectedYear - 1 },
    { query: { enabled: !!selectedMarketId } }
  );

  const { data: currentYearResponsibilities } = useListResponsibilities(
    selectedMarketId || 0,
    { year: currentYear },
    { query: { enabled: !!selectedMarketId } }
  );

  const { data: marketInfo, refetch: refetchMarketInfo } = useGetMarketInfo(
    selectedMarketId || 0,
    { year: selectedYear },
    { query: { enabled: !!selectedMarketId } }
  );

  const { data: prevYearMarketInfo } = useGetMarketInfo(
    selectedMarketId || 0,
    { year: selectedYear - 1 },
    { query: { enabled: !!selectedMarketId } }
  );

  const upsertResponsibilities = useUpsertResponsibilities();
  const upsertMarketInfo = useUpsertMarketInfo();

  const [isEditing, setIsEditing] = useState(false);
  const [rows, setRows] = useState<ResponsibilityRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [marketNumber, setMarketNumber] = useState("");
  const [street, setStreet] = useState("");
  const [plzOrt, setPlzOrt] = useState("");
  const [prefillSource, setPrefillSource] = useState<"current" | "prevyear" | "empty">("empty");

  useEffect(() => {
    if (responsibilities && responsibilities.length > 0) {
      setRows(
        responsibilities.map((r) => ({
          department: r.department,
          responsibleName: r.responsibleName || "",
          responsiblePhone: r.responsiblePhone || "",
          deputyName: r.deputyName || "",
          deputyPhone: r.deputyPhone || "",
          sortOrder: r.sortOrder,
        }))
      );
      setPrefillSource("current");
    } else if (prevYearResponsibilities && prevYearResponsibilities.length > 0) {
      setRows(
        prevYearResponsibilities.map((r) => ({
          department: r.department,
          responsibleName: r.responsibleName || "",
          responsiblePhone: r.responsiblePhone || "",
          deputyName: r.deputyName || "",
          deputyPhone: r.deputyPhone || "",
          sortOrder: r.sortOrder,
        }))
      );
      setPrefillSource("prevyear");
    } else {
      setRows(
        DEFAULT_DEPARTMENTS.map((dept, idx) => ({
          department: dept,
          responsibleName: "",
          responsiblePhone: "",
          deputyName: "",
          deputyPhone: "",
          sortOrder: idx + 1,
        }))
      );
      setPrefillSource("empty");
    }
  }, [responsibilities, prevYearResponsibilities]);

  useEffect(() => {
    if (marketInfo && (marketInfo.marketNumber || marketInfo.street || marketInfo.plzOrt)) {
      setMarketNumber(marketInfo.marketNumber || "");
      setStreet(marketInfo.street || "");
      setPlzOrt(marketInfo.plzOrt || "");
    } else if (prevYearMarketInfo && (prevYearMarketInfo.marketNumber || prevYearMarketInfo.street || prevYearMarketInfo.plzOrt)) {
      setMarketNumber(prevYearMarketInfo.marketNumber || "");
      setStreet(prevYearMarketInfo.street || "");
      setPlzOrt(prevYearMarketInfo.plzOrt || "");
    } else {
      setMarketNumber("");
      setStreet("");
      setPlzOrt("");
    }
  }, [marketInfo, prevYearMarketInfo]);

  useEffect(() => {
    if (isEditing && employees.length === 0) {
      fetch(`${API_BASE}/users?tenantId=1&status=aktiv`)
        .then((r) => r.json())
        .then((data: EmployeeOption[]) => setEmployees(data))
        .catch(() => {});
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!selectedMarketId) return;

    await upsertResponsibilities.mutateAsync({
      marketId: selectedMarketId,
      data: {
        year: selectedYear,
        items: rows.map((r) => ({
          department: r.department,
          responsibleName: r.responsibleName || null,
          responsiblePhone: r.responsiblePhone || null,
          deputyName: r.deputyName || null,
          deputyPhone: r.deputyPhone || null,
          sortOrder: r.sortOrder,
        })),
      },
    });

    await upsertMarketInfo.mutateAsync({
      marketId: selectedMarketId,
      data: {
        year: selectedYear,
        marketNumber: marketNumber || null,
        street: street || null,
        plzOrt: plzOrt || null,
      },
    });

    await refetchResponsibilities();
    await refetchMarketInfo();
    setIsEditing(false);
  };

  const updateRow = (index: number, field: keyof ResponsibilityRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        department: "",
        responsibleName: "",
        responsiblePhone: "",
        deputyName: "",
        deputyPhone: "",
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  if (!selectedMarketId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Bitte wählen Sie eine Filiale aus.</p>
        </div>
      </AppLayout>
    );
  }

  const reminderYear = (currentYearResponsibilities && currentYearResponsibilities.length > 0)
    ? currentYear
    : null;
  const reminderDate = (currentYearResponsibilities && currentYearResponsibilities.length > 0)
    ? currentYearResponsibilities.reduce((latest, r) =>
        r.updatedAt > latest ? r.updatedAt : latest,
        currentYearResponsibilities[0].updatedAt
      )
    : null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/haccp" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Verantwortlichkeiten</h1>
              <p className="text-sm text-white/70">Zuständigkeiten und Vertretungen je Abteilung</p>
            </div>
          </div>
        </PageHeader>

        {/* Document Header */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          {/* Title Bar - blue like the original */}
          <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] text-white px-6 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">Verantwortlichkeiten im Markt</h1>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Bearbeiten
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      refetchResponsibilities();
                      refetchMarketInfo();
                    }}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={upsertResponsibilities.isPending}
                    className="flex items-center gap-2 bg-white text-[#1a3a6b] hover:bg-white/90 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Speichern
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stand vom / Year */}
          <div className="px-6 py-4 bg-gray-50 border-b border-border/60">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">Stand:</span>
                <span className="font-bold text-xl text-foreground">{selectedYear}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDate(selectedYear - 1, selectedMonth)}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border/40"
                  title="Vorjahr"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a6b]/10 text-[#1a3a6b] text-sm font-bold min-w-[4.5rem] justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedYear}
                </span>
                <button
                  onClick={() => setDate(selectedYear + 1, selectedMonth)}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border/40"
                  title="Nächstes Jahr"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-3xl">
              Die Verantwortlichkeiten müssen für jeden Bereich klar geregelt und schriftlich fixiert werden. 
              Hierzu gehören neben dem Markt insgesamt und den einzelnen Abteilungen auch spezielle Tätigkeitsbereiche 
              wie z.B. Wareneingangskontrolle, Lager- und Temperaturkontrolle oder Bearbeitung von Warenrückrufen.
            </p>
          </div>

          {/* Vorjahr-Hinweis */}
          {prefillSource === "prevyear" && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
              <span className="text-amber-500 text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Vorschau aus {selectedYear - 1} – noch nicht für {selectedYear} gespeichert
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Die Einträge wurden aus dem Vorjahr übernommen. Bitte prüfen, bei Bedarf anpassen und anschließend 
                  <strong> Speichern</strong> klicken, damit die Verantwortlichkeiten für {selectedYear} gültig sind.
                </p>
              </div>
            </div>
          )}

          {/* Market Info */}
          <div className="px-6 py-4 border-b border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-32 flex-shrink-0">Markt</span>
                <div className="flex items-center gap-2 flex-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{selectedMarket?.name || "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-32 flex-shrink-0">Markt-Nummer</span>
                {isEditing ? (
                  <input
                    value={marketNumber}
                    onChange={(e) => setMarketNumber(e.target.value)}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="z.B. 38107"
                  />
                ) : (
                  <span className="text-sm text-foreground">{marketNumber || "—"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-32 flex-shrink-0">Straße</span>
                {isEditing ? (
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="z.B. Dammstraße 28"
                  />
                ) : (
                  <span className="text-sm text-foreground">{street || "—"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-32 flex-shrink-0">PLZ / Ort</span>
                {isEditing ? (
                  <input
                    value={plzOrt}
                    onChange={(e) => setPlzOrt(e.target.value)}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="z.B. 86825 Leeder"
                  />
                ) : (
                  <span className="text-sm text-foreground">{plzOrt || "—"}</span>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold w-[250px]">Bereich / Abteilung</th>
                  <th className="text-center px-2 py-3 text-xs font-medium w-[30px]"></th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">
                    Verantwortlicher (V) /<br />Stellvertretung (S)
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">
                    Telefon privat / Handy<br />(im Notfall)
                  </th>
                  {isEditing && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <RowGroup
                    key={index}
                    row={row}
                    index={index}
                    isEditing={isEditing}
                    updateRow={updateRow}
                    removeRow={removeRow}
                    employees={employees}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {isEditing && (
            <div className="px-6 py-4 border-t border-border/60 bg-gray-50">
              <button
                onClick={addRow}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Bereich hinzufügen
              </button>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}

function EmployeeNameCell({
  name,
  employees,
  onChangeName,
  onChangePhone,
}: {
  name: string;
  phone: string;
  employees: EmployeeOption[];
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
}) {
  const [query, setQuery] = useState(name);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external name changes (e.g. cancel/reset)
  useEffect(() => { setQuery(name); }, [name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If the typed text doesn't match any employee, treat it as a manual name
        onChangeName(query);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query]);

  const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name, "de"));

  const matches = query.trim().length === 0
    ? sorted
    : sorted.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase())
      );

  const aktiveMatches = matches.filter((e) => e.status !== "inaktiv");
  const inaktiveMatches = matches.filter((e) => e.status === "inaktiv");

  const handleSelect = (emp: EmployeeOption) => {
    setQuery(emp.name);
    onChangeName(emp.name);
    if (emp.phone) {
      onChangePhone(emp.phone);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChangeName("");
    onChangePhone("");
  };

  const isFromList = employees.some((e) => e.name === name);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChangeName(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Name suchen oder eingeben..."
          className={cn(
            "w-full border rounded-lg px-2 py-1.5 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 bg-white",
            isFromList ? "border-green-400" : "border-border"
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        )}
      </div>

      {open && matches.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {aktiveMatches.length > 0 && (
            <>
              {aktiveMatches.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(emp); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-[#1a3a6b]/5 transition-colors flex items-center justify-between gap-2",
                    emp.name === name ? "bg-[#1a3a6b]/10 font-semibold" : ""
                  )}
                >
                  <span>{emp.name}</span>
                  {emp.phone && (
                    <span className="text-xs text-muted-foreground shrink-0">{emp.phone}</span>
                  )}
                </button>
              ))}
            </>
          )}
          {inaktiveMatches.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-gray-50 border-t border-border/40">
                Inaktiv
              </div>
              {inaktiveMatches.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(emp); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-muted-foreground flex items-center justify-between gap-2"
                >
                  <span>{emp.name}</span>
                  {emp.phone && (
                    <span className="text-xs shrink-0">{emp.phone}</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
      {open && query.trim().length > 0 && matches.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border/60 rounded-xl shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Kein Mitarbeiter gefunden – freier Text wird gespeichert.
        </div>
      )}
    </div>
  );
}

function RowGroup({
  row,
  index,
  isEditing,
  updateRow,
  removeRow,
  employees,
}: {
  row: ResponsibilityRow;
  index: number;
  isEditing: boolean;
  updateRow: (index: number, field: keyof ResponsibilityRow, value: string) => void;
  removeRow: (index: number) => void;
  employees: EmployeeOption[];
}) {
  const isEven = index % 2 === 0;
  const bgClass = isEven ? "bg-blue-50/40" : "bg-white";

  return (
    <>
      {/* Verantwortlicher (V) row */}
      <tr className={cn("border-b border-border/40", bgClass)}>
        <td rowSpan={2} className={cn("px-4 py-2 text-sm font-medium text-foreground align-top border-r border-border/40", bgClass)}>
          {isEditing ? (
            <input
              value={row.department}
              onChange={(e) => updateRow(index, "department", e.target.value)}
              className="w-full border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          ) : (
            row.department
          )}
        </td>
        <td className="px-2 py-2 text-center text-xs font-bold text-muted-foreground border-r border-border/40">(V)</td>
        <td className="px-4 py-2 border-r border-border/40">
          {isEditing ? (
            <EmployeeNameCell
              name={row.responsibleName}
              phone={row.responsiblePhone}
              employees={employees}
              onChangeName={(v) => updateRow(index, "responsibleName", v)}
              onChangePhone={(v) => updateRow(index, "responsiblePhone", v)}
            />
          ) : (
            <span className="text-sm">{row.responsibleName || "—"}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {isEditing ? (
            <input
              value={row.responsiblePhone}
              onChange={(e) => updateRow(index, "responsiblePhone", e.target.value)}
              className="w-full border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Telefon / Handy..."
            />
          ) : (
            <span className="text-sm">{row.responsiblePhone || "—"}</span>
          )}
        </td>
        {isEditing && (
          <td rowSpan={2} className="px-2 py-2 align-middle">
            <button
              onClick={() => removeRow(index)}
              className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        )}
      </tr>
      {/* Stellvertretung (S) row */}
      <tr className={cn("border-b border-border/60", bgClass)}>
        <td className="px-2 py-2 text-center text-xs font-bold text-muted-foreground border-r border-border/40">(S)</td>
        <td className="px-4 py-2 border-r border-border/40">
          {isEditing ? (
            <EmployeeNameCell
              name={row.deputyName}
              phone={row.deputyPhone}
              employees={employees}
              onChangeName={(v) => updateRow(index, "deputyName", v)}
              onChangePhone={(v) => updateRow(index, "deputyPhone", v)}
            />
          ) : (
            <span className="text-sm">{row.deputyName || "—"}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {isEditing ? (
            <input
              value={row.deputyPhone}
              onChange={(e) => updateRow(index, "deputyPhone", e.target.value)}
              className="w-full border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Telefon / Handy..."
            />
          ) : (
            <span className="text-sm">{row.deputyPhone || "—"}</span>
          )}
        </td>
      </tr>
    </>
  );
}
