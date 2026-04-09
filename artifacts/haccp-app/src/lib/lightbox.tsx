import { createContext, useContext, useState, useEffect } from "react";
import { X, ZoomIn } from "lucide-react";
import { base64ToBlob } from "./pdf";

interface LightboxState {
  src: string;
  type: "image" | "pdf";
}

interface LightboxContextType {
  openLightbox: (src: string, type: "image" | "pdf") => void;
}

const LightboxContext = createContext<LightboxContextType>({
  openLightbox: () => {},
});

export function useLightboxContext() {
  return useContext(LightboxContext);
}

function LightboxOverlay({ src, type, onClose }: LightboxState & { onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (type === "pdf") {
      try {
        const blob = base64ToBlob(src);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch {
        setBlobUrl(null);
      }
    }
  }, [src, type]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="relative w-full max-w-5xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "image" ? (
          <img
            src={src}
            alt="Vollbild"
            className="max-w-full object-contain rounded-xl shadow-2xl"
            style={{ maxHeight: "88vh" }}
          />
        ) : (
          type === "pdf" && blobUrl ? (
            <iframe
              src={blobUrl}
              title="PDF Vollbild"
              className="w-full rounded-xl shadow-2xl border-0"
              style={{ height: "88vh" }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-white/60 text-sm">
              PDF wird geladen...
            </div>
          )
        )}
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-white/30 text-xs">
        ESC oder außerhalb klicken zum Schließen
      </p>
    </div>
  );
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  return (
    <LightboxContext.Provider value={{ openLightbox: (src, type) => setLightbox({ src, type }) }}>
      {children}
      {lightbox && (
        <LightboxOverlay
          src={lightbox.src}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}
    </LightboxContext.Provider>
  );
}

export function ClickableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const { openLightbox } = useLightboxContext();

  return (
    <div
      className="relative group cursor-zoom-in"
      onClick={() => openLightbox(src, "image")}
    >
      <img src={src} alt={alt || "Dokument"} className={className} />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors rounded-xl flex items-center justify-center pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2.5">
          <ZoomIn className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
