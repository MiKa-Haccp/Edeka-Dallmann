import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ChevronLeft, ChevronRight, Loader2, Check, X, Lock,
  Thermometer, AlertCircle, CircleCheck, CircleMinus, Pencil,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getWeekday(y: number, m: number, d: number) { return new Date(y, m-1, d).getDay(); }
function getWeekdayLabel(y: number, m: number, d: number) { return WOCHENTAGE[getWeekday(y,m,d)]; }
function isSunday(y: number, m: number, d: number) { return getWeekday(y,m,d) === 0; }
function isSaturday(y: number, m: number, d: number) { return getWeekday(y,m,d) === 6; }
function isFuture(y: number, m: number, d: number) { const n=new Date(); n.setHours(0,0,0,0); return new Date(y,m-1,d)>n; }
function isToday(y: number, m: number, d: number) { const n=new Date(); return n.getFullYear()===y&&n.getMonth()+1===m&&n.getDate()===d; }

type Entry = { id:number; day:number; temp_ok:boolean|null; referenz_temp:string|null; kuerzel:string|null; };
type EntryMap = Record<number, Entry>;

function PinStep({ onVerified, onBack, loading, setLoading }: {
  onVerified:(name:string,userId:number,kuerzel:string)=>void;
  onBack:()=>void; loading:boolean; setLoading:(v:boolean)=>void;
}) {
  const [pin,setPin]=useState(""); const [error,setError]=useState("");
  const verify=async()=>{
    setError(""); setLoading(true);
    try {
      const res=await fetch(`${BASE}/users/verify-pin`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin,tenantId:1})});
      const data=await res.json();
      if(data.valid) onVerified(data.userName,data.userId,data.initials);
      else setError("PIN ungültig.");
    } catch { setError("Verbindungsfehler."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6 text-primary"/>
        </div>
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

type ModalMode = "daily" | "referenz";
type DayModal = { mode: ModalMode; day: number; tempOk: boolean|null; referenzTemp: string; };

export default function TempLagerKontrolle() {
  const { selectedMarketId, adminSession } = useAppStore();
  const { data: markets } = useListMarkets();
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [entries,setEntries]=useState<EntryMap>({});
  const [loading,setLoading]=useState(false);
  const [modal,setModal]=useState<DayModal|null>(null);
  const [modalStep,setModalStep]=useState<"form"|"pin">("form");
  const [saving,setSaving]=useState(false);
  const todayRef = useRef<HTMLTableRowElement>(null);

  const market=markets?.find((m:any)=>m.id===selectedMarketId);
  const days=daysInMonth(year,month);
  const isCurrentMonth = now.getFullYear()===year && now.getMonth()+1===month;

  const load=useCallback(async()=>{
    if(!selectedMarketId) return;
    setLoading(true);
    try {
      const r=await fetch(`${BASE}/temp-lager-kontrolle?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      const data:Entry[]=await r.json();
      const map:EntryMap={};
      for(const e of data) map[e.day]=e;
      setEntries(map);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  },[selectedMarketId,year,month]);

  useEffect(()=>{load();},[load]);

  // Scroll to today
  useEffect(()=>{
    if(!loading && isCurrentMonth) {
      setTimeout(()=>todayRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),200);
    }
  },[loading,isCurrentMonth]);

  function prevMonth(){if(month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1);}
  function nextMonth(){if(month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1);}

  function openDayModal(day:number){
    const e=entries[day];
    setModal({mode:"daily",day,tempOk:e?.temp_ok??null,referenzTemp:""});
    setModalStep("form");
  }

  function openReferenzModal(){
    const e=entries[0];
    setModal({mode:"referenz",day:0,tempOk:null,referenzTemp:e?.referenz_temp||""});
    setModalStep("form");
  }

  async function saveEntry(kuerzel:string,userId:number){
    if(!modal||!selectedMarketId) return;
    setSaving(true);
    try {
      if(modal.mode==="daily"){
        await fetch(`${BASE}/temp-lager-kontrolle`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({marketId:selectedMarketId,year,month,day:modal.day,
            tempOk:modal.tempOk,referenzTemp:null,kuerzel,userId})
        });
      } else {
        await fetch(`${BASE}/temp-lager-kontrolle`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({marketId:selectedMarketId,year,month,day:0,
            tempOk:null,referenzTemp:modal.referenzTemp||null,kuerzel,userId})
        });
      }
      await load();
      setModal(null);
    } catch(e){console.error(e);}
    finally{setSaving(false);}
  }

  // Traffic-light calculation
  const ampel = (() => {
    let total=0, filled=0, bad=0;
    for(let d=1;d<=days;d++){
      if(isSunday(year,month,d)||isFuture(year,month,d)) continue;
      total++;
      const e=entries[d];
      if(e?.temp_ok===false) bad++;
      if(e?.temp_ok!=null) filled++;
    }
    if(bad>0) return {color:"red",label:"Abweichung festgestellt",icon:<AlertCircle className="w-4 h-4"/>};
    if(filled===total&&total>0) return {color:"green",label:"Alle Einträge vollständig",icon:<CircleCheck className="w-4 h-4"/>};
    if(filled===0) return {color:"none",label:`0 / ${total} Tage eingetragen`,icon:<CircleMinus className="w-4 h-4"/>};
    return {color:"yellow",label:`${filled} / ${total} Tage eingetragen`,icon:<CircleMinus className="w-4 h-4"/>};
  })();

  const referenzEntry = entries[0];

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5"/>
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Thermometer className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">1.13 Temperatur-Lagerkontrolle</h1>
              <p className="text-white/70 text-sm">Formblatt 6.3</p>
            </div>
          </div>
        </PageHeader>

        <div className="flex-1 overflow-auto p-4 space-y-4">

          {/* Info-Box mit Überschrift aus dem Formblatt */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-bold text-blue-900 border-b border-blue-300 pb-2 mb-2">
              Tägliche Kontrolle der automatisch gemessenen und dokumentierten Temperaturen:
            </p>
            <p className="text-xs text-blue-700">
              Markt: <strong>{market?.name ?? "—"}</strong>
            </p>
          </div>

          {/* Ampel-Status */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
            ampel.color==="green"?"bg-green-50 border-green-200 text-green-800":
            ampel.color==="yellow"?"bg-amber-50 border-amber-200 text-amber-800":
            ampel.color==="red"?"bg-red-50 border-red-200 text-red-800":
            "bg-gray-50 border-gray-200 text-gray-600"}`}>
            <span className={ampel.color==="green"?"text-green-600":ampel.color==="yellow"?"text-amber-600":ampel.color==="red"?"text-red-600":"text-gray-400"}>
              {ampel.icon}
            </span>
            <span className="text-sm font-medium">{ampel.label}</span>
          </div>

          {/* Monatsnavigation */}
          <div className="flex items-center justify-between bg-white rounded-xl border shadow-sm p-3">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
            <div className="text-center">
              <div className="font-semibold text-lg">{MONTH_NAMES[month-1]} {year}</div>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
          </div>

          {/* Monatliche Referenzmessung */}
          <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Referenzmessung (einmal im Monat)</div>
              {referenzEntry?.referenz_temp
                ? <div className="text-sm text-muted-foreground mt-0.5">Gemessen: <span className="font-mono font-semibold text-foreground">{referenzEntry.referenz_temp}°C</span> · Kürzel: {referenzEntry.kuerzel}</div>
                : <div className="text-sm text-amber-600 mt-0.5">Noch nicht eingetragen</div>}
            </div>
            <button onClick={openReferenzModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-all whitespace-nowrap">
              <Pencil className="w-3.5 h-3.5"/>
              {referenzEntry?.referenz_temp ? "Bearbeiten" : "Eintragen"}
            </button>
          </div>

          {/* Tages-Tabelle */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a3a6b] text-white">
                    <th className="py-2 px-3 text-left font-medium w-20">Tag</th>
                    <th className="py-2 px-3 text-center font-medium">Aufgez. Temp. i.O.</th>
                    <th className="py-2 px-3 text-center font-medium w-20">Kürzel</th>
                    <th className="py-2 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length:days},(_,i)=>i+1)
                    .filter(day=>!isSunday(year,month,day))
                    .map(day=>{
                      const e=entries[day];
                      const future=isFuture(year,month,day);
                      const today=isToday(year,month,day);
                      const saturday=isSaturday(year,month,day);
                      const wd=getWeekdayLabel(year,month,day);
                      const missing=!future&&e?.temp_ok==null;

                      return (
                        <tr key={day}
                          ref={today?todayRef:null}
                          onClick={()=>!future&&openDayModal(day)}
                          className={[
                            "border-b transition-colors",
                            future?"opacity-35 cursor-not-allowed":"cursor-pointer hover:bg-blue-50",
                            today?"bg-blue-50":"",
                            saturday&&!today?"bg-gray-50/60":"",
                          ].join(" ")}>
                          <td className="py-2.5 px-3 text-left">
                            <span className={`font-medium ${today?"text-[#1a3a6b]":""}`}>{day}</span>
                            <span className="text-muted-foreground ml-1.5 text-xs">{wd}</span>
                            {today&&<span className="ml-1 text-xs text-blue-600 font-medium">(heute)</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {e?.temp_ok===true&&(
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700">
                                <Check className="w-4 h-4"/>
                              </span>
                            )}
                            {e?.temp_ok===false&&(
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700">
                                <X className="w-4 h-4"/>
                              </span>
                            )}
                            {missing&&(
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${today?"bg-amber-100 text-amber-700":"text-gray-300"}`}>
                                {today?"Ausstehend":"—"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
                            {e?.kuerzel||""}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {!future&&(
                              <Pencil className={`w-3.5 h-3.5 ${missing&&today?"text-amber-400":"text-gray-200 group-hover:text-gray-400"}`}/>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legende */}
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><Check className="w-3 h-3"/></span>
              Temperaturen i.O.
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center"><X className="w-3 h-3"/></span>
              Abweichung
            </div>
            <div className="flex items-center gap-1 ml-auto text-gray-400">Sonntage ausgeblendet</div>
          </div>
        </div>

        {/* Modal */}
        {modal&&(
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
              <div className="p-4 border-b">
                <div className="font-semibold">
                  {modal.mode==="daily"
                    ? `${modal.day}. ${MONTH_NAMES[month-1]} ${year}`
                    : `Referenzmessung — ${MONTH_NAMES[month-1]} ${year}`}
                </div>
                <div className="text-xs text-muted-foreground">Temperatur-Lagerkontrolle</div>
              </div>
              <div className="p-4">
                {modalStep==="form"&&(
                  <div className="space-y-4">

                    {/* Tages-Eingabe */}
                    {modal.mode==="daily"&&(
                      <div>
                        <label className="text-sm font-medium block mb-2">Aufgezeichnete Temperaturen i.O.?</label>
                        <div className="flex gap-3">
                          <button onClick={()=>setModal(m=>m?{...m,tempOk:true}:m)}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all
                              ${modal.tempOk===true?"border-green-500 bg-green-50 text-green-700":"border-gray-200 hover:border-green-300"}`}>
                            <Check className="w-5 h-5"/>Ja, i.O.
                          </button>
                          <button onClick={()=>setModal(m=>m?{...m,tempOk:false}:m)}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all
                              ${modal.tempOk===false?"border-red-500 bg-red-50 text-red-700":"border-gray-200 hover:border-red-300"}`}>
                            <X className="w-5 h-5"/>Nein
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Referenzmessung-Eingabe */}
                    {modal.mode==="referenz"&&(
                      <div>
                        <label className="text-sm font-medium block mb-1">Referenzmessung (°C)</label>
                        <p className="text-xs text-muted-foreground mb-2">Einmal pro Monat mit geeichtem Thermometer messen.</p>
                        <div className="relative">
                          <input type="text" inputMode="decimal" placeholder="z.B. 2.5"
                            value={modal.referenzTemp}
                            onChange={e=>setModal(m=>m?{...m,referenzTemp:e.target.value}:m)}
                            className="w-full border rounded-lg px-3 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary text-sm text-center text-lg"
                            autoFocus/>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">°C</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={()=>setModal(null)}
                        className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">
                        Abbrechen
                      </button>
                      <button
                        disabled={(modal.mode==="daily"&&modal.tempOk===null)||(modal.mode==="referenz"&&!modal.referenzTemp.trim())}
                        onClick={()=>{
                          if(adminSession){
                            saveEntry(adminSession.kuerzel||"",adminSession.userId);
                          } else {
                            setModalStep("pin");
                          }
                        }}
                        className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        Speichern
                      </button>
                    </div>
                  </div>
                )}
                {modalStep==="pin"&&(
                  <PinStep
                    onVerified={(_name,userId,kuerzel)=>saveEntry(kuerzel,userId)}
                    onBack={()=>setModalStep("form")}
                    loading={saving} setLoading={setSaving}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
