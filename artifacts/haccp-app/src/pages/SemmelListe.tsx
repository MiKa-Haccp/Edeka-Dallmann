import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Loader2, Check, X, Lock,
  Printer, ArrowLeft, ShoppingBag, Plus, Pencil, Settings2,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

type SemmelEntry = {
  id: number;
  day: number;
  semmel: string | null;
  sandwich: string | null;
  kuerzel: string;
};

type Kontingent = {
  market_id: number;
  semmel_standard: number;
  freifeld_label: string;
  freifeld_standard: number;
};

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function getWeekday(year: number, month: number, day: number) { return WOCHENTAGE[new Date(year, month-1, day).getDay()]; }
function isWeekend(year: number, month: number, day: number) { const d=new Date(year,month-1,day).getDay(); return d===0||d===6; }
function isFuture(year: number, month: number, day: number) { const n=new Date();n.setHours(0,0,0,0);return new Date(year,month-1,day)>n; }
function isToday(year: number, month: number, day: number) { const n=new Date(); return n.getFullYear()===year&&n.getMonth()+1===month&&n.getDate()===day; }

// ─── PIN-Schritt ──────────────────────────────────────────────────────────────
function PinStep({onVerified,onBack,loading,setLoading}:{
  onVerified:(name:string,userId:number,kuerzel:string)=>void;
  onBack:()=>void; loading:boolean; setLoading:(v:boolean)=>void;
}){
  const [pin,setPin]=useState("");const[error,setError]=useState("");
  const verify=async()=>{
    setError("");setLoading(true);
    try{
      const res=await fetch(`${BASE}/users/verify-pin`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin,tenantId:1})});
      const data=await res.json();
      if(data.valid)onVerified(data.userName,data.userId,data.initials);
      else setError("PIN ungültig.");
    }catch{setError("Verbindungsfehler.");}
    finally{setLoading(false);}
  };
  return(
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2"><Lock className="w-6 h-6 text-primary"/></div>
        <p className="text-sm text-muted-foreground">PIN eingeben zur Bestätigung</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={pin}
        onChange={e=>setPin(e.target.value.replace(/\D/g,""))}
        onKeyDown={e=>e.key==="Enter"&&pin.length>=3&&verify()}
        className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary" autoFocus/>
      {error&&<p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurück</button>
        <button onClick={verify} disabled={pin.length<3||loading}
          className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Bestätigen
        </button>
      </div>
    </div>
  );
}

