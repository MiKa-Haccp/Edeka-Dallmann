import { useEffect, useRef, useState, useCallback } from "react";
import { X, FileText, Maximize2, Loader2, Plus, ExternalLink } from "lucide-react";
import { useLightboxContext } from "./lightbox";
// ─── PDF.js lazy loader ───────────────────────────────────────────────────────
// Worker als statische Datei aus public/ → kein Bundling, kein CDN, funktioniert überall
let pdfjsReady: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfjs() {
  if (!pdfjsReady) {
    pdfjsReady = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = import.meta.env.BASE_URL + "pdf.worker.min.mjs";
      return lib;
    }).catch((err) => {
      pdfjsReady = null; // Bei Fehler Cache löschen → nächster Versuch klappt
      throw err;
    });
  }
  return pdfjsReady;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export type PdfAttachment = { name: string; data: string };

export function parsePdfAttachments(raw: string | undefined | null): PdfAttachment[] {
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [{ name: "Dokument.pdf", data: raw }];
}

export function serializePdfAttachments(list: PdfAttachment[]): string {
  if (list.length === 0) return "";
  return JSON.stringify(list);
}

export function base64ToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const bstr = atob(arr[1]);
  const bytes = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

export function openPdfNewTab(dataUrl: string) {
  try {
    const blob = base64ToBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch {
    window.open(dataUrl, "_blank");
  }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── Single-page canvas (thumbnail) ──────────────────────────────────────────
function PdfPageCanvas({ dataUrl, maxWidth, page: pageNum = 1, onRendered }: {
  dataUrl: string; maxWidth?: number; page?: number; onRendered?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    (async () => {
      try {
        const pdfjsLib = await getPdfjs();
        const pdf = await pdfjsLib.getDocument({ data: atob(dataUrl.split(",")[1]) }).promise;
        if (cancelled) return;
        const page = await pdf.getPage(Math.min(pageNum, pdf.numPages));
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const containerWidth = maxWidth || canvas.parentElement?.clientWidth || 500;
        const unscaled = page.getViewport({ scale: 1 });
        const dpr = window.devicePixelRatio || 1;
        const scale = (containerWidth / unscaled.width) * dpr;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width; canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx || cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas: canvas as any }).promise;
        if (!cancelled) { setLoading(false); onRendered?.(); }
      } catch { if (!cancelled) { setError(true); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, [dataUrl, maxWidth, pageNum]);

  return (
    <>
      {loading && !error && (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#1a3a6b]/40" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-6 gap-3 px-4">
          <FileText className="w-8 h-8 text-slate-400" />
          <span className="text-xs text-slate-500 text-center">PDF kann hier nicht angezeigt werden</span>
          <button
            onClick={() => openPdfNewTab(dataUrl)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] text-white text-sm font-medium rounded-xl hover:bg-[#2d5aa0] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            PDF öffnen
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full" style={{ display: loading || error ? "none" : "block" }} />
    </>
  );
}

// ─── All-pages canvas (for fullscreen lightbox) ───────────────────────────────
export function PdfAllPages({ dataUrl, maxWidth }: { dataUrl: string; maxWidth?: number }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    (async () => {
      try {
        const pdfjsLib = await getPdfjs();
        const pdf = await pdfjsLib.getDocument({ data: atob(dataUrl.split(",")[1]) }).promise;
        if (!cancelled) { setNumPages(pdf.numPages); setLoading(false); }
      } catch { if (!cancelled) { setError(true); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, [dataUrl]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
    </div>
  );
  if (error || !numPages) return (
    <div className="flex flex-col items-center py-16 gap-4 text-white/60">
      <FileText className="w-10 h-10" />
      <span className="text-sm">PDF kann hier nicht angezeigt werden</span>
      <button
        onClick={() => openPdfNewTab(dataUrl)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors border border-white/20"
      >
        <ExternalLink className="w-4 h-4" />
        PDF im Browser öffnen
      </button>
    </div>
  );

  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
        <div key={p} className="bg-white rounded-lg overflow-hidden shadow-xl">
          {numPages > 1 && (
            <div className="px-3 py-1 bg-slate-100 text-xs text-slate-500 font-medium border-b">
              Seite {p} / {numPages}
            </div>
          )}
          <PdfPageCanvas dataUrl={dataUrl} maxWidth={maxWidth || 900} page={p} />
        </div>
      ))}
    </div>
  );
}

// ─── Legacy single-embed (kept for backward compat) ───────────────────────────
export function PdfEmbed({
  dataUrl, onClear, editable = false, fileName, height: _height,
}: {
  dataUrl: string; onClear?: () => void; editable?: boolean; fileName?: string; height?: string;
}) {
  const { openLightbox } = useLightboxContext();
  return (
    <div className="relative rounded-xl overflow-hidden border border-border/40 bg-slate-50">
      <div className="cursor-zoom-in" onClick={() => openLightbox(dataUrl, "pdf")}>
        <PdfPageCanvas dataUrl={dataUrl} />
      </div>
      {fileName && (
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-600 font-medium truncate">{fileName}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
        <button onClick={() => openLightbox(dataUrl, "pdf")} title="Vollbild"
          className="w-8 h-8 bg-black/60 text-white rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        {editable && onClear && (
          <button onClick={onClear} title="Entfernen"
            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Multi-PDF manager (new) ──────────────────────────────────────────────────
/**
 * Drop-in replacement for PdfEmbed that supports multiple PDFs.
 * Reads/writes the raw DB value (old single-base64 or new JSON-array).
 *
 * Props:
 *   raw      – current raw DB string (old format or JSON array)
 *   onChange – called with new raw string whenever attachments change
 *   editable – show add/remove controls
 */
export function PdfMultiEmbed({
  raw, onChange, editable = false,
}: {
  raw: string;
  onChange?: (newRaw: string) => void;
  editable?: boolean;
}) {
  const { openLightbox } = useLightboxContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);

  const attachments = parsePdfAttachments(raw);

  const addFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return;
    setProcessing(true);
    try {
      const data = await readFileAsDataURL(file);
      const next = [...attachments, { name: file.name, data }];
      onChange?.(serializePdfAttachments(next));
    } finally { setProcessing(false); }
  }, [attachments, onChange]);

  const remove = useCallback((idx: number) => {
    const next = attachments.filter((_, i) => i !== idx);
    onChange?.(serializePdfAttachments(next));
  }, [attachments, onChange]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { e.target.value = ""; await addFile(file); }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await addFile(file);
  };

  if (attachments.length === 0) {
    if (!editable) return null;
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-colors cursor-pointer
          ${dragOver ? "border-[#1a3a6b] bg-[#1a3a6b]/5" : "border-border/60 hover:border-[#1a3a6b]/40 hover:bg-slate-50"}`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileInput} />
        <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center">
          {processing ? <Loader2 className="w-5 h-5 text-[#1a3a6b] animate-spin" /> : <FileText className="w-5 h-5 text-[#1a3a6b]" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1a3a6b]">PDF auswählen</p>
          <p className="text-xs text-muted-foreground mt-0.5">oder hierher ziehen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((att, idx) => (
        <div key={idx} className="relative rounded-xl overflow-hidden border border-border/40 bg-slate-50 group">
          <div className="cursor-zoom-in" onClick={() => openLightbox(att.data, "pdf")}>
            <PdfPageCanvas dataUrl={att.data} />
          </div>
          <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 font-medium truncate flex-1">{att.name}</span>
            <button
              onClick={() => openPdfNewTab(att.data)}
              title="In neuem Tab öffnen"
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5 z-10">
            <button onClick={() => openLightbox(att.data, "pdf")} title="Vollbild"
              className="w-8 h-8 bg-black/60 text-white rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {editable && (
              <button onClick={() => remove(idx)} title="Entfernen"
                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {editable && (
        <>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileInput} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all
              ${dragOver ? "border-[#1a3a6b] bg-[#1a3a6b]/5 text-[#1a3a6b]" : "border-border/60 text-muted-foreground hover:border-[#1a3a6b]/40 hover:text-[#1a3a6b] hover:bg-slate-50"}
              disabled:opacity-50`}
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Weiteres PDF hinzufügen
          </button>
        </>
      )}
    </div>
  );
}

// ─── Fullscreen (all pages, used in lightbox) ─────────────────────────────────
export function PdfFullscreen({ dataUrl }: { dataUrl: string }) {
  // Breite: auf Handy Bildschirmbreite nutzen, auf Desktop max. 900px
  const maxWidth = typeof window !== "undefined"
    ? Math.min(900, window.innerWidth - 16)
    : 900;

  return (
    <div
      className="w-full bg-transparent"
      onClick={(e) => e.stopPropagation()}
    >
      <PdfAllPages dataUrl={dataUrl} maxWidth={maxWidth} />
    </div>
  );
}
