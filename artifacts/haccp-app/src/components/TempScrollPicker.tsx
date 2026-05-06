import { useEffect, useRef, useState } from "react";
import { Thermometer, Droplets } from "lucide-react";

interface TempScrollPickerProps {
  value: string;
  onChange: (val: string) => void;
  maxVal?: number;
  minVal?: number;
  unit?: string;
  status?: "ok" | "warn" | "none";
  disabled?: boolean;
  className?: string;
  hotRange?: boolean;
}

function buildValues(maxVal?: number, unit?: string, hotRange?: boolean): { vals: number[]; step: number } {
  let lo: number, hi: number, step: number;
  if (unit && unit.includes("%")) {
    lo = 50; hi = 100; step = 1;
  } else if (hotRange) {
    lo = 40; hi = 120; step = 1;
  } else if (maxVal !== undefined && maxVal <= -10) {
    lo = -30; hi = -5; step = 0.1;
  } else {
    lo = -8; hi = 15; step = 0.1;
  }
  const vals: number[] = [];
  for (let v = hi; v >= lo - step / 2; v = Math.round((v - step) * 100) / 100) {
    vals.push(Math.round(v * 100) / 100);
  }
  return { vals, step };
}

export function TempScrollPicker({
  value,
  onChange,
  maxVal,
  minVal,
  unit = "°C",
  status = "none",
  disabled,
  className = "",
  hotRange = false,
}: TempScrollPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  const { vals: values, step } = buildValues(maxVal, unit, hotRange);
  const isWholeNum = step >= 1;
  const fmt = (v: number) => isWholeNum ? v.toFixed(0) : v.toFixed(1);

  const startVal = hotRange
    ? (minVal ?? 65)
    : (maxVal ?? values[0]);
  const numVal = value ? parseFloat(value.replace(",", ".")) : null;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => activeRef.current?.scrollIntoView({ block: "center" }), 30);
  }, [open]);

  const select = (v: number) => { onChange(fmt(v)); setOpen(false); };

  const isActive  = (v: number) => numVal !== null && Math.abs(v - numVal) < 0.05;
  const isDefault = (v: number) => numVal === null && Math.abs(v - startVal) < 0.05;
  const isOut     = (v: number) =>
    (maxVal !== undefined && v > maxVal) || (minVal !== undefined && v < minVal);

  const triggerCls = [
    "flex items-center gap-1.5 border-2 rounded-lg px-3 py-2 text-sm font-mono transition-colors",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    status === "warn" ? "border-red-400 bg-red-50"
    : status === "ok"  ? "border-green-400 bg-green-50"
    : open              ? "border-primary/50 bg-blue-50"
    : "border-border bg-white hover:border-primary/40",
    className,
  ].join(" ");

  const Icon = (unit && unit.includes("%")) ? Droplets : Thermometer;

  return (
    <div ref={wrapRef} className="relative">
      <div onClick={() => { if (!disabled) setOpen(s => !s); }} className={triggerCls}>
        <Icon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
        <span className={`flex-1 text-center font-bold tabular-nums ${value ? "text-foreground" : "text-muted-foreground/40"}`}>
          {numVal !== null ? `${fmt(numVal)} ${unit}` : `— ${unit}`}
        </span>
      </div>

      {open && (
        <div className="absolute z-[60] top-full mt-1 left-0 w-36 bg-white border border-border/60 rounded-xl shadow-xl overflow-hidden">
          <ul className="max-h-52 overflow-y-auto py-1 scroll-smooth">
            {values.map(v => {
              const active = isActive(v);
              const def    = isDefault(v);
              const out    = isOut(v);
              return (
                <li
                  key={v}
                  ref={active || def ? activeRef : undefined}
                  onMouseDown={() => select(v)}
                  className={[
                    "px-3 py-1.5 text-sm font-mono cursor-pointer transition-colors text-right tabular-nums",
                    active ? "bg-[#1a3a6b] text-white font-bold"
                    : def  ? "bg-blue-50 text-[#1a3a6b] font-semibold"
                    : out  ? "text-red-500 hover:bg-red-50"
                    : "text-foreground hover:bg-blue-50",
                  ].join(" ")}
                >
                  {fmt(v)} {unit}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
