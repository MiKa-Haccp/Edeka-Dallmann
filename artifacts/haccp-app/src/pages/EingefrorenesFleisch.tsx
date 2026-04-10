import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  Snowflake, ChevronLeft, ChevronRight, Loader2, Check, X,
  Lock, Plus, Trash2, Printer, ArrowLeft, Package, AlertCircle,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

type FleischEntry = {
  id: number;
  artikel: string;
  vkp: string | null;
  menge_kg: string | null;
  eingefroren_am: string | null;
  eingefroren_durch: string | null;
  entnahme_1_kg: string | null;
  entnahme_2_kg: string | null;
  entnahme_3_kg: string | null;
  entnahme_4_kg: string | null;
  aufgebraucht_am: string | null;
  kuerzel: string;
};

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

// ─── Neuer Artikel Modal ───────────────────────────────────────────────────────
function NeuerArtikelModal({year,onConfirm,onClose}:{
  year:number;
  onConfirm:(data:{artikel:string;vkp:string;mengeKg:string;eingefrorenAm:string;eingefrorenDurch:string;kuerzel:string;userId:number|null})=>void;
  onClose:()=>void;
}){
  const [step,setStep]=useState<"form"|"pin">("form");
  const [artikel,setArtikel]=useState("");
  const [vkp,setVkp]=useState("");
  const [mengeKg,setMengeKg]=useState("");
  const [eingefrorenAm,setEingefrorenAm]=useState(()=>{
    const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
  });
  const [eingefrorenDurch,setEingefrorenDurch]=useState("");
  const [loading,setLoading]=useState(false);

  const handleVerified=(_name:string,userId:number,kuerzel:string)=>{
    onConfirm({artikel,vkp,mengeKg,eingefrorenAm,eingefrorenDurch:eingefrorenDurch||_name,kuerzel,userId});
  };

  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Artikel einfrieren – {year}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>

        {step==="form"&&(
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Artikel *</label>
              <input type="text" placeholder="z.B. Rindergulasch" value={artikel} onChange={e=>setArtikel(e.target.value)} autoFocus
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">VKP (EUR)</label>
                <input type="text" inputMode="decimal" placeholder="z.B. 12,99" value={vkp}
                  onChange={e=>setVkp(e.target.value.replace(/[^0-9.,]/g,""))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Menge (kg)</label>
                <input type="text" inputMode="decimal" placeholder="z.B. 2,5" value={mengeKg}
                  onChange={e=>setMengeKg(e.target.value.replace(/[^0-9.,]/g,""))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Eingefroren am *</label>
              <input type="date" value={eingefrorenAm} onChange={e=>setEingefrorenAm(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Eingefroren durch <span className="text-muted-foreground/60">(leer = PIN-Inhaber)</span></label>
              <input type="text" placeholder="Name..." value={eingefrorenDurch} onChange={e=>setEingefrorenDurch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button onClick={()=>setStep("pin")} disabled={!artikel.trim()||!eingefrorenAm}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Weiter</button>
            </div>
          </div>
        )}

        {step==="pin"&&(
          <PinStep onVerified={handleVerified} onBack={()=>setStep("form")} loading={loading} setLoading={setLoading}/>
        )}
      </div>
    </div>
  );
}

// ─── Hilfsfunktion: deutsche Dezimalzahl parsen ───────────────────────────────
function parseKg(s: string | null): number {
  if (!s) return 0;
  return parseFloat(s.replace(",", ".")) || 0;
}

// ─── Entnahme / Aufgebraucht Modal ────────────────────────────────────────────
function EntnahmeModal({entry,onSaved,onClose}:{
  entry:FleischEntry;
  onSaved:()=>void;
  onClose:()=>void;
}){
  const [step,setStep]=useState<"form"|"pin">("form");
  const nextSlot=entry.entnahme_4_kg?"full":entry.entnahme_3_kg?"4":entry.entnahme_2_kg?"3":entry.entnahme_1_kg?"2":"1";
  const [menge,setMenge]=useState("");
  const [aufgebraucht,setAufgebraucht]=useState(false);
  const [aufgebrauchtDatum,setAufgebrauchtDatum]=useState(()=>{
    const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
  });
  const [loading,setLoading]=useState(false);

  // Restmengen-Berechnung
  const gesamtKg = parseKg(entry.menge_kg);
  const bereitsEntnommen = parseKg(entry.entnahme_1_kg) + parseKg(entry.entnahme_2_kg) + parseKg(entry.entnahme_3_kg) + parseKg(entry.entnahme_4_kg);
  const restKg = gesamtKg > 0 ? Math.max(0, gesamtKg - bereitsEntnommen) : null;
  const neueEntnahme = parseKg(menge);
  const ueberschritten = restKg !== null && menge.trim() !== "" && neueEntnahme > restKg;

  const handleVerified=async(_name:string,_userId:number,_kuerzel:string)=>{
    const body:Record<string,string>={};
    if(nextSlot!=="full"&&menge) body[`entnahme${nextSlot}Kg`]=menge;
    if(aufgebraucht) body.aufgebrauchtAm=aufgebrauchtDatum;
    await fetch(`${BASE}/eingefrorenes-fleisch/${entry.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    onSaved();
  };

  const formatDate=(s:string|null)=>s?s.split("-").reverse().join("."):"";
  const fmtKg=(n:number)=>n.toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:3});

  const canProceed = nextSlot==="full" ? aufgebraucht : (aufgebraucht || (menge.trim()!==""&&!ueberschritten));

  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg truncate">{entry.artikel}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>

        {step==="form"&&(
          <div className="space-y-4">
            {/* Info-Box mit Restmenge */}
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1.5">
              <p><span className="text-muted-foreground">Eingefroren:</span> {formatDate(entry.eingefroren_am)}{entry.eingefroren_durch&&<span className="text-muted-foreground"> · {entry.eingefroren_durch}</span>}</p>
              {gesamtKg > 0 && (
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <div className="bg-white border rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[10px] text-muted-foreground">Gesamt</div>
                    <div className="font-bold text-sm">{fmtKg(gesamtKg)} kg</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[10px] text-orange-600">Entnommen</div>
                    <div className="font-bold text-sm text-orange-700">{fmtKg(bereitsEntnommen)} kg</div>
                  </div>
                  <div className={`rounded-lg px-2 py-1.5 text-center border ${restKg===0?"bg-red-50 border-red-200":"bg-green-50 border-green-200"}`}>
                    <div className={`text-[10px] ${restKg===0?"text-red-600":"text-green-600"}`}>Noch verfügbar</div>
                    <div className={`font-bold text-sm ${restKg===0?"text-red-700":"text-green-700"}`}>{restKg!==null?fmtKg(restKg):"—"} kg</div>
                  </div>
                </div>
              )}
              {[entry.entnahme_1_kg,entry.entnahme_2_kg,entry.entnahme_3_kg,entry.entnahme_4_kg].some(Boolean)&&(
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[entry.entnahme_1_kg,entry.entnahme_2_kg,entry.entnahme_3_kg,entry.entnahme_4_kg].map((e,i)=>e&&(
                    <span key={i} className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded">E{i+1}: {e} kg</span>
                  ))}
                </div>
              )}
            </div>

            {nextSlot!=="full"&&(
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Entnahme {nextSlot} (kg)
                  {restKg!==null&&<span className="ml-1 text-green-600 font-normal">· max. {fmtKg(restKg)} kg</span>}
                </label>
                <input type="text" inputMode="decimal" placeholder="z.B. 0,5" value={menge}
                  onChange={e=>setMenge(e.target.value.replace(/[^0-9.,]/g,""))}
                  autoFocus
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ueberschritten?"border-red-400 focus:ring-red-400":"focus:ring-primary"}`}/>
                {ueberschritten&&(
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0"/>
                    Entnahme ({fmtKg(neueEntnahme)} kg) überschreitet die verfügbare Menge ({fmtKg(restKg!)} kg).
                  </p>
                )}
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${aufgebraucht?"bg-green-500 border-green-500":"border-border"}`}
                onClick={()=>setAufgebraucht(v=>!v)}>
                {aufgebraucht&&<Check className="w-3 h-3 text-white"/>}
              </div>
              <span className="text-sm">Vollständig aufgebraucht</span>
            </label>
            {aufgebraucht&&(
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Aufgebraucht am</label>
                <input type="date" value={aufgebrauchtDatum} onChange={e=>setAufgebrauchtDatum(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-secondary">Abbrechen</button>
              <button onClick={()=>setStep("pin")} disabled={!canProceed}
                className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Weiter</button>
            </div>
          </div>
        )}

        {step==="pin"&&(
          <PinStep onVerified={handleVerified} onBack={()=>setStep("form")} loading={loading} setLoading={setLoading}/>
        )}
      </div>
    </div>
  );
}

// ─── Fleisch-Karte ────────────────────────────────────────────────────────────
function FleischKarte({entry,onEntnahme,onDelete,canDelete}:{
  entry:FleischEntry; onEntnahme:()=>void; onDelete:()=>void; canDelete:boolean;
}){
  const aufgebraucht=!!entry.aufgebraucht_am;
  const formatDate=(s:string|null)=>s?s.split("T")[0].split("-").reverse().join("."):"";
  const entnahmen=[entry.entnahme_1_kg,entry.entnahme_2_kg,entry.entnahme_3_kg,entry.entnahme_4_kg].filter(Boolean);
  const voll=entnahmen.length>=4;

  return(
    <div className={`border rounded-xl p-4 space-y-3 transition-colors ${aufgebraucht?"bg-muted/30 opacity-70":""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className={`w-4 h-4 shrink-0 ${aufgebraucht?"text-muted-foreground":"text-primary"}`}/>
          <span className="font-semibold truncate">{entry.artikel}</span>
          {aufgebraucht&&<span className="shrink-0 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">AUFGEBRAUCHT</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!aufgebraucht&&!voll&&(
            <button onClick={onEntnahme}
              className="flex items-center gap-1 text-xs bg-primary text-white rounded-lg px-2.5 py-1.5 hover:bg-primary/90 transition-colors">
              <Plus className="w-3 h-3"/>Entnahme
            </button>
          )}
          {!aufgebraucht&&voll&&(
            <button onClick={onEntnahme} className="flex items-center gap-1 text-xs border border-green-300 text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5 hover:bg-green-100 transition-colors">
              <Check className="w-3 h-3"/>Aufgebraucht
            </button>
          )}
          {canDelete&&(
            <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {entry.eingefroren_am&&(
          <div className="bg-muted/40 rounded-lg px-2 py-1.5">
            <div className="text-muted-foreground mb-0.5">Eingefroren am</div>
            <div className="font-semibold">{formatDate(entry.eingefroren_am)}</div>
          </div>
        )}
        {entry.menge_kg&&(
          <div className="bg-muted/40 rounded-lg px-2 py-1.5">
            <div className="text-muted-foreground mb-0.5">Menge</div>
            <div className="font-semibold">{entry.menge_kg} kg</div>
          </div>
        )}
        {entry.vkp&&(
          <div className="bg-muted/40 rounded-lg px-2 py-1.5">
            <div className="text-muted-foreground mb-0.5">VKP</div>
            <div className="font-semibold">{entry.vkp} EUR</div>
          </div>
        )}
        {entry.eingefroren_durch&&(
          <div className="bg-muted/40 rounded-lg px-2 py-1.5">
            <div className="text-muted-foreground mb-0.5">Durch</div>
            <div className="font-semibold truncate">{entry.eingefroren_durch}</div>
          </div>
        )}
      </div>

      {entnahmen.length>0&&(
        <div className="flex flex-wrap gap-1.5">
          {entnahmen.map((e,i)=>(
            <span key={i} className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Entnahme {i+1}: {e} kg
            </span>
          ))}
          {entry.aufgebraucht_am&&(
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Aufgebraucht: {formatDate(entry.aufgebraucht_am)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 border-t border-border/50">
        <span>Kuerzel: <strong>{entry.kuerzel}</strong></span>
        {voll&&!aufgebraucht&&(
          <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="w-3.5 h-3.5"/>Alle Entnahmen belegt – bitte als Aufgebraucht markieren</span>
        )}
      </div>
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────
export default function EingefrorenesFleisch() {
  const { selectedMarketId, adminSession, hasPermission } = useAppStore();
  const { data: markets } = useListMarkets();
  const marketName = useMemo(() => markets?.find(m => m.id === selectedMarketId)?.name ?? null, [markets, selectedMarketId]);
  const [,navigate] = useLocation();
  const now = new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [entries,setEntries]=useState<FleischEntry[]>([]);
  const [loading,setLoading]=useState(false);
  const [showNeuer,setShowNeuer]=useState(false);
  const [entnahmeFor,setEntnahmeFor]=useState<FleischEntry|null>(null);
  const [showAufgebraucht,setShowAufgebraucht]=useState(false);

  const marketId=selectedMarketId??0;

  const fetchEntries=useCallback(async()=>{
    if(!marketId)return;
    setLoading(true);
    try{const res=await fetch(`${BASE}/eingefrorenes-fleisch?marketId=${marketId}&year=${year}`);const data=await res.json();setEntries(Array.isArray(data)?data:[]);}
    catch{setEntries([]);}
    finally{setLoading(false);}
  },[marketId,year]);

  useEffect(()=>{fetchEntries();},[fetchEntries]);

  const handleNeu=async(data:{artikel:string;vkp:string;mengeKg:string;eingefrorenAm:string;eingefrorenDurch:string;kuerzel:string;userId:number|null})=>{
    await fetch(`${BASE}/eingefrorenes-fleisch`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({marketId,year,artikel:data.artikel,vkp:data.vkp||null,mengeKg:data.mengeKg||null,eingefrorenAm:data.eingefrorenAm||null,eingefrorenDurch:data.eingefrorenDurch||null,kuerzel:data.kuerzel,userId:data.userId})});
    setShowNeuer(false);fetchEntries();
  };

  const handleDelete=async(id:number)=>{
    await fetch(`${BASE}/eingefrorenes-fleisch/${id}`,{method:"DELETE"});
    fetchEntries();
  };

  const aktiv=useMemo(()=>entries.filter(e=>!e.aufgebraucht_am),[entries]);
  const aufgebraucht=useMemo(()=>entries.filter(e=>!!e.aufgebraucht_am),[entries]);

  return(
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <button onClick={()=>navigate("/semmelliste")}
              className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0" title="Zurueck">
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Snowflake className="w-5 h-5 text-white"/>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Eingefrorenes Fleisch</h1>
            </div>
          </div>
        </PageHeader>

        {/* Jahresnavigation + Header */}
        <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3">
          <button onClick={()=>setYear(y=>y-1)} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-5 h-5"/></button>
          <div className="text-center">
            <div className="font-bold text-lg">Jahr {year}</div>
            {marketName&&<div className="text-xs text-muted-foreground">Markt {marketName}</div>}
          </div>
          <button onClick={()=>setYear(y=>y+1)} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-5 h-5"/></button>
        </div>

        {/* Neuen Artikel anlegen */}
        <button onClick={()=>setShowNeuer(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 text-primary rounded-xl py-3 hover:border-primary/60 hover:bg-primary/5 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4"/>Artikel einfrieren
        </button>

        {loading?(
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ):!marketId?(
          <div className="text-center py-16 text-muted-foreground">Bitte einen Markt auswaehlen.</div>
        ):(
          <div className="space-y-4">
            {/* Aktive Artikel */}
            {aktiv.length>0&&(
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-primary"/>Aktiv eingefroren ({aktiv.length})
                </h2>
                {aktiv.map(e=>(
                  <FleischKarte key={e.id} entry={e}
                    onEntnahme={()=>setEntnahmeFor(e)}
                    onDelete={()=>handleDelete(e.id)} canDelete={hasPermission("entries.delete")}/>
                ))}
              </div>
            )}

            {aktiv.length===0&&!loading&&(
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-muted/20">
                <Snowflake className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40"/>
                Keine aktiv eingefrorenen Artikel für {year}.
              </div>
            )}

            {/* Aufgebrauchte Artikel (ausklappbar) */}
            {aufgebraucht.length>0&&(
              <div className="space-y-2">
                <button onClick={()=>setShowAufgebraucht(v=>!v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                  <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/>Aufgebraucht ({aufgebraucht.length})</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showAufgebraucht?"rotate-90":""}`}/>
                </button>
                {showAufgebraucht&&aufgebraucht.map(e=>(
                  <FleischKarte key={e.id} entry={e}
                    onEntnahme={()=>setEntnahmeFor(e)}
                    onDelete={()=>handleDelete(e.id)} canDelete={hasPermission("entries.delete")}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showNeuer&&<NeuerArtikelModal year={year} onConfirm={handleNeu} onClose={()=>setShowNeuer(false)}/>}
      {entnahmeFor&&<EntnahmeModal entry={entnahmeFor} onSaved={()=>{setEntnahmeFor(null);fetchEntries();}} onClose={()=>setEntnahmeFor(null)}/>}
    </AppLayout>
  );
}
