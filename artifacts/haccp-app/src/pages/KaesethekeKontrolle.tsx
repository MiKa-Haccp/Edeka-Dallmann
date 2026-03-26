import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  Thermometer, ChevronLeft, ChevronRight, Loader2, Check,
  X, Printer, Lock, Plus, Trash2, Wind, Flame, Snowflake,
  AlertTriangle, ArrowLeft,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONTH_NAMES = ["Januar","Februar","Maerz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

type KontrolleArt = "reifeschrank" | "kaesekühlschrank" | "heisse_theke";
type TrafficLight = "green" | "yellow" | "red" | "none";

type KontrolleEntry = {
  id: number;
  day: number;
  kontrolle_art: KontrolleArt;
  produkt: string | null;
  temperatur: string | null;
  luftfeuchtigkeit: string | null;
  kern_temp_garen: string | null;
  temp_heisshalten: string | null;
  massnahme: string | null;
  kuerzel: string;
  defekt: boolean;
};

const HEISSE_THEKE_STANDARD = ["Geflügel","Hackbraten","Fleischpflanzerl","Leberkäse","Schweinebraten","Kasselerbraten"];
const HEISSE_THEKE_SPECIAL  = ["Fisch","Sonstiges"]; // Heisshalten erforderlich
const HEISSE_THEKE_PRODUKTE = [...HEISSE_THEKE_STANDARD, ...HEISSE_THEKE_SPECIAL];

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function getWeekday(year: number, month: number, day: number) { return WOCHENTAGE[new Date(year, month-1, day).getDay()]; }
function isWeekend(year: number, month: number, day: number) { const d=new Date(year,month-1,day).getDay(); return d===0||d===6; }
function isFuture(year: number, month: number, day: number) { const n=new Date();n.setHours(0,0,0,0);return new Date(year,month-1,day)>n; }
function isToday(year: number, month: number, day: number) { const n=new Date(); return n.getFullYear()===year&&n.getMonth()+1===month&&n.getDate()===day; }
function todayBerlin() {
  const parts = new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const g=(t:string)=>Number(parts.find(p=>p.type===t)?.value??0);
  return {y:g("year"),m:g("month"),d:g("day")};
}

// ─── Ampellogik ──────────────────────────────────────────────────────────────
function isSundayDate(year: number, month: number, day: number) { return new Date(year, month-1, day).getDay() === 0; }

function getTabStatus(entries: KontrolleEntry[], art: KontrolleArt, year: number, month: number): TrafficLight {
  const { y, m, d } = todayBerlin();
  if (year !== y || month !== m) return "none";
  const tabEntries = entries.filter(e => e.kontrolle_art === art);
  const daysWithEntries = new Set(tabEntries.map(e => e.day));
  const todayIsSunday = isSundayDate(y, m, d);
  const todayHasEntry = daysWithEntries.has(d);
  let hasMissingPast = false;
  for (let i = 1; i < d; i++) {
    if (!isSundayDate(y, m, i) && !daysWithEntries.has(i)) { hasMissingPast = true; break; }
  }
  if (todayIsSunday) return hasMissingPast ? "red" : "green";
  if (todayHasEntry && !hasMissingPast) return "green";
  if (!todayHasEntry && hasMissingPast) return "red";
  if (!todayHasEntry) return "yellow";
  return "red";
}

function TrafficDot({ status }: { status: TrafficLight }) {
  if (status === "none") return null;
  const cls = status==="green"?"bg-green-500":status==="yellow"?"bg-amber-400 animate-pulse":"bg-red-500 animate-pulse";
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white ${cls}`} />;
}

// ─── Temperatur-Validierung ───────────────────────────────────────────────────
function tempStatus(val:string|null,art:KontrolleArt):"ok"|"warn"|"none"{
  if(!val)return"none";const n=parseFloat(val.replace(",","."));if(isNaN(n))return"none";
  if(art==="reifeschrank")return(n>=1&&n<=3)?"ok":"warn";
  if(art==="kaesekühlschrank")return n<=7?"ok":"warn";
  return"none";
}
function humidityStatus(val:string|null):"ok"|"warn"|"none"{
  if(!val)return"none";const n=parseFloat(val.replace(",","."));if(isNaN(n))return"none";
  return(n>=75&&n<=85)?"ok":"warn";
}
function garenStatus(val:string|null,produkt:string|null):"ok"|"warn"|"none"{
  if(!val)return"none";const n=parseFloat(val.replace(",","."));if(isNaN(n))return"none";
  return n>=(produkt==="Fisch"?60:72)?"ok":"warn";
}
function heisshaltenStatus(val:string|null):"ok"|"warn"|"none"{
  if(!val)return"none";const n=parseFloat(val.replace(",","."));if(isNaN(n))return"none";
  return n>=60?"ok":"warn";
}

function TempBadge({val,status}:{val:string|null;status:"ok"|"warn"|"none"}){
  if(!val)return<span className="text-muted-foreground/40">—</span>;
  return<span className={`font-mono font-semibold text-sm ${status==="ok"?"text-green-600":status==="warn"?"text-red-600":"text-foreground"}`}>{val}°C</span>;
}

// ─── PIN-Schritt ─────────────────────────────────────────────────────────────
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
      else setError("PIN ungueltig.");
    }catch{setError("Verbindungsfehler.");}
    finally{setLoading(false);}
  };
  return(
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2"><Lock className="w-6 h-6 text-primary"/></div>
        <p className="text-sm text-muted-foreground">PIN eingeben zur Bestaetigung</p>
      </div>
      <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={pin}
        onChange={e=>setPin(e.target.value.replace(/\D/g,""))}
        onKeyDown={e=>e.key==="Enter"&&pin.length>=3&&verify()}
        className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary" autoFocus/>
      {error&&<p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurueck</button>
        <button onClick={verify} disabled={pin.length<3||loading}
          className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Bestaetigen
        </button>
      </div>
    </div>
  );
}

// ─── Modal: Reifeschrank / Käsekühlschrank ────────────────────────────────────
function TempModal({art,day,year,month,onConfirm,onClose}:{
  art:"reifeschrank"|"kaesekühlschrank"; day:number; year:number; month:number;
  onConfirm:(data:{temperatur:string;luftfeuchtigkeit?:string;massnahme:string;kuerzel:string;userId:number|null;defekt:boolean})=>void;
  onClose:()=>void;
}){
  const [step,setStep]=useState<"form"|"pin"|"defektPin">("form");
  const [temp,setTemp]=useState("");const[feuchte,setFeuchte]=useState("");
  const [massnahme,setMassnahme]=useState("");const[loading,setLoading]=useState(false);
  const [defektMode,setDefektMode]=useState(false);
  const [defektGrund,setDefektGrund]=useState("");

  const tempSpec=art==="reifeschrank"?"Soll: 2°C (±1°C)":"Soll: max. 7°C";
  const tStatus=tempStatus(temp,art);
  const hStatus=humidityStatus(feuchte);
  const hasWarn=tStatus==="warn"||hStatus==="warn";
  const dayStr=`${String(day).padStart(2,"0")}.${String(month).padStart(2,"0")}.${year}`;
  const artLabel=art==="reifeschrank"?"Reifeschrank":"Kaesekühlschrank";

  const handlePinVerified=(_name:string,userId:number,kuerzel:string)=>{
    if(defektMode){
      onConfirm({temperatur:"",massnahme:defektGrund||"Defekt / nicht in Betrieb",kuerzel,userId,defekt:true});
    } else {
      onConfirm({temperatur:temp,...(art==="reifeschrank"?{luftfeuchtigkeit:feuchte}:{}),massnahme,kuerzel,userId,defekt:false});
    }
  };

  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{artLabel} – {dayStr}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>

        {step==="form"&&!defektMode&&(
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Temperatur (°C) <span className="text-muted-foreground/60">{tempSpec}</span></label>
              <div className="relative">
                <input type="text" inputMode="decimal" placeholder="z.B. 2,1" value={temp} onChange={e=>setTemp(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${tStatus==="warn"?"border-red-400 bg-red-50":tStatus==="ok"?"border-green-400 bg-green-50":""}`} autoFocus/>
                {tStatus!=="none"&&<span className={`absolute right-2 top-2 text-xs font-semibold ${tStatus==="ok"?"text-green-600":"text-red-600"}`}>{tStatus==="ok"?"i.O.":"ABWEICHUNG"}</span>}
              </div>
            </div>
            {art==="reifeschrank"&&(
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Luftfeuchtigkeit (% rH) <span className="text-muted-foreground/60">Soll: 75–85%</span></label>
                <div className="relative">
                  <input type="text" inputMode="decimal" placeholder="z.B. 80,0" value={feuchte} onChange={e=>setFeuchte(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${hStatus==="warn"?"border-red-400 bg-red-50":hStatus==="ok"?"border-green-400 bg-green-50":""}`}/>
                  {hStatus!=="none"&&<span className={`absolute right-2 top-2 text-xs font-semibold ${hStatus==="ok"?"text-green-600":"text-red-600"}`}>{hStatus==="ok"?"i.O.":"ABWEICHUNG"}</span>}
                </div>
              </div>
            )}
            <div>
              <label className={`text-xs font-medium block mb-1 ${hasWarn?"text-red-600":"text-muted-foreground"}`}>Massnahme {hasWarn&&<span className="text-red-400">* Pflicht bei Abweichung</span>}</label>
              <textarea rows={2} placeholder={hasWarn?"Getroffene Massnahme beschreiben...":"Ggf. Massnahme (optional)..."} value={massnahme} onChange={e=>setMassnahme(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${hasWarn?"border-red-300 focus:ring-red-400":"focus:ring-primary"}`}/>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={()=>{setDefektMode(true);setStep("defektPin");}} className="flex items-center gap-1.5 border border-orange-300 text-orange-700 bg-orange-50 rounded-lg px-3 py-2 text-sm hover:bg-orange-100 transition-colors">
                <AlertTriangle className="w-4 h-4"/>Defekt
              </button>
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button onClick={()=>setStep("pin")} disabled={!temp||(hasWarn&&!massnahme.trim())}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Weiter</button>
            </div>
          </div>
        )}

        {step==="defektPin"&&(
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-700 font-medium text-sm mb-2"><AlertTriangle className="w-4 h-4"/>Defekt / nicht in Betrieb</div>
              <textarea rows={2} placeholder="Grund (optional)..." value={defektGrund} onChange={e=>setDefektGrund(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"/>
            </div>
            <PinStep onVerified={handlePinVerified} onBack={()=>{setDefektMode(false);setStep("form");}} loading={loading} setLoading={setLoading}/>
          </div>
        )}

        {step==="pin"&&(
          <PinStep onVerified={handlePinVerified} onBack={()=>setStep("form")} loading={loading} setLoading={setLoading}/>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Heiße Theke (Mehrfachauswahl) ────────────────────────────────────
type ProduktInput = { selected: boolean; kernTemp: string; customName: string };

function HeisseThekeModal({day,year,month,onConfirm,onClose}:{
  day:number; year:number; month:number;
  onConfirm:(items:{produkt:string;kernTempGaren:string;tempHeisshalten:string;massnahme:string;kuerzel:string;userId:number|null;defekt:boolean}[])=>void;
  onClose:()=>void;
}){
  const [step,setStep]=useState<"form"|"pin">("form");
  const [inputs,setInputs]=useState<Record<string,ProduktInput>>(()=>{
    const init:Record<string,ProduktInput>={};
    HEISSE_THEKE_PRODUKTE.forEach(p=>{init[p]={selected:false,kernTemp:"",customName:""};});
    return init;
  });
  const [sharedHeissTemp,setSharedHeissTemp]=useState("");
  const [massnahme,setMassnahme]=useState("");
  const [pin,setPin]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const selected=HEISSE_THEKE_PRODUKTE.filter(p=>inputs[p].selected);
  const toggle=(p:string)=>setInputs(prev=>({...prev,[p]:{...prev[p],selected:!prev[p].selected}}));
  const setKT=(p:string,v:string)=>setInputs(prev=>({...prev,[p]:{...prev[p],kernTemp:v}}));
  const setCN=(p:string,v:string)=>setInputs(prev=>({...prev,[p]:{...prev[p],customName:v}}));

  const hSt=heisshaltenStatus(sharedHeissTemp);

  const canProceed=selected.length>0&&selected.every(p=>{
    const inp=inputs[p];
    if(p==="Sonstiges")return inp.customName.trim()&&inp.kernTemp;
    return inp.kernTemp;
  });

  const hasAnyWarn=selected.some(p=>{
    const gSt=garenStatus(inputs[p].kernTemp,p);
    return gSt==="warn";
  })||(hSt==="warn");

  const handleVerifyPin=async()=>{
    setError("");setLoading(true);
    try{
      const res=await fetch(`${BASE}/users/verify-pin`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin,tenantId:1})});
      const data=await res.json();
      if(data.valid){
        const items=selected.map(p=>{
          const inp=inputs[p];
          const finalProdukt=p==="Sonstiges"?inp.customName.trim():p;
          return{produkt:finalProdukt,kernTempGaren:inp.kernTemp,tempHeisshalten:sharedHeissTemp,massnahme,kuerzel:data.initials,userId:data.userId,defekt:false};
        });
        onConfirm(items);
      }else setError("PIN ungueltig.");
    }catch{setError("Verbindungsfehler.");}
    finally{setLoading(false);}
  };

  const dayStr=`${String(day).padStart(2,"0")}.${String(month).padStart(2,"0")}.${year}`;

  return(
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h3 className="font-bold text-lg">Heisse Theke – {dayStr}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>

        {step==="form"?(
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-1">
              <p className="text-xs text-muted-foreground mb-3">Produkte auswaehlen und Kerntemperatur eintragen:</p>
              {HEISSE_THEKE_PRODUKTE.map(p=>{
                const inp=inputs[p];
                const gSt=garenStatus(inp.kernTemp,p);
                const minT=p==="Fisch"?"60":"72";
                return(
                  <div key={p} className={["rounded-xl border transition-all",inp.selected?"border-primary/40 bg-primary/5":"border-border"].join(" ")}>
                    <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer" onClick={()=>toggle(p)}>
                      <div className={["w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",inp.selected?"bg-primary border-primary":"border-border"].join(" ")}>
                        {inp.selected&&<Check className="w-3 h-3 text-white"/>}
                      </div>
                      <span className={`text-sm font-medium ${inp.selected?"text-primary":"text-foreground"}`}>{p}</span>
                    </div>
                    {inp.selected&&(
                      <div className="px-3 pb-3 space-y-2 border-t border-primary/20 pt-2">
                        {p==="Sonstiges"&&(
                          <input type="text" placeholder="Produktbezeichnung..." value={inp.customName} onChange={e=>setCN(p,e.target.value)}
                            className="w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" autoFocus/>
                        )}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground w-36 shrink-0">Kerntemp. Garen <span className="text-muted-foreground/60">≥{minT}°C</span></label>
                          <div className="relative flex-1">
                            <input type="text" inputMode="decimal" placeholder="z.B. 75,0" value={inp.kernTemp} onChange={e=>setKT(p,e.target.value)}
                              className={`w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-16 ${gSt==="warn"?"border-red-400 bg-red-50":gSt==="ok"?"border-green-400 bg-green-50":""}`}/>
                            {gSt!=="none"&&<span className={`absolute right-2 top-1.5 text-[10px] font-bold ${gSt==="ok"?"text-green-600":"text-red-600"}`}>{gSt==="ok"?"i.O.":"ABWEICH."}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Gemeinsame Heißhalten-Temperatur für alle Produkte */}
              {selected.length>0&&(
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-amber-800 w-36 shrink-0">Heisshalten Theke <span className="text-amber-600/70">≥60°C</span></label>
                    <div className="relative flex-1">
                      <input type="text" inputMode="decimal" placeholder="z.B. 65,0" value={sharedHeissTemp} onChange={e=>setSharedHeissTemp(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-16 ${hSt==="warn"?"border-red-400 bg-red-50":hSt==="ok"?"border-green-400 bg-green-50":"border-amber-300"}`}/>
                      {hSt!=="none"&&<span className={`absolute right-2 top-1.5 text-[10px] font-bold ${hSt==="ok"?"text-green-600":"text-red-600"}`}>{hSt==="ok"?"i.O.":"ABWEICH."}</span>}
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1.5">Gilt fuer alle ausgewaehlten Produkte</p>
                </div>
              )}

              {hasAnyWarn&&(
                <div className="pt-2">
                  <label className="text-xs font-medium text-red-600 block mb-1">Massnahme <span className="text-red-400">* Pflicht bei Abweichung</span></label>
                  <textarea rows={2} placeholder="Massnahme beschreiben..." value={massnahme} onChange={e=>setMassnahme(e.target.value)}
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"/>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 pt-3 border-t flex gap-2">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2.5 text-sm hover:bg-secondary">Abbrechen</button>
              <button onClick={()=>setStep("pin")} disabled={!canProceed||(hasAnyWarn&&!massnahme.trim())}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                Weiter ({selected.length} Produkt{selected.length!==1?"e":""})
              </button>
            </div>
          </div>
        ):(
          <div className="px-6 py-5 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2"><Lock className="w-6 h-6 text-primary"/></div>
              <p className="text-sm text-muted-foreground">PIN eingeben zur Bestaetigung</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{selected.length} Produkt{selected.length!==1?"e":""} werden gespeichert</p>
            </div>
            <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={pin}
              onChange={e=>setPin(e.target.value.replace(/\D/g,""))}
              onKeyDown={e=>e.key==="Enter"&&pin.length>=3&&handleVerifyPin()}
              className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary" autoFocus/>
            {error&&<p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={()=>setStep("form")} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Zurueck</button>
              <button onClick={handleVerifyPin} disabled={pin.length<3||loading}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Reifeschrank / Käsekühlschrank ──────────────────────────────────────
function TempTab({art,entries,year,month,marketId,onSaved,onDeleted,adminSession,openTodayModal,onTodayModalHandled}:{
  art:"reifeschrank"|"kaesekühlschrank";
  entries:KontrolleEntry[]; year:number; month:number; marketId:number;
  onSaved:()=>void; onDeleted:(id:number)=>void; adminSession:boolean;
  openTodayModal:boolean; onTodayModalHandled:()=>void;
}){
  const {d:todayD,y:ty,m:tm}=todayBerlin();
  const isCurrentMonth=year===ty&&month===tm;
  const [modal,setModal]=useState<number|null>(null);
  const todayRowRef=useRef<HTMLTableRowElement>(null);

  useEffect(()=>{
    if(openTodayModal&&isCurrentMonth){
      const todayHas=entries.some(e=>e.day===todayD);
      if(!todayHas){setModal(todayD);}
      onTodayModalHandled();
    }
  },[openTodayModal]);

  useEffect(()=>{
    if(isCurrentMonth&&todayRowRef.current){
      setTimeout(()=>todayRowRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),100);
    }
  },[isCurrentMonth,entries.length]);

  const days=daysInMonth(year,month);
  const byDay=useMemo(()=>{
    const m:Record<number,KontrolleEntry[]>={};
    for(const e of entries){if(!m[e.day])m[e.day]=[];m[e.day].push(e);}
    return m;
  },[entries]);

  const tempSpec=art==="reifeschrank"?"Soll: 2°C (±1°C)":"Soll: max. 7°C";

  const handleSave=async(day:number,data:{temperatur:string;luftfeuchtigkeit?:string;massnahme:string;kuerzel:string;userId:number|null;defekt:boolean})=>{
    await fetch(`${BASE}/kaesetheke-kontrolle`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId,year,month,day,kontrolleArt:art,temperatur:data.temperatur,luftfeuchtigkeit:data.luftfeuchtigkeit||null,massnahme:data.massnahme,kuerzel:data.kuerzel,userId:data.userId,defekt:data.defekt})});
    setModal(null);onSaved();
  };

  return(
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Thermometer className="w-3.5 h-3.5 shrink-0"/>
        <span>{tempSpec}{art==="reifeschrank"?" | Luftfeuchtigkeit: 75–85% rH":""} | Auf einen Tag tippen zum Eintragen.</span>
      </div>
      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-y-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 border-b">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-16">Tag</th>
              <th className="text-left px-2 py-2.5 text-xs font-semibold text-muted-foreground w-8">WT</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Temp.</th>
              {art==="reifeschrank"&&<th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Feuchte</th>}
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Massnahme</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-20">Kuerzel</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length:days},(_,i)=>i+1).map(day=>{
              const dayEntries=byDay[day]||[];
              const latestEntry=dayEntries[dayEntries.length-1]||null;
              const wt=getWeekday(year,month,day);
              const future=isFuture(year,month,day);
              const today=isToday(year,month,day);
              const weekend=isWeekend(year,month,day);
              if(wt==="So")return null;
              const tSt=tempStatus(latestEntry?.temperatur??null,art);
              const hSt=humidityStatus(latestEntry?.luftfeuchtigkeit??null);
              const hasWarn=(tSt==="warn"||hSt==="warn")&&!latestEntry?.defekt;
              const clickable=!future;

              return(
                <tr key={day} ref={today?todayRowRef:null} onClick={()=>clickable&&setModal(day)}
                  className={["border-b last:border-0 transition-colors",
                    today?"bg-blue-50/70":weekend?"bg-muted/20":"",
                    hasWarn?"bg-red-50/50":"",
                    clickable?"cursor-pointer hover:bg-primary/5 active:bg-primary/10":"opacity-40",
                  ].filter(Boolean).join(" ")}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-base">{String(day).padStart(2,"0")}</span>
                      {today&&<span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HEUTE</span>}
                      {!latestEntry&&clickable&&<span className="text-[10px] text-primary/50 hidden sm:inline">+ Eintragen</span>}
                    </div>
                  </td>
                  <td className={`px-2 py-3 text-xs font-medium ${weekend?"text-red-500":"text-muted-foreground"}`}>{wt}</td>
                  <td className="px-3 py-3">
                    {latestEntry?.defekt?(
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-0.5"><AlertTriangle className="w-3 h-3"/>Defekt</span>
                    ):latestEntry?.temperatur?(
                      <TempBadge val={latestEntry.temperatur} status={tSt}/>
                    ):clickable?(
                      <span className="inline-flex items-center gap-1 text-xs text-primary/40 border border-dashed border-primary/20 rounded px-2 py-0.5"><Plus className="w-3 h-3"/>Temp.</span>
                    ):<span className="text-muted-foreground/30 text-xs">—</span>}
                  </td>
                  {art==="reifeschrank"&&(
                    <td className="px-3 py-3">
                      {!latestEntry?.defekt&&latestEntry?.luftfeuchtigkeit?(
                        <span className={`font-mono font-semibold text-sm ${hSt==="ok"?"text-green-600":hSt==="warn"?"text-red-600":"text-foreground"}`}>{latestEntry.luftfeuchtigkeit}%</span>
                      ):<span className="text-muted-foreground/30 text-xs">—</span>}
                    </td>
                  )}
                  <td className="px-3 py-3 max-w-[200px] hidden md:table-cell">
                    {latestEntry?.massnahme?<span className={`text-xs truncate block ${hasWarn?"text-red-600 font-medium":"text-muted-foreground"}`}>{latestEntry.massnahme}</span>:<span className="text-muted-foreground/30 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {latestEntry?<span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">{latestEntry.kuerzel}</span>:<span className="text-muted-foreground/30 text-xs">—</span>}
                      {adminSession&&latestEntry&&(
                        <button onClick={e=>{e.stopPropagation();fetch(`${BASE}/kaesetheke-kontrolle/${latestEntry.id}`,{method:"DELETE"}).then(()=>onDeleted(latestEntry.id));}}
                          className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors" title="Loeschen">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>{/* scroll container */}
      </div>
      {modal!==null&&(
        <TempModal art={art} day={modal} year={year} month={month}
          onConfirm={data=>handleSave(modal,data)} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}

// ─── Tab: Heiße Theke ─────────────────────────────────────────────────────────
function HeisseThekeTab({entries,year,month,marketId,onSaved,onDeleted,adminSession,openTodayModal,onTodayModalHandled}:{
  entries:KontrolleEntry[]; year:number; month:number; marketId:number;
  onSaved:()=>void; onDeleted:(id:number)=>void; adminSession:boolean;
  openTodayModal:boolean; onTodayModalHandled:()=>void;
}){
  const {d:todayD,y:ty,m:tm}=todayBerlin();
  const isCurrentMonth=year===ty&&month===tm;
  const [modal,setModal]=useState<number|null>(null);
  const todayCardRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(openTodayModal&&isCurrentMonth){
      const todayHas=entries.some(e=>e.day===todayD);
      if(!todayHas){setModal(todayD);}
      onTodayModalHandled();
    }
  },[openTodayModal]);

  useEffect(()=>{
    if(isCurrentMonth&&todayCardRef.current){
      setTimeout(()=>todayCardRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),100);
    }
  },[isCurrentMonth,entries.length]);

  const days=daysInMonth(year,month);
  const byDay=useMemo(()=>{
    const m:Record<number,KontrolleEntry[]>={};
    for(const e of entries){if(!m[e.day])m[e.day]=[];m[e.day].push(e);}
    return m;
  },[entries]);

  const handleSave=async(day:number,items:{produkt:string;kernTempGaren:string;tempHeisshalten:string;massnahme:string;kuerzel:string;userId:number|null;defekt:boolean}[])=>{
    await Promise.all(items.map(data=>
      fetch(`${BASE}/kaesetheke-kontrolle`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({marketId,year,month,day,kontrolleArt:"heisse_theke",produkt:data.produkt,kernTempGaren:data.kernTempGaren,tempHeisshalten:data.tempHeisshalten,massnahme:data.massnahme,kuerzel:data.kuerzel,userId:data.userId,defekt:data.defekt})})
    ));
    setModal(null);onSaved();
  };

  return(
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Flame className="w-3.5 h-3.5 shrink-0 text-orange-500"/>
        <span><strong>Garen:</strong> mind. +72°C (Fisch: +60°C) | <strong>Heisshalten:</strong> mind. 60°C, max. 3 Std.</span>
      </div>
      <div className="space-y-2">
        {Array.from({length:days},(_,i)=>i+1).map(day=>{
          const dayEntries=byDay[day]||[];
          const wt=getWeekday(year,month,day);
          const future=isFuture(year,month,day);
          const today=isToday(year,month,day);
          const weekend=isWeekend(year,month,day);
          if(wt==="So")return null;
          if(future&&dayEntries.length===0)return null;
          return(
            <div key={day} ref={today?todayCardRef:null} className={["border rounded-xl overflow-hidden",today?"border-blue-200 shadow-sm":"",weekend&&!today?"bg-muted/10":""].filter(Boolean).join(" ")}>
              <div className={`flex items-center justify-between px-4 py-2.5 border-b ${today?"bg-blue-50":"bg-muted/30"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base">{String(day).padStart(2,"0")}.</span>
                  <span className={`text-sm font-medium ${weekend?"text-red-500":"text-muted-foreground"}`}>{wt}</span>
                  {today&&<span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">HEUTE</span>}
                  {dayEntries.length>0&&<span className="text-xs text-muted-foreground">{dayEntries.length} Produkt{dayEntries.length!==1?"e":""}</span>}
                </div>
                {!future&&(
                  <button onClick={()=>setModal(day)} className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors">
                    <Plus className="w-3.5 h-3.5"/>Produkt eintragen
                  </button>
                )}
              </div>
              {dayEntries.length>0?(
                <div className="divide-y">
                  {dayEntries.map(entry=>{
                    const gSt=garenStatus(entry.kern_temp_garen,entry.produkt);
                    const hSt=heisshaltenStatus(entry.temp_heisshalten);
                    const hasWarn=(gSt==="warn"||hSt==="warn")&&!entry.defekt;
                    return(
                      <div key={entry.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 ${hasWarn?"bg-red-50/60":""}`}>
                        {entry.defekt?(
                          <span className="flex items-center gap-1 text-sm font-semibold text-orange-600"><AlertTriangle className="w-4 h-4"/>Defekt / nicht in Betrieb</span>
                        ):<span className="font-semibold text-sm w-32 truncate">{entry.produkt}</span>}
                        {!entry.defekt&&<>
                          <div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Garen:</span><TempBadge val={entry.kern_temp_garen} status={gSt}/></div>
                          <div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Heisshalten:</span><TempBadge val={entry.temp_heisshalten} status={hSt}/></div>
                        </>}
                        {entry.massnahme&&<span className={`text-xs flex-1 min-w-0 truncate ${hasWarn?"text-red-600 font-medium":"text-muted-foreground"}`}>{entry.massnahme}</span>}
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">{entry.kuerzel}</span>
                          {adminSession&&<button onClick={()=>fetch(`${BASE}/kaesetheke-kontrolle/${entry.id}`,{method:"DELETE"}).then(()=>onDeleted(entry.id))} className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ):(
                <div onClick={()=>!future&&setModal(day)} className={`px-4 py-3 text-sm text-center text-muted-foreground/60 ${!future?"cursor-pointer hover:bg-primary/5 hover:text-primary/70":""}`}>
                  {!future?"Tippen um erstes Produkt einzutragen":"Keine Eintraege"}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modal!==null&&<HeisseThekeModal day={modal} year={year} month={month} onConfirm={data=>handleSave(modal,data)} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────
type Tab = "reifeschrank" | "kaesekühlschrank" | "heisse_theke";

export default function KaesethekeKontrolle() {
  const { selectedMarketId, adminSession } = useAppStore();
  const { data: markets } = useListMarkets();
  const marketName = useMemo(() => markets?.find(m => m.id === selectedMarketId)?.name ?? null, [markets, selectedMarketId]);
  const [,navigate] = useLocation();
  const now = new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [tab,setTab]=useState<Tab>("reifeschrank");
  const [entries,setEntries]=useState<KontrolleEntry[]>([]);
  const [loading,setLoading]=useState(false);
  const [openTodayFor,setOpenTodayFor]=useState<Tab|null>(null);

  const marketId=selectedMarketId??0;

  const fetchEntries=useCallback(async()=>{
    if(!marketId)return;
    setLoading(true);
    try{const res=await fetch(`${BASE}/kaesetheke-kontrolle?marketId=${marketId}&year=${year}&month=${month}`);const data=await res.json();setEntries(Array.isArray(data)?data:[]);}
    catch{setEntries([]);}
    finally{setLoading(false);}
  },[marketId,year,month]);

  useEffect(()=>{fetchEntries();},[fetchEntries]);

  const filteredEntries=useMemo(()=>entries.filter(e=>e.kontrolle_art===tab),[entries,tab]);

  const prevMonth=()=>{if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const nextMonth=()=>{if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const handleDeleted=(id:number)=>setEntries(prev=>prev.filter(e=>e.id!==id));

  const handleTabClick=(newTab:Tab)=>{
    setTab(newTab);
    // Direkt heute-Modal öffnen wenn noch kein Eintrag
    const {d,y,m}=todayBerlin();
    if(year===y&&month===m){
      const hasToday=entries.some(e=>e.kontrolle_art===newTab&&e.day===d);
      if(!hasToday) setOpenTodayFor(newTab);
    }
  };

  const tabs:{key:Tab;label:string;icon:React.ReactNode}[]=[
    {key:"reifeschrank",label:"Reifeschrank",icon:<Wind className="w-4 h-4"/>},
    {key:"kaesekühlschrank",label:"Kaesekühlschrank",icon:<Snowflake className="w-4 h-4"/>},
    {key:"heisse_theke",label:"Heisse Theke",icon:<Flame className="w-4 h-4"/>},
  ];

  return(
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header mit Zurück-Button */}
        <div className="flex items-start gap-3">
          <button onClick={()=>navigate("/metzgerei-wareneingaenge")}
            className="mt-1 p-2 rounded-lg border hover:bg-secondary transition-colors shrink-0" title="Zurueck">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Thermometer className="w-5 h-5 text-primary"/>
              <h1 className="text-xl font-bold">3.4 Kaesetheke und Reifeschrank</h1>
            </div>
            <p className="text-xs text-muted-foreground">Temperaturkontrolle Reifeschrank (FB 9.5) | Kaesekühlschrank | Heisse Theke (FB 9.7)</p>
          </div>
          <button onClick={()=>window.print()} className="mt-1 flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 hover:bg-secondary shrink-0">
            <Printer className="w-4 h-4"/><span className="hidden sm:inline">Drucken</span>
          </button>
        </div>

        {/* Monatsnavigation */}
        <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
          <div className="text-center">
            <div className="font-bold text-lg">{MONTH_NAMES[month-1]} {year}</div>
            {marketName&&<div className="text-xs text-muted-foreground">Markt {marketName}</div>}
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
        </div>

        {/* Tabs mit Ampel */}
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {tabs.map(t=>{
            const status=getTabStatus(entries,t.key,year,month);
            return(
              <button key={t.key} onClick={()=>handleTabClick(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab===t.key?"bg-white shadow text-primary":"text-muted-foreground hover:text-foreground"}`}>
                <TrafficDot status={status}/>
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inhalt */}
        {loading?(
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ):!marketId?(
          <div className="text-center py-16 text-muted-foreground">Bitte einen Markt auswaehlen.</div>
        ):(
          <>
            {tab==="reifeschrank"&&(
              <TempTab art="reifeschrank" entries={filteredEntries} year={year} month={month} marketId={marketId}
                onSaved={fetchEntries} onDeleted={handleDeleted} adminSession={!!adminSession}
                openTodayModal={openTodayFor==="reifeschrank"} onTodayModalHandled={()=>setOpenTodayFor(null)}/>
            )}
            {tab==="kaesekühlschrank"&&(
              <TempTab art="kaesekühlschrank" entries={filteredEntries} year={year} month={month} marketId={marketId}
                onSaved={fetchEntries} onDeleted={handleDeleted} adminSession={!!adminSession}
                openTodayModal={openTodayFor==="kaesekühlschrank"} onTodayModalHandled={()=>setOpenTodayFor(null)}/>
            )}
            {tab==="heisse_theke"&&(
              <HeisseThekeTab entries={filteredEntries} year={year} month={month} marketId={marketId}
                onSaved={fetchEntries} onDeleted={handleDeleted} adminSession={!!adminSession}
                openTodayModal={openTodayFor==="heisse_theke"} onTodayModalHandled={()=>setOpenTodayFor(null)}/>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
