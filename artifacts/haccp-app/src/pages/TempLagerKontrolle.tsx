import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { getBavarianHolidays } from "@/utils/holidays";
import {
  ChevronLeft, ChevronRight, Loader2, Check, X, Lock, Thermometer,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getWD(y: number, m: number, d: number) { return new Date(y, m-1, d).getDay(); }
function isSunday(y: number, m: number, d: number) { return getWD(y,m,d) === 0; }
function isFuture(y: number, m: number, d: number) {
  const n = new Date(); n.setHours(0,0,0,0);
  return new Date(y,m-1,d) > n;
}
function isToday(y: number, m: number, d: number) {
  const n = new Date();
  return n.getFullYear()===y && n.getMonth()+1===m && n.getDate()===d;
}

type Entry = { id: number; day: number; temp_ok: boolean|null; referenz_ok: boolean|null; kuerzel: string|null; };
type EntryMap = Record<number, Entry>;

function PinStep({ onVerified, onBack, loading, setLoading }: {
  onVerified:(name:string,userId:number,kuerzel:string)=>void;
  onBack:()=>void; loading:boolean; setLoading:(v:boolean)=>void;
}) {
  const [pin,setPin]=useState(""); const [error,setError]=useState("");
  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/users/verify-pin`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin,tenantId:1})});
      const data = await res.json();
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
        <p className="text-sm text-muted-foreground">4-stelligen persönlichen Code eingeben</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={4} placeholder="• • • •" value={pin}
        onChange={e=>setPin(e.target.value.replace(/\D/g,""))}
        onKeyDown={e=>e.key==="Enter"&&pin.length===4&&verify()}
        className="w-full border rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary" autoFocus/>
      {error&&<p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurück</button>
        <button onClick={verify} disabled={pin.length!==4||loading}
          className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Bestätigen
        </button>
      </div>
    </div>
  );
}

type ModalState = { day: number; tempOk: boolean|null; includeRef: boolean; };

export default function TempLagerKontrolle() {
  const { selectedMarketId, isAdmin } = useAppStore();
  const canEdit = isAdmin();
  const { data: markets } = useListMarkets();
  const now = new Date();
  const [year,setYear]  = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth()+1);
  const [entries,setEntries] = useState<EntryMap>({});
  const [loading,setLoading] = useState(false);
  const [modal,setModal]     = useState<ModalState|null>(null);
  const [modalStep,setModalStep] = useState<"form"|"pin">("form");
  const [saving,setSaving]   = useState(false);
  const todayRef = useRef<HTMLTableRowElement>(null);
  const hasLoaded = useRef(false);

  useEffect(()=>{
    if(modal){
      const sb = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${sb}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return ()=>{ document.body.style.overflow = ""; document.body.style.paddingRight = ""; };
  },[modal]);

  const market    = markets?.find((m:any)=>m.id===selectedMarketId);
  const days      = daysInMonth(year,month);
  const holidays  = useMemo(()=>getBavarianHolidays(year),[year]);
  const isHoliday = useCallback((d:number)=>holidays.has(dateStr(year,month,d)),[holidays,year,month]);
  const isClosed  = useCallback((d:number)=>isSunday(year,month,d)||isHoliday(d),[year,month,isHoliday]);
  const isCurrentMonth = now.getFullYear()===year && now.getMonth()+1===month;

  const refDoneThisMonth = useMemo(()=>
    Object.values(entries).some(e=>e.referenz_ok===true && e.day>0)
  ,[entries]);

  const load = useCallback(async()=>{
    if(!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/temp-lager-kontrolle?marketId=${selectedMarketId}&year=${year}&month=${month}`);
      const data:Entry[] = await r.json();
      const map:EntryMap = {};
      for(const e of data) if(e.day>0) map[e.day]=e;
      setEntries(map);
      hasLoaded.current = true;
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  },[selectedMarketId,year,month]);

  useEffect(()=>{load();},[load]);

  // Auto-scroll und Auto-Open
  useEffect(()=>{
    if(loading||!isCurrentMonth||!hasLoaded.current) return;
    setTimeout(()=>todayRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),200);
    const todayDay = now.getDate();
    if(!isClosed(todayDay)){
      const e = entries[todayDay];
      if(!e || e.temp_ok==null){
        setModal({day:todayDay, tempOk:null, includeRef:!refDoneThisMonth});
        setModalStep("form");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[loading]);

  function prevMonth(){if(month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1);}
  function nextMonth(){if(month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1);}

  function openModal(day:number){
    if(isClosed(day)||isFuture(year,month,day)) return;
    const e = entries[day];
    if(e?.temp_ok!=null && !canEdit) return; // normal: bereits erledigt, kein Edit
    setModal({
      day,
      tempOk: e?.temp_ok ?? null,
      includeRef: e ? (e.referenz_ok === true) : !refDoneThisMonth,
    });
    setModalStep("form");
  }

  async function saveEntry(kuerzel:string,userId:number){
    if(!modal||!selectedMarketId) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/temp-lager-kontrolle`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          marketId:selectedMarketId,year,month,day:modal.day,
          tempOk:modal.tempOk,
          referenzOk: modal.includeRef ? true : null,
          kuerzel,userId
        })
      });
      await load();
      setModal(null);
    } catch(e){console.error(e);}
    finally{setSaving(false);}
  }

  // Ampel-Berechnung
  const ampel = useMemo(()=>{
    let total=0, filled=0, bad=0;
    for(let d=1;d<=days;d++){
      if(isClosed(d)||isFuture(year,month,d)) continue;
      total++;
      const e=entries[d];
      if(e?.temp_ok===false) bad++;
      if(e?.temp_ok!=null) filled++;
    }
    if(bad>0) return "red";
    if(filled===total && total>0 && refDoneThisMonth) return "green";
    return "yellow";
  },[entries,days,year,month,refDoneThisMonth,isClosed]);

  const visibleDays = useMemo(()=>{
    const list:number[]=[];
    for(let d=1;d<=days;d++) if(!isClosed(d)) list.push(d);
    return list;
  },[days,isClosed]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/1" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5"/>
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Thermometer className="w-5 h-5"/>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">Temperatur-Lagerkontrolle</h1>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
              ampel==="green"?"bg-green-500/20 text-green-200":
              ampel==="red"?"bg-red-500/20 text-red-200":
              "bg-amber-400/20 text-amber-200"}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                ampel==="green"?"bg-green-400":
                ampel==="red"?"bg-red-400":"bg-amber-400"}`}/>
              {ampel==="green"?"Vollständig":ampel==="red"?"Abweichung":"Ausstehend"}
            </div>
          </div>
        </PageHeader>

        <div className="space-y-4">
          {/* Monatsnavigation */}
          <div className="flex items-center justify-between bg-white rounded-xl border shadow-sm p-3">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
            <span className="font-semibold text-lg">{MONTH_NAMES[month-1]} {year}</span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a3a6b] text-white">
                    <th colSpan={5} className="py-2.5 px-3 text-left font-semibold text-xs tracking-wide">
                      Tägliche Kontrolle der automatisch gemessenen und dokumentierten Temperaturen:
                    </th>
                  </tr>
                  <tr className="bg-[#2d5aa0] text-white/90 text-xs">
                    <th className="py-2 px-3 text-left font-medium w-20">Tag</th>
                    <th className="py-2 px-3 text-center font-medium">Aufgez. Temp. i.O.</th>
                    <th className="py-2 px-3 text-center font-medium">Referenzmessung</th>
                    <th className="py-2 px-3 text-center font-medium w-16">Kürzel</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDays.map(day=>{
                    const e      = entries[day];
                    const future = isFuture(year,month,day);
                    const today  = isToday(year,month,day);
                    const sat    = getWD(year,month,day)===6;
                    const done   = e?.temp_ok!=null;
                    const missing= !future && !done;
                    const bad    = e?.temp_ok===false;

                    return (
                      <tr key={day}
                        ref={today?todayRef:null}
                        onClick={()=>openModal(day)}
                        className={[
                          "border-b transition-colors",
                          future?"opacity-30 cursor-not-allowed":done&&!canEdit?"cursor-default":"cursor-pointer",
                          done?"hover:bg-gray-50":canEdit?"hover:bg-blue-50/50":"hover:bg-blue-50/50",
                          today&&!bad?"bg-blue-50":"",
                          sat&&!today&&!bad?"bg-gray-50/40":"",
                          bad?"bg-red-50":"",
                          missing&&!today?"bg-red-50/60":"",
                        ].filter(Boolean).join(" ")}>

                        {/* Tag-Spalte */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`font-medium ${today?"font-bold text-[#1a3a6b]":""}`}>{day}</span>
                          <span className="text-muted-foreground ml-1.5 text-xs">{WOCHENTAGE[getWD(year,month,day)]}</span>
                          {today&&<span className="ml-1 text-[9px] font-bold bg-[#1a3a6b] text-white px-1.5 py-0.5 rounded-full">HEUTE</span>}
                        </td>

                        {/* Aufgez. Temp. */}
                        <td className="py-2.5 px-3 text-center">
                          {e?.temp_ok===true&&<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700"><Check className="w-4 h-4"/></span>}
                          {e?.temp_ok===false&&<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700"><X className="w-4 h-4"/></span>}
                          {missing&&<span className="text-xs font-medium text-red-400">—</span>}
                        </td>

                        {/* Referenzmessung */}
                        <td className="py-2.5 px-3 text-center">
                          {e?.referenz_ok===true&&(
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700">
                              <Check className="w-4 h-4"/>
                            </span>
                          )}
                        </td>

                        {/* Kürzel */}
                        <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">{e?.kuerzel||""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legende */}
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap pb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 inline-flex items-center justify-center"><Check className="w-2.5 h-2.5"/></span>i.O.
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 inline-flex items-center justify-center"><X className="w-2.5 h-2.5"/></span>Abweichung
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center"><Check className="w-2.5 h-2.5"/></span>Referenz
            </span>
            <span className="ml-auto text-gray-400">Sonn- und Feiertage ausgeblendet</span>
          </div>
        </div>

        {/* Modal */}
        {modal&&(
          <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
              <div className="p-4 border-b">
                <div className="font-semibold">
                  {modal.day}. {MONTH_NAMES[month-1]} {year}
                </div>
                <div className="text-xs text-muted-foreground">Temperatur-Lagerkontrolle · 1.13</div>
              </div>
              <div className="p-4">
                {modalStep==="form"&&(
                  <div className="space-y-5">
                    {/* Temp i.O.? */}
                    <div>
                      <label className="text-sm font-semibold block mb-2">Aufgezeichnete Temperaturen i.O.?</label>
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

                    {/* Referenzmessung (nur wenn noch nicht gemacht diesen Monat) */}
                    {modal.includeRef&&(
                      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={()=>setModal(m=>m?{...m,includeRef:!m.includeRef}:m)}
                            className="mt-0.5 shrink-0">
                            <span className="w-5 h-5 rounded-md border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white"/>
                            </span>
                          </button>
                          <div>
                            <p className="text-sm font-semibold text-blue-900">Referenzmessung durchgeführt</p>
                            <p className="text-xs text-blue-600 mt-0.5">Einmal im Monat mit geeichtem Thermometer — heute erledigt</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={()=>setModal(null)} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
                      <button
                        disabled={modal.tempOk===null}
                        onClick={()=>setModalStep("pin")}
                        className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        Weiter
                      </button>
                    </div>
                  </div>
                )}
                {modalStep==="pin"&&(
                  <PinStep
                    onVerified={(_n,uid,kuerzel)=>saveEntry(kuerzel,uid)}
                    onBack={()=>setModalStep("form")}
                    loading={saving} setLoading={setSaving}
                  />
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
