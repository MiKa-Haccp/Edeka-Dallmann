import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { Link } from "wouter";
import {
  ChevronLeft, Plus, X, Upload, FileText,
  ChevronLeft as PrevIcon, ChevronRight as NextIcon,
  Loader2, ZoomIn, RefreshCw, Camera, File,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";
const MAX_IMG_PX = 1920;
const JPEG_QUALITY = 0.85;

interface Seite {
  id: number;
  market_id: number;
  seite_nr: number;
  titel: string | null;
  datei_typ: string | null;
  datei_name: string | null;
  erstellt_am: string;
}
interface SeiteWithData extends Seite { datei_data: string; }

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!file.type.startsWith("image/")) { resolve(src); return; }
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, MAX_IMG_PX / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WareEigenbedarfOrdersatz() {
  const { selectedMarketId, adminSession } = useAppStore();
  const isAdmin = !!adminSession;

  const [seiten, setSeiten] = useState<Seite[]>([]);
  const [loading, setLoading] = useState(false);

  const [lightbox, setLightbox] = useState<SeiteWithData | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadSeiteNr, setUploadSeiteNr] = useState(1);
  const [uploadTitel, setUploadTitel] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const loadSeiten = useCallback(async () => {
    if (!selectedMarketId) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/eigenbedarf-ordersatz?marketId=${selectedMarketId}`);
      if (r.ok) setSeiten(await r.json());
    } finally { setLoading(false); }
  }, [selectedMarketId]);

  useEffect(() => { loadSeiten(); }, [loadSeiten]);

  const openLightbox = async (seite: Seite, idx: number) => {
    setLightboxLoading(true);
    setLightboxIdx(idx);
    setLightbox({ ...seite, datei_data: "" });
    const r = await fetch(`${BASE}/eigenbedarf-ordersatz/${seite.id}/data`);
    if (r.ok) {
      const data = await r.json();
      setLightbox({ ...seite, datei_data: data.datei_data });
    }
    setLightboxLoading(false);
  };

  const navigateLightbox = async (dir: -1 | 1) => {
    const next = lightboxIdx + dir;
    if (next < 0 || next >= seiten.length) return;
    await openLightbox(seiten[next], next);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    if (file.type.startsWith("image/")) {
      const compressed = await compressImage(file);
      setUploadPreview(compressed);
    } else {
      setUploadPreview(null);
    }
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedMarketId) return;
    setUploading(true);
    try {
      let dataUrl: string;
      if (uploadFile.type.startsWith("image/")) {
        dataUrl = uploadPreview!;
      } else {
        dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = e => res(e.target?.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(uploadFile);
        });
      }

      await fetch(`${BASE}/eigenbedarf-ordersatz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          seiteNr: uploadSeiteNr,
          titel: uploadTitel.trim() || null,
          dateiTyp: uploadFile.type,
          dateiName: uploadFile.name,
          dateiData: dataUrl,
        }),
      });

      setShowUpload(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadTitel("");
      setUploadSeiteNr(seiten.length + 1);
      await loadSeiten();
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Seite wirklich löschen?")) return;
    await fetch(`${BASE}/eigenbedarf-ordersatz/${id}`, { method: "DELETE" });
    await loadSeiten();
  };

  const isPdf = (typ: string | null) => typ === "application/pdf";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/ware-bestellungen" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">EDEKA Eigenbedarf</h1>
            <p className="text-sm text-muted-foreground">Ordersatz – aktuelle Bestellseiten</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowUpload(true); setUploadSeiteNr(seiten.length + 1); }}
              className="flex items-center gap-2 px-3 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Seite hochladen
            </button>
          )}
        </div>

        {/* Info */}
        <div className="bg-[#1a3a6b]/5 border border-[#1a3a6b]/15 rounded-2xl px-4 py-3">
          <p className="text-sm text-[#1a3a6b]/80 leading-relaxed">
            Hier findest du die aktuellen Ordersatz-Seiten für den EDEKA Eigenbedarf.
            Tippe auf eine Seite um sie zu vergrößern. Der Ordersatz wird ca. quartalsweise erneuert.
          </p>
        </div>

        {/* Kein Markt */}
        {!selectedMarketId && (
          <div className="bg-white rounded-2xl border border-border/60 p-10 text-center text-muted-foreground text-sm">
            Bitte oben einen Markt auswählen.
          </div>
        )}

        {/* Leer */}
        {selectedMarketId && !loading && seiten.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/60 p-12 text-center space-y-3">
            <FileText className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-sm font-semibold text-muted-foreground">Noch keine Ordersatz-Seiten hochgeladen.</p>
            {isAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a3a6b] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5aa0]"
              >
                <Plus className="w-4 h-4" /> Erste Seite hochladen
              </button>
            )}
          </div>
        )}

        {/* Ladespinner */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1a3a6b]" />
          </div>
        )}

        {/* Seitenraster */}
        {selectedMarketId && seiten.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {seiten.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => openLightbox(s, idx)}
                className="group relative bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#1a3a6b]/30 transition-all text-left"
              >
                {/* Thumbnail */}
                <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center overflow-hidden relative">
                  {isPdf(s.datei_typ) ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileText className="w-10 h-10 text-red-400" />
                      <span className="text-[10px] text-gray-500 leading-tight break-all">{s.datei_name}</span>
                    </div>
                  ) : (
                    <ThumbnailLoader seiteId={s.id} />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                  {/* Delete btn */}
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(s.id, e)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Löschen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div className="px-2.5 py-2">
                  <p className="text-xs font-bold text-[#1a3a6b]">Seite {s.seite_nr}</p>
                  {s.titel && <p className="text-[10px] text-muted-foreground truncate">{s.titel}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(s.erstellt_am)}</p>
                </div>
              </button>
            ))}

            {/* Upload-Karte (Admin) */}
            {isAdmin && (
              <button
                onClick={() => { setShowUpload(true); setUploadSeiteNr(seiten.length + 1); }}
                className="aspect-auto min-h-[160px] border-2 border-dashed border-[#1a3a6b]/25 rounded-2xl flex flex-col items-center justify-center gap-2 text-[#1a3a6b]/50 hover:text-[#1a3a6b] hover:border-[#1a3a6b]/50 hover:bg-[#1a3a6b]/4 transition-all"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs font-semibold">Seite hinzufügen</span>
              </button>
            )}
          </div>
        )}

        {/* ── Upload Modal ── */}
        {showUpload && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-base font-bold">
                  {uploadFile ? "Details eingeben" : "Seite hochladen"}
                </h2>
                <button
                  onClick={() => { setShowUpload(false); setUploadFile(null); setUploadPreview(null); }}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ── Schritt 1: Datei auswählen ── */}
              {!uploadFile && (
                <div className="px-5 pb-6 space-y-3">
                  <p className="text-sm text-muted-foreground">Was möchtest du hochladen?</p>

                  {/* Foto-Kachel */}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900">Foto aufnehmen</p>
                      <p className="text-xs text-amber-700 mt-0.5">Kamera oder Galerie – JPG, PNG</p>
                    </div>
                  </button>

                  {/* PDF-Kachel */}
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <File className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <p className="font-bold text-red-900">PDF hochladen</p>
                      <p className="text-xs text-red-700 mt-0.5">PDF-Datei aus dem Speicher wählen</p>
                    </div>
                  </button>

                  {/* Hidden inputs */}
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
                </div>
              )}

              {/* ── Schritt 2: Details + Vorschau ── */}
              {uploadFile && (
                <div className="px-5 pb-5 space-y-4">

                  {/* Vorschau */}
                  <div className="rounded-xl overflow-hidden border border-border/60 bg-gray-50">
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="Vorschau" className="w-full max-h-48 object-contain" />
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        <FileText className="w-10 h-10 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 break-all">{uploadFile.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Seitennummer */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seitennummer</label>
                    <input
                      type="number"
                      min={1}
                      value={uploadSeiteNr}
                      onChange={e => setUploadSeiteNr(Number(e.target.value))}
                      className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                    />
                  </div>

                  {/* Titel */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titel (optional)</label>
                    <input
                      value={uploadTitel}
                      onChange={e => setUploadTitel(e.target.value)}
                      placeholder="z.B. Duftstecker / Eigenbedarf"
                      className="mt-1 w-full border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                      className="px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      ← Zurück
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Lädt hoch…</>
                        : <><Upload className="w-4 h-4" /> Hochladen</>}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightbox && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 shrink-0">
              <div className="text-white">
                <p className="text-sm font-bold">Seite {lightbox.seite_nr}</p>
                {lightbox.titel && <p className="text-xs text-white/70">{lightbox.titel}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">{lightboxIdx + 1} / {seiten.length}</span>
                <button
                  onClick={() => setLightbox(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-4 min-h-0">
              {lightboxLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              ) : lightbox.datei_data ? (
                isPdf(lightbox.datei_typ) ? (
                  <div className="w-full max-w-3xl h-full min-h-[70vh] bg-white rounded-xl overflow-hidden">
                    <iframe
                      src={lightbox.datei_data}
                      className="w-full h-full min-h-[70vh]"
                      title={`Seite ${lightbox.seite_nr}`}
                    />
                  </div>
                ) : (
                  <img
                    src={lightbox.datei_data}
                    alt={`Seite ${lightbox.seite_nr}`}
                    className="max-w-full rounded-xl shadow-2xl object-contain"
                    style={{ maxHeight: "calc(100vh - 180px)" }}
                  />
                )
              ) : null}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 py-3 shrink-0">
              <button
                onClick={() => navigateLightbox(-1)}
                disabled={lightboxIdx === 0 || lightboxLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <PrevIcon className="w-4 h-4" /> Vorherige
              </button>
              <button
                onClick={() => navigateLightbox(1)}
                disabled={lightboxIdx >= seiten.length - 1 || lightboxLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Nächste <NextIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

function ThumbnailLoader({ seiteId }: { seiteId: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/eigenbedarf-ordersatz/${seiteId}/data`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) setSrc(d.datei_data); })
      .catch(() => { if (!cancelled) setErr(true); });
    return () => { cancelled = true; };
  }, [seiteId]);

  if (err) return <RefreshCw className="w-8 h-8 text-gray-300" />;
  if (!src) return <Loader2 className="w-6 h-6 animate-spin text-gray-300" />;
  return <img src={src} alt="" className="w-full h-full object-cover" />;
}
