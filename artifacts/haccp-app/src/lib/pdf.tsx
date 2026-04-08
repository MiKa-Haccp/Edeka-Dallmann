import { useEffect, useState } from "react";
import { X, ExternalLink, FileText, Loader2 } from "lucide-react";

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
  height = "300px",
}: {
  dataUrl: string;
  onClear?: () => void;
  editable?: boolean;
  height?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    try {
      const blob = base64ToBlob(dataUrl);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setError(true);
    }
  }, [dataUrl]);

  if (error || !blobUrl) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
        <FileText className="w-5 h-5 text-slate-500 shrink-0" />
        <span className="text-sm font-medium text-slate-700 flex-1">PDF-Dokument</span>
        <button
          onClick={() => openPdfNewTab(dataUrl)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#1a3a6b] text-white rounded-lg text-xs font-semibold hover:bg-[#2d5aa0] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Öffnen
        </button>
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
      <embed
        src={blobUrl}
        type="application/pdf"
        style={{ width: "100%", height, display: "block" }}
      />
      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
        <button
          onClick={() => openPdfNewTab(dataUrl)}
          className="flex items-center gap-1 px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs font-semibold hover:bg-black/80 transition-colors backdrop-blur-sm"
        >
          <ExternalLink className="w-3 h-3" /> Öffnen
        </button>
        {editable && onClear && (
          <button onClick={onClear} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PdfUploadPreview({
  dataUrl,
  onClear,
}: {
  dataUrl: string;
  onClear: () => void;
}) {
  return <PdfEmbed dataUrl={dataUrl} onClear={onClear} editable height="260px" />;
}
