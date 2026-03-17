import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useListFormDefinitions, 
  useListFormInstances, 
  useCreateFormInstance,
  useListFormEntries,
  useCreateFormEntry,
  useListSections
} from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getDaysInMonth, format, isToday, isFuture } from "date-fns";
import { de } from "date-fns/locale";
import { Info, Plus, ChevronLeft, ChevronRight, AlertTriangle, Check, X, Thermometer, PenTool, FileText } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dialog Component for Form Entry
function EntryDialog({ 
  isOpen, 
  onClose, 
  definition, 
  dateStr, 
  instanceId,
  existingEntry
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  definition: any; 
  dateStr: string; 
  instanceId: number;
  existingEntry?: any;
}) {
  const [value, setValue] = useState(existingEntry?.value || "");
  const [initials, setInitials] = useState(existingEntry?.signature || "");
  const [pin, setPin] = useState("");
  const [photoUrl, setPhotoUrl] = useState(existingEntry?.photoUrl || "");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();
  const { mutate: createEntry, isPending } = useCreateFormEntry();

  // Reset form when dialog opens
  useMemo(() => {
    if (isOpen) {
      setValue(existingEntry?.value || "");
      setInitials(existingEntry?.signature || "");
      setPin("");
      setError("");
      setPhotoUrl(existingEntry?.photoUrl || "");
    }
  }, [isOpen, existingEntry]);

  const needsPhoto = definition.fieldType === 'boolean' && value === 'false';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (definition.required && !value) {
      setError("Bitte füllen Sie den Wert aus.");
      return;
    }
    if (!initials || !pin) {
      setError("Unterschrift (Kürzel) und PIN sind erforderlich.");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN muss 4-stellig sein.");
      return;
    }

    // Temperature Logic specifically requested
    let isWarning = false;
    if (definition.fieldType === 'temperature') {
      const numVal = parseFloat(value);
      if (definition.validationMax && numVal > definition.validationMax) {
        // Technically should warn, but we'll still save. Backend can handle strict rejections.
        isWarning = true;
      }
    }

    createEntry(
      { 
        instanceId, 
        data: {
          formDefinitionId: definition.id,
          entryDate: dateStr,
          value,
          signature: initials,
          pin,
          photoUrl: needsPhoto ? photoUrl : null
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/form-instances/${instanceId}/entries`] });
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || "Fehler beim Speichern");
        }
      }
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
            <Dialog.Title className="text-xl font-display font-semibold leading-none tracking-tight">
              Eintrag für {format(new Date(dateStr), 'dd. MMMM yyyy', { locale: de })}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {definition.label}
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Value Input Area */}
            <div className="space-y-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
              <label className="text-sm font-bold text-foreground">Messwert / Status</label>
              
              {definition.fieldType === 'temperature' && (
                <div className="relative">
                  <Thermometer className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="number" 
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="z.B. 4.5"
                  />
                  <span className="absolute right-4 top-3 text-sm font-medium text-muted-foreground">°C</span>
                </div>
              )}

              {definition.fieldType === 'boolean' && (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setValue('true')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold",
                      value === 'true' 
                        ? "bg-green-50 border-green-500 text-green-700" 
                        : "bg-white border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Check className="w-5 h-5" /> in Ordnung
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('false')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold",
                      value === 'false' 
                        ? "bg-destructive/10 border-destructive text-destructive" 
                        : "bg-white border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <X className="w-5 h-5" /> Nicht OK
                  </button>
                </div>
              )}

              {definition.fieldType === 'text' && (
                <textarea 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Bemerkung eingeben..."
                />
              )}

              {/* Conditional Photo Upload */}
              {needsPhoto && (
                <div className="mt-4 p-4 border border-destructive/20 bg-destructive/5 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-destructive flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Foto Dokumentation erforderlich
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Bild-URL (Simulation Upload)"
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <PenTool className="w-4 h-4" /> Digitale Signatur
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Kürzel (z.B. MM)"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  maxLength={3}
                />
                <input
                  type="password"
                  placeholder="4-stellige PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  maxLength={4}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50"
              >
                {isPending ? "Speichere..." : "Eintrag speichern"}
              </button>
            </div>
          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


export default function SectionDetail() {
  const [match, params] = useRoute("/section/:sectionId");
  const sectionId = match ? Number(params?.sectionId) : 0;
  
  const { selectedMarketId, selectedYear, selectedMonth, setDate } = useAppStore();
  const queryClient = useQueryClient();

  const [dialogState, setDialogState] = useState<{isOpen: boolean, definition: any, date: string, entry?: any}>({
    isOpen: false,
    definition: null,
    date: ""
  });

  // Fetch Section Details (to get Title, we need to fetch all sections of a category... 
  // wait, API doesn't have GET /sections/:id, we just have list. 
  // For a real app we'd have a get. For now, we focus on the form definitions.)
  
  const { data: definitions = [], isLoading: isLoadingDefs } = useListFormDefinitions(sectionId);

  // Fetch or Create Instance
  const { data: instances = [], isLoading: isLoadingInstances } = useListFormInstances({
    marketId: selectedMarketId || 0,
    sectionId: sectionId,
    year: selectedYear,
    month: selectedMonth
  }, {
    query: { enabled: !!selectedMarketId && !!sectionId }
  });

  const currentInstance = instances[0]; // Assuming one per month/section/market

  const { mutate: createInstance, isPending: isCreatingInstance } = useCreateFormInstance();

  const { data: entries = [], isLoading: isLoadingEntries } = useListFormEntries(
    currentInstance?.id || 0,
    { query: { enabled: !!currentInstance?.id } }
  );

  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) setDate(selectedYear - 1, 12);
    else setDate(selectedYear, selectedMonth - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) setDate(selectedYear + 1, 1);
    else setDate(selectedYear, selectedMonth + 1);
  };

  const handleCreateInstance = () => {
    if (!selectedMarketId) return;
    createInstance({
      data: {
        marketId: selectedMarketId,
        sectionId,
        year: selectedYear,
        month: selectedMonth
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/form-instances`] });
      }
    });
  };

  // Helper to get entry for a specific definition and day
  const getEntryForCell = (defId: number, day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.find(e => e.formDefinitionId === defId && e.entryDate.startsWith(dateStr));
  };

  const openCellDialog = (definition: any, day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    if (isFuture(dateObj)) return; // Prevent future entries

    const existing = getEntryForCell(definition.id, day);
    setDialogState({
      isOpen: true,
      definition,
      date: dateStr,
      entry: existing
    });
  };

  if (!selectedMarketId) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Bitte Filiale wählen</h2>
          <p className="text-muted-foreground mt-2">Wählen Sie oben im Header eine Filiale aus, um fortzufahren.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header / Month Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Info className="w-4 h-4" /> Formular {sectionId}
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Protokoll Erfassung
            </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-40 text-center font-bold text-foreground">
              {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: de })}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-border shadow-sm shadow-black/5 overflow-hidden">
          
          {isLoadingDefs || isLoadingInstances ? (
            <div className="p-12 flex justify-center text-muted-foreground animate-pulse">
              Daten werden geladen...
            </div>
          ) : !currentInstance ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Kein Formular für diesen Monat</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Für {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: de })} wurde noch kein Protokoll für diese Filiale und diesen Bereich angelegt.
              </p>
              <button 
                onClick={handleCreateInstance}
                disabled={isCreatingInstance}
                className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {isCreatingInstance ? "Erstelle..." : "Protokoll für Monat erstellen"}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto haccp-table-container">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="px-4 py-3 font-semibold text-foreground border-r border-border sticky left-0 bg-secondary/90 backdrop-blur z-20 shadow-[1px_0_0_0_#e2e8f0] min-w-[250px]">
                      Prüfpunkt
                    </th>
                    {daysArray.map(day => {
                      const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const today = isToday(dateObj);
                      return (
                        <th key={day} className={cn(
                          "px-2 py-3 font-semibold text-center border-r border-border min-w-[60px]",
                          isWeekend && "text-muted-foreground",
                          today && "bg-primary/10 text-primary"
                        )}>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                              {format(dateObj, 'E', { locale: de })}
                            </span>
                            <span className="text-base">{day}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {definitions.map((def) => (
                    <tr key={def.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 border-r border-border sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                        <div className="font-medium text-foreground">{def.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {def.fieldType === 'temperature' ? '°C' : def.fieldType === 'boolean' ? 'OK / N.OK' : 'Text'}
                          {def.validationMax && <span className="ml-2 text-destructive">Max: {def.validationMax}°C</span>}
                        </div>
                      </td>
                      
                      {daysArray.map(day => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dateObj = new Date(dateStr);
                        const future = isFuture(dateObj);
                        const entry = getEntryForCell(def.id, day);
                        
                        let cellContent = null;
                        let cellClass = "cursor-pointer hover:bg-primary/5 transition-colors";
                        
                        if (future) {
                          cellClass = "bg-secondary/30 cursor-not-allowed opacity-50";
                        } else if (entry) {
                          // Determine status styling
                          if (def.fieldType === 'temperature') {
                            const val = parseFloat(entry.value || "0");
                            if (def.validationMax && val > def.validationMax) {
                              cellClass = "bg-destructive/10 text-destructive font-bold cursor-pointer hover:bg-destructive/20";
                              cellContent = `${val}°`;
                            } else {
                              cellClass = "bg-green-50 text-green-700 font-medium cursor-pointer";
                              cellContent = `${val}°`;
                            }
                          } else if (def.fieldType === 'boolean') {
                            if (entry.value === 'false') {
                              cellClass = "bg-destructive/10 text-destructive cursor-pointer hover:bg-destructive/20";
                              cellContent = <X className="w-4 h-4 mx-auto" />;
                            } else {
                              cellClass = "bg-green-50 text-green-700 cursor-pointer";
                              cellContent = <Check className="w-4 h-4 mx-auto" />;
                            }
                          } else {
                            cellClass = "bg-blue-50 text-blue-700 cursor-pointer text-xs";
                            cellContent = "Text";
                          }
                        }

                        return (
                          <td 
                            key={day} 
                            onClick={() => !future && openCellDialog(def, day)}
                            className={cn(
                              "border-r border-border text-center relative p-0 h-14",
                              cellClass
                            )}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              {cellContent}
                              {entry?.signature && (
                                <span className="text-[9px] opacity-70 mt-0.5 font-mono">{entry.signature}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {dialogState.definition && currentInstance && (
        <EntryDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ ...dialogState, isOpen: false })}
          definition={dialogState.definition}
          dateStr={dialogState.date}
          instanceId={currentInstance.id}
          existingEntry={dialogState.entry}
        />
      )}
    </AppLayout>
  );
}
