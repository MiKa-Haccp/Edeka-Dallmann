import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Loader2, Check, X, Lock, Thermometer, Printer, ArrowLeft } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getWeekday(y: number, m: number, d: number) { return WOCHENTAGE[new Date(y, m-1, d).getDay()]; }
function isWeekend(y: number, m: number, d: number) { const wd = new Date(y,m-1,d).getDay(); return wd===0||wd===6; }
function isFuture(y: number, m: number, d: number) { const n=new Date(); n.setHours(0,0,0,0); return new Date(y,m-1,d)>n; }
function isToday(y: number, m: number, d: number) { const n=new Date(); return n.getFullYear()===y&&n.getMonth()+1===m&&n.getDate()===d; }
function todayStr() { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; }

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

type EditModal = { day:number; tempOk:boolean|null; referenzTemp:string; };

export default function TempLagerKontrolle() {
  const [,nav]=useLocation();
  const { selectedMarketId, adminSession } = useAppStore();
  const { data: markets } = useListMarkets();
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [entries,setEntries]=useState<EntryMap>({});
  const [loading,setLoading]=useState(false);
  const [modal,setModal]=useState<EditModal|null>(null);
  const [modalStep,setModalStep]=useState<"form"|"pin">("form");
  const [savingUser,setSavingUser]=useState<{name:string;userId:number;kuerzel:string}|null>(null);
  const [saving,setSaving]=useState(false);

  const market=markets?.find(m=>m.id===selectedMarketId);
  const days=daysInMonth(year,month);

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

  function prevMonth(){if(month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1);}
  function nextMonth(){if(month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1);}

  function openDay(day:number){
    const e=entries[day];
    setModal({day,tempOk:e?.temp_ok??null,referenzTemp:e?.referenz_temp||""});
    setModalStep("form"); setSavingUser(null);
  }

  async function saveEntry(kuerzel:string,userId:number){
    if(!modal||!selectedMarketId) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/temp-lager-kontrolle`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({marketId:selectedMarketId,year,month,day:modal.day,
          tempOk:modal.tempOk,referenzTemp:modal.referenzTemp||null,kuerzel,userId})
      });
      await load();
      setModal(null);
    } catch(e){console.error(e);}
    finally{setSaving(false);}
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <PageHeader title="1.13 Temperatur-Lagerkontrolle" subtitle="Formblatt 6.3 — Tägliche Temperaturprüfung"/>
        <div className="flex-1 overflow-auto p-4 space-y-4">

          {/* Markt-Info */}
          {market&&(
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-600 shrink-0"/>
              <span className="text-sm text-blue-800 font-medium">Markt: {market.name}</span>
            </div>
          )}

          {/* Monatsnavigation */}
          <div className="flex items-center justify-between bg-white rounded-xl border shadow-sm p-3">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
            <div className="text-center">
              <div className="font-semibold text-lg">{MONTH_NAMES[month-1]} {year}</div>
              <div className="text-xs text-muted-foreground">Aufgezeichnete Temperaturen & Referenzmessung</div>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
          </div>

          {/* Tabelle */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a3a6b] text-white">
                    <th className="py-2 px-3 text-left font-medium w-14">Tag</th>
                    <th className="py-2 px-3 text-center font-medium">Temp. i.O.</th>
                    <th className="py-2 px-3 text-center font-medium">Referenzmessung</th>
                    <th className="py-2 px-3 text-center font-medium w-16">Kürzel</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length:days},(_,i)=>i+1).map(day=>{
                    const e=entries[day];
                    const future=isFuture(year,month,day);
                    const today=isToday(year,month,day);
                    const weekend=isWeekend(year,month,day);
                    const wd=getWeekday(year,month,day);
                    return (
                      <tr key={day}
                        onClick={()=>!future&&openDay(day)}
                        className={`border-b transition-colors ${future?"opacity-40 cursor-not-allowed":"cursor-pointer hover:bg-blue-50"}
                          ${today?"bg-blue-50 font-semibold":""}
                          ${weekend&&!today?"bg-gray-50":""}`}>
                        <td className="py-2 px-3 text-left">
                          <span className="font-medium">{day}</span>
                          <span className="text-muted-foreground ml-1 text-xs">{wd}</span>
                          {today&&<span className="ml-1 text-xs text-blue-600">(heute)</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {e?.temp_ok===true&&<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700"><Check className="w-4 h-4"/></span>}
                          {e?.temp_ok===false&&<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700"><X className="w-4 h-4"/></span>}
                          {e?.temp_ok==null&&!future&&<span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {e?.referenz_temp?<span className="font-mono text-sm">{e.referenz_temp}°C</span>:<span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-2 px-3 text-center text-xs text-muted-foreground">{e?.kuerzel||""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legende */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><Check className="w-3 h-3"/></span>Temperaturen in Ordnung</div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center"><X className="w-3 h-3"/></span>Abweichung dokumentieren</div>
          </div>
        </div>

        {/* Modal */}
        {modal&&(
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
              <div className="p-4 border-b">
                <div className="font-semibold">{modal.day}. {MONTH_NAMES[month-1]} {year}</div>
                <div className="text-xs text-muted-foreground">Temperatur-Lagerkontrolle</div>
              </div>
              <div className="p-4">
                {modalStep==="form"&&(
                  <div className="space-y-4">
                    {/* Temp i.O. */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Aufgezeichnete Temperaturen i.O.</label>
                      <div className="flex gap-3">
                        <button onClick={()=>setModal(m=>m?{...m,tempOk:true}:m)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                            ${modal.tempOk===true?"border-green-500 bg-green-50 text-green-700":"border-gray-200 hover:border-green-300"}`}>
                          <Check className="w-4 h-4"/>Ja, i.O.
                        </button>
                        <button onClick={()=>setModal(m=>m?{...m,tempOk:false}:m)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                            ${modal.tempOk===false?"border-red-500 bg-red-50 text-red-700":"border-gray-200 hover:border-red-300"}`}>
                          <X className="w-4 h-4"/>Nein
                        </button>
                      </div>
                    </div>

                    {/* Referenzmessung */}
                    <div>
                      <label className="text-sm font-medium block mb-1">Referenzmessung (°C)</label>
                      <div className="relative">
                        <input type="text" inputMode="decimal" placeholder="z.B. 2.5"
                          value={modal.referenzTemp}
                          onChange={e=>setModal(m=>m?{...m,referenzTemp:e.target.value}:m)}
                          className="w-full border rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary text-sm"/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">°C</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={()=>setModal(null)} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
                      <button disabled={modal.tempOk===null&&!modal.referenzTemp}
                        onClick={()=>{
                          if(adminSession){
                            saveEntry(adminSession.kuerzel||"",adminSession.userId);
                          } else {
                            setModalStep("pin");
                          }
                        }}
                        className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        Weiter
                      </button>
                    </div>
                  </div>
                )}
                {modalStep==="pin"&&(
                  <PinStep
                    onVerified={(name,userId,kuerzel)=>{setSavingUser({name,userId,kuerzel});saveEntry(kuerzel,userId);}}
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
