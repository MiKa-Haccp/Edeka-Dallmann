import { useEffect, useRef, useState } from "react";
import { X, FileText, Maximize2, Loader2 } from "lucide-react";
import { useLightboxContext } from "./lightbox";

let pdfjsReady: Promise<typeof import("pdfjs-dist")> | null = null;

function getPdfjs() {
  if (!pdfjsReady) {
    pdfjsReady = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      return lib;
    });
  }
  return pdfjsReady;
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

function PdfCanvas({
  dataUrl,
  maxWidth,
  onRendered,
}: {
  dataUrl: string;
  maxWidth?: number;
  onRendered?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageInfo, setPageInfo] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const pdfjsLib = await getPdfjs();
        const loadingTask = pdfjsLib.getDocument({ data: atob(dataUrl.split(",")[1]) });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setPageInfo(`${pdf.numPages} Seite${pdf.numPages > 1 ? "n" : ""}`);

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const containerWidth = maxWidth || canvas.parentElement?.clientWidth || 500;
        const unscaled = page.getViewport({ scale: 1 });
        const dpr = window.devicePixelRatio || 1;
        const scale = (containerWidth / unscaled.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx || cancelled) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          setLoading(false);
          onRendered?.();
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataUrl, maxWidth]);

  return (
    <>
      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a3a6b]/40" />
          <span className="text-xs text-muted-foreground">PDF wird gerendert…</span>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <FileText className="w-6 h-6 text-red-400" />
          <span className="text-xs text-red-500">PDF konnte nicht geladen werden</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ display: loading || error ? "none" : "block" }}
      />
      {!loading && !error && pageInfo && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">{pageInfo}</p>
      )}
    </>
  );
}

export function PdfEmbed({
  dataUrl,
  onClear,
  editable = false,
  fileName,
  height,
}: {
  dataUrl: string;
  onClear?: () => void;
  editable?: boolean;
  fileName?: string;
  height?: string;
}) {
  const { openLightbox } = useLightboxContext();

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/40 bg-slate-50">
      <div className="cursor-zoom-in" onClick={() => openLightbox(dataUrl, "pdf")}>
        <PdfCanvas dataUrl={dataUrl} />
      </div>

      {fileName && (
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-600 font-medium truncate">{fileName}</span>
        </div>
      )}

      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
        <button
          onClick={() => openLightbox(dataUrl, "pdf")}
          title="Vollbild"
          className="w-8 h-8 bg-black/60 text-white rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        {editable && onClear && (
          <button
            onClick={onClear}
            title="Entfernen"
            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PdfFullscreen({ dataUrl }: { dataUrl: string }) {
  return (
    <div
      className="w-full overflow-auto bg-white rounded-xl"
      style={{ maxHeight: "88vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <PdfCanvas dataUrl={dataUrl} maxWidth={900} />
    </div>
  );
}
