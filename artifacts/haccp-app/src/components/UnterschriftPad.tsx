import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, Check } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  height?: number;
}

export function UnterschriftPad({ label, value, onChange, height = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [hasSigned, setHasSigned] = useState(!!value);

  // Draw saved value on mount / when value changes externally
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
      setIsEmpty(false);
      setHasSigned(true);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      setHasSigned(false);
    }
  }, [value]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getCtx = () => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = getPos(e);
    // Draw a dot for single tap
    const ctx = getCtx();
    const p = lastPoint.current;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    setIsEmpty(false);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !lastPoint.current) return;
    e.preventDefault();
    const cur = getPos(e);
    const ctx = getCtx();
    // Use pointer pressure if available (stylus support)
    if (e.pressure && e.pressure > 0) {
      ctx.lineWidth = Math.max(1, Math.min(4, e.pressure * 4));
    }
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    lastPoint.current = cur;
  };

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    setHasSigned(true);
  }, [onChange]);

  const handleClear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
    setIsEmpty(true);
    setHasSigned(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {hasSigned && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <Check className="w-3.5 h-3.5" /> Unterschrift vorhanden
            </span>
          )}
          {!isEmpty && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
              title="Löschen"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Löschen
            </button>
          )}
        </div>
      </div>

      <div
        className="relative rounded-xl border-2 border-dashed border-border/60 bg-white overflow-hidden touch-none"
        style={{ height }}
      >
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <svg className="w-8 h-8 text-muted-foreground/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-xs text-muted-foreground/50 font-medium">Hier unterschreiben</span>
            <span className="text-[10px] text-muted-foreground/30 mt-0.5">Stift, Finger oder Maus</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={height * (800 / 400)}
          className="w-full h-full cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
    </div>
  );
}
