import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface MitarbeiterOption {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  initials: string;
}

let cachedMitarbeiter: MitarbeiterOption[] | null = null;

async function fetchMitarbeiter(): Promise<MitarbeiterOption[]> {
  if (cachedMitarbeiter) return cachedMitarbeiter;
  try {
    const res = await fetch(`${BASE}/users?tenantId=1&status=aktiv`);
    const data = await res.json();
    cachedMitarbeiter = (data as MitarbeiterOption[])
      .filter((u) => u.name && u.name.trim())
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
    return cachedMitarbeiter;
  } catch {
    return [];
  }
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  label?: string;
}

export function MitarbeiterSuchInput({
  value,
  onChange,
  required,
  placeholder = "Vor- und Nachname",
  label = "Mitarbeiter",
}: Props) {
  const [optionen, setOptionen] = useState<MitarbeiterOption[]>([]);
  const [offen, setOffen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMitarbeiter().then(setOptionen);
  }, []);

  const gefiltert = value.trim().length >= 1
    ? optionen.filter((m) =>
        (m.name ?? "").toLowerCase().includes(value.toLowerCase()) ||
        (m.initials ?? "").toLowerCase().includes(value.toLowerCase())
      )
    : optionen;

  const handleInput = (v: string) => {
    onChange(v);
    setOffen(true);
    setHighlight(-1);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setOffen(false);
    setHighlight(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!offen || gefiltert.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, gefiltert.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      handleSelect(gefiltert[highlight].name);
    } else if (e.key === "Escape") {
      setOffen(false);
    }
  };

  // Außerklick schließt Dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = offen && gefiltert.length > 0;

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && " *"}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOffen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3 py-2 pr-8 rounded-xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b]/40 transition-all"
        />
        <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />

        {showDropdown && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border/60 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {gefiltert.slice(0, 12).map((m, i) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(m.name); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  i === highlight
                    ? "bg-[#1a3a6b] text-white"
                    : "hover:bg-[#1a3a6b]/5 text-foreground"
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === highlight ? "bg-white/20 text-white" : "bg-[#1a3a6b]/10 text-[#1a3a6b]"
                }`}>
                  {m.initials || m.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-medium">{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
