import { Lock } from "lucide-react";
import type { ArchivLock } from "@/hooks/useArchivLock";

interface Props {
  lockInfo: ArchivLock | null;
  year: number;
  className?: string;
}

export function ArchivBanner({ lockInfo, year, className = "" }: Props) {
  return (
    <div className={`flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
        <Lock className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-amber-800">Jahr {year} ist archiviert – schreibgeschützt</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Keine neuen Einträge möglich.
          {lockInfo?.lockedByName ? ` Archiviert von ${lockInfo.lockedByName}` : ""}
          {lockInfo?.lockedAt ? ` am ${new Date(lockInfo.lockedAt).toLocaleDateString("de-DE")}.` : ""}
        </p>
      </div>
    </div>
  );
}
