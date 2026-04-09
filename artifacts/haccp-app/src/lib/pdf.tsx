import { useEffect, useState } from "react";
import { X, ExternalLink, FileText, Maximize2 } from "lucide-react";
import { useLightboxContext } from "./lightbox";

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

export function PdfEmbed({
  dataUrl,
  onClear,
  editable = false,
  fileName,
  height = "300px",
}: {
  dataUrl: string;
  onClear?: () => void;
  editable?: boolean;
  fileName?: string;
  height?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { openLightbox } = useLightboxContext();

  useEffect(() => {
    setError(false);
    setBlobUrl(null);
    try {
      const blob = base64ToBlob(dataUrl);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setError(true);
    }
  }, [dataUrl]);

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
        <FileText className="w-5 h-5 text-slate-500 shrink-0" />
        <span className="text-sm font-medium text-slate-700 flex-1">PDF-Dokument</span>
        {editable && onClear && (
          <button onClick={onClear} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/40 bg-slate-50">
      {blobUrl ? (
        <iframe
          src={blobUrl}
          title="PDF-Vorschau"
          className="w-full border-0 block"
          style={{ height }}
        />
      ) : (
        <div className="flex items-center justify-center bg-slate-100" style={{ height }}>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <FileText className="w-5 h-5" />
            <span>PDF wird geladen…</span>
          </div>
        </div>
      )}

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