// ─── Eingabe-Modal ────────────────────────────────────────────────────────────
function SemmelModal({day,year,month,existing,freifelLabel,onConfirm,onClose}:{
  day:number; year:number; month:number;
  existing:SemmelEntry|null;
  freifelLabel:string;
  onConfirm:(data:{semmel:string;sandwich:string;kuerzel:string;userId:number|null})=>void;
  onClose:()=>void;
}){
  const [step,setStep]=useState<"form"|"pin">("form");
  const [semmel,setSemmel]=useState(existing?.semmel??"");
  const [sandwich,setSandwich]=useState(existing?.sandwich??"");
  const [loading,setLoading]=useState(false);
  const [identified,setIdentified]=useState<{name:string;userId:number;kuerzel:string}|null>(null);
  const dayStr=`${String(day).padStart(2,"0")}.${String(month).padStart(2,"0")}.${year}`;

  const handleConfirm=()=>{
    if(!identified)return;
    onConfirm({semmel,sandwich,kuerzel:identified.kuerzel,userId:identified.userId});
  };

  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Semmelliste – {dayStr}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>

        {step==="form"&&(
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Zusätzliche Menge zum Standardkontingent (on top)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Semmel (Stück)</label>
                <input type="text" inputMode="numeric" placeholder="z.B. 20" value={semmel}
                  onChange={e=>setSemmel(e.target.value)} autoFocus
                  className="w-full border rounded-lg px-3 py-2.5 text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{freifelLabel} (Stück)</label>
                <input type="text" inputMode="numeric" placeholder="z.B. 10" value={sandwich}
                  onChange={e=>setSandwich(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button onClick={()=>setStep("pin")}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90">Weiter</button>
            </div>
          </div>
        )}

        {step==="pin"&&!identified&&(
          <PinStep onVerified={(name,userId,kuerzel)=>setIdentified({name,userId,kuerzel})} onBack={()=>setStep("form")} loading={loading} setLoading={setLoading}/>
        )}

        {identified&&(
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto"><Check className="w-6 h-6 text-green-600"/></div>
            <p className="font-medium">{identified.name}</p>
            {semmel&&<p className="text-sm text-muted-foreground">Semmel: <strong>+{semmel}</strong></p>}
            {sandwich&&<p className="text-sm text-muted-foreground">{freifelLabel}: <strong>+{sandwich}</strong></p>}
            {!semmel&&!sandwich&&<p className="text-sm text-muted-foreground italic">Kein Zusatzkontingent</p>}
            <div className="flex gap-2">
              <button onClick={()=>setIdentified(null)} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurück</button>
              <button onClick={handleConfirm} className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700">Speichern</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kontingent-Edit-Modal (nur Admin) ───────────────────────────────────────
function KontingentModal({marketId,current,onSave,onClose}:{
  marketId:number;
  current:Kontingent;
  onSave:(k:Kontingent)=>void;
  onClose:()=>void;
}){
  const [semmelStandard,setSemmelStandard]=useState(String(current.semmel_standard));
  const [freifelLabel,setFreifelLabel]=useState(current.freifeld_label);
  const [freifelStandard,setFreifelStandard]=useState(String(current.freifeld_standard));
  const [saving,setSaving]=useState(false);

  const handleSave=async()=>{
    setSaving(true);
    const res=await fetch(`${BASE}/semmelliste/kontingent`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        marketId,
        semmelStandard:Number(semmelStandard)||0,
        freifelLabel:freifelLabel||"Sandwich",
        freifelStandard:Number(freifelStandard)||0,
      })
    });
    const data=await res.json();
    setSaving(false);
    onSave(data);
  };

  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary"/>
            <h3 className="font-bold text-lg">Standardkontingent</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>
        <p className="text-xs text-muted-foreground">Tägliche Standardbestellung für diesen Markt. Mitarbeiter können pro Tag zusätzliche Mengen (on top) eintragen.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Semmel – Standardmenge (Stück/Tag)</label>
            <input type="text" inputMode="numeric" value={semmelStandard}
              onChange={e=>setSemmelStandard(e.target.value.replace(/\D/g,""))}
              placeholder="z.B. 80"
              className="w-full border rounded-lg px-3 py-2.5 text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div className="border-t pt-4">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Bezeichnung 2. Spalte (Freifeld)</label>
            <input type="text" value={freifelLabel}
              onChange={e=>setFreifelLabel(e.target.value)}
              placeholder="z.B. Sandwich, Laugenbrezel …"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">{freifelLabel||"Freifeld"} – Standardmenge (Stück/Tag)</label>
            <input type="text" inputMode="numeric" value={freifelStandard}
              onChange={e=>setFreifelStandard(e.target.value.replace(/\D/g,""))}
              placeholder="z.B. 30"
              className="w-full border rounded-lg px-3 py-2.5 text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Speichern
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
  const [,navigate] = useLocation();
  const now = new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [entries,setEntries]=useState<SemmelEntry[]>([]);
  const [loading,setLoading]=useState(false);
  const [modal,setModal]=useState<number|null>(null);
  const [kontingentModal,setKontingentModal]=useState(false);
  const [kontingent,setKontingent]=useState<Kontingent>({
    market_id: selectedMarketId??0,
    semmel_standard: 0,
    freifeld_label: "Sandwich",
    freifeld_standard: 0,
  });

  const marketId=selectedMarketId??0;
  const todayRef = useRef<HTMLTableRowElement|null>(null);
  const isCurrentMonth = year===now.getFullYear()&&month===now.getMonth()+1;

  // Kontingent laden
  const fetchKontingent=useCallback(async()=>{
    if(!marketId)return;
    const res=await fetch(`${BASE}/semmelliste/kontingent?marketId=${marketId}`);
    const data=await res.json();
    setKontingent(data);
  },[marketId]);

  const fetchEntries=useCallback(async()=>{
    if(!marketId)return;
    setLoading(true);
    try{
      const res=await fetch(`${BASE}/semmelliste?marketId=${marketId}&year=${year}&month=${month}`);
      const data=await res.json();
      setEntries(Array.isArray(data)?data:[]);
    }catch{setEntries([]);}
    finally{setLoading(false);}
  },[marketId,year,month]);

  useEffect(()=>{fetchKontingent();},[fetchKontingent]);
  useEffect(()=>{fetchEntries();},[fetchEntries]);

  // Auto-scroll zum heutigen Tag
  useEffect(()=>{
    if(isCurrentMonth&&todayRef.current){
      setTimeout(()=>todayRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),200);
    }
  },[isCurrentMonth,loading]);

  const byDay=useMemo(()=>{
    const m:Record<number,SemmelEntry>={};
    for(const e of entries) m[e.day]=e;
    return m;
  },[entries]);

  const prevMonth=()=>{if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const nextMonth=()=>{if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1);};

  const handleSave=async(day:number,data:{semmel:string;sandwich:string;kuerzel:string;userId:number|null})=>{
    await fetch(`${BASE}/semmelliste`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({marketId,year,month,day,semmel:data.semmel||null,sandwich:data.sandwich||null,kuerzel:data.kuerzel,userId:data.userId})});
    setModal(null);fetchEntries();
  };

  const handleDelete=async(id:number)=>{
    await fetch(`${BASE}/semmelliste/${id}`,{method:"DELETE"});
    fetchEntries();
  };

  const days=daysInMonth(year,month);
  const modalEntry=modal?byDay[modal]??null:null;

  const hasKontingent = kontingent.semmel_standard>0||kontingent.freifeld_standard>0;

  return(
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={()=>navigate("/kaesetheke-kontrolle")}
            className="mt-1 p-2 rounded-lg border hover:bg-secondary transition-colors shrink-0" title="Zurück">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <ShoppingBag className="w-5 h-5 text-primary"/>
              <h1 className="text-xl font-bold">3.5 Semmelliste</h1>
            </div>
            <p className="text-xs text-muted-foreground">Zusätzliches Kontingent Bäckerei – Semmel und {kontingent.freifeld_label}</p>
          </div>
          <div className="flex gap-2 mt-1 shrink-0">
            {adminSession&&(
              <button onClick={()=>setKontingentModal(true)}
                className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 hover:bg-secondary"
                title="Standardkontingent bearbeiten">
                <Settings2 className="w-4 h-4"/><span className="hidden sm:inline">Kontingent</span>
              </button>
            )}
            <button onClick={()=>window.print()} className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 hover:bg-secondary">
              <Printer className="w-4 h-4"/><span className="hidden sm:inline">Drucken</span>
            </button>
          </div>
        </div>

        {/* Sticky Monatsnavigation + Kontingent-Box */}
        <div className="sticky top-0 z-10 space-y-2 bg-background pb-2 -mx-1 px-1">
          {/* Monatsnavigation */}
          <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 shadow-sm">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
            <div className="text-center">
              <div className="font-bold text-lg">{MONTH_NAMES[month-1]} {year}</div>
              {marketName&&<div className="text-xs text-muted-foreground">Markt {marketName}</div>}
            </div>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
          </div>

          {/* Standardkontingent-Anzeige */}
          {hasKontingent&&(
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
              <div className="text-xs text-muted-foreground font-medium shrink-0">Standardkontingent täglich:</div>
              <div className="flex gap-4 flex-1">
                {kontingent.semmel_standard>0&&(
                  <div className="text-sm">
                    <span className="text-muted-foreground">Semmel </span>
                    <span className="font-bold text-primary text-base">{kontingent.semmel_standard}</span>
                    <span className="text-xs text-muted-foreground"> Stk.</span>
                  </div>
                )}
                {kontingent.freifeld_standard>0&&(
                  <div className="text-sm">
                    <span className="text-muted-foreground">{kontingent.freifeld_label} </span>
                    <span className="font-bold text-primary text-base">{kontingent.freifeld_standard}</span>
                    <span className="text-xs text-muted-foreground"> Stk.</span>
                  </div>
                )}
              </div>
              {adminSession&&(
                <button onClick={()=>setKontingentModal(true)} className="p-1 rounded hover:bg-primary/10 shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-primary/60"/>
                </button>
              )}
            </div>
          )}

          {/* Wenn kein Kontingent und Admin: Hinweis */}
          {!hasKontingent&&adminSession&&(
            <button onClick={()=>setKontingentModal(true)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-primary/30 rounded-xl px-4 py-2 text-xs text-primary/60 hover:bg-primary/5 transition-colors">
              <Settings2 className="w-3.5 h-3.5"/>Standardkontingent festlegen
            </button>
          )}
        </div>

        {/* Tabelle */}
        {loading?(
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ):!marketId?(
          <div className="text-center py-16 text-muted-foreground">Bitte einen Markt auswählen.</div>
        ):(
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-20">Tag</th>
                  <th className="text-left px-2 py-2.5 text-xs font-semibold text-muted-foreground w-8">WT</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                    Semmel<br/>
                    <span className="font-normal text-[10px] text-primary/50">on top</span>
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                    {kontingent.freifeld_label}<br/>
                    <span className="font-normal text-[10px] text-primary/50">on top</span>
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-24">Kürzel</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({length:days},(_,i)=>i+1).map(day=>{
                  const entry=byDay[day]??null;
                  const wt=getWeekday(year,month,day);
                  const future=isFuture(year,month,day);
                  const today=isToday(year,month,day);
                  const weekend=isWeekend(year,month,day);
                  const clickable=!future;
                  return(
                    <tr key={day}
                      ref={today?todayRef:null}
                      onClick={()=>clickable&&setModal(day)}
                      className={["border-b last:border-0 transition-colors",
                        today?"bg-blue-50/70 ring-2 ring-inset ring-blue-200":weekend?"bg-muted/20":"",
                        clickable?"cursor-pointer hover:bg-primary/5 active:bg-primary/10":"opacity-40",
                      ].filter(Boolean).join(" ")}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-base">{String(day).padStart(2,"0")}</span>
                          {today&&<span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HEUTE</span>}
                        </div>
                      </td>
                      <td className={`px-2 py-3 text-xs font-medium ${weekend?"text-red-500":"text-muted-foreground"}`}>{wt}</td>
                      <td className="px-3 py-3 text-center">
                        {entry?.semmel?(
                          <span className="font-mono font-bold text-green-600 text-lg">+{entry.semmel}</span>
                        ):clickable?(
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        ):<span className="text-muted-foreground/20 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {entry?.sandwich?(
                          <span className="font-mono font-bold text-green-600 text-lg">+{entry.sandwich}</span>
                        ):clickable?(
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        ):<span className="text-muted-foreground/20 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {entry?(
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">{entry.kuerzel}</span>
                          ):(
                            clickable&&<span className="flex items-center gap-0.5 text-[10px] text-primary/40 border border-dashed border-primary/20 rounded px-1.5 py-0.5"><Plus className="w-2.5 h-2.5"/>Eintragen</span>
                          )}
                          {adminSession&&entry&&(
                            <button onClick={e=>{e.stopPropagation();handleDelete(entry.id);}}
                              className="ml-1 text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors">
                              <X className="w-3 h-3"/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {modal!==null&&(
          <SemmelModal day={modal} year={year} month={month} existing={modalEntry}
            freifelLabel={kontingent.freifeld_label}
            onConfirm={data=>handleSave(modal,data)} onClose={()=>setModal(null)}/>
        )}

        {kontingentModal&&marketId>0&&(
          <KontingentModal marketId={marketId} current={kontingent}
            onSave={k=>{setKontingent(k);setKontingentModal(false);}}
            onClose={()=>setKontingentModal(false)}/>
        )}
      </div>
    </AppLayout>
  );
}
