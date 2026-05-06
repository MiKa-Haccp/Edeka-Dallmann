import { useEffect, useRef } from "react";

export function useFilePaste(onFile: (file: File) => void) {
  const ref = useRef(onFile);
  ref.current = onFile;

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            ref.current(file);
            return;
          }
        }
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, []);
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
    reader.readAsDataURL(file);
  });
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Komprimiert ein Bild auf maximal `maxPx` Pixel (längste Seite) und
 * gibt es als JPEG-Data-URL zurück. Handyfotos (4K+) werden so von
 * ~5–10 MB auf ~200–400 KB reduziert, bevor sie in die DB gespeichert werden.
 */
export function compressImage(
  file: File,
  maxPx = 1920,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxPx / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
