import { AppLayout } from "@/components/layout/AppLayout";
import { ExternalLink, Globe, KeyRound, User, Copy, Check } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Kopieren"
      className="ml-2 p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CarrierPortal() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-10">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1a3a6b]/10">
            <Globe className="w-6 h-6 text-[#1a3a6b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">2.3 Zugangsdaten Carrier-Portal</h1>
            <p className="text-sm text-muted-foreground">Online-Serviceportal für Kühlsysteme</p>
          </div>
        </div>

        {/* PORTAL-LINK */}
        <div className="bg-white rounded-xl border border-border/60 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Webadresse</h2>
          <a
            href="https://new.carrier-e-service.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline transition-colors group"
          >
            <ExternalLink className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            https://new.carrier-e-service.com
          </a>
          <p className="text-xs text-muted-foreground">
            Klicken um das Portal in einem neuen Tab zu öffnen
          </p>
        </div>

        {/* ZUGANGSDATEN */}
        <div className="bg-white rounded-xl border border-border/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Zugangsdaten</h2>

          <div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden">
            {/* Benutzername */}
            <div className="flex items-center px-4 py-4 gap-4">
              <div className="flex items-center gap-2 w-36 shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Benutzername</span>
              </div>
              <div className="flex items-center flex-1">
                <span className="font-mono font-bold text-foreground text-base tracking-wide">
                  ESBDallmannM
                </span>
                <CopyButton text="ESBDallmannM" />
              </div>
            </div>

            {/* Passwort */}
            <div className="flex items-center px-4 py-4 gap-4">
              <div className="flex items-center gap-2 w-36 shrink-0">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Passwort</span>
              </div>
              <div className="flex items-center flex-1">
                <span className="font-mono font-bold text-foreground text-base tracking-wide">
                  Dallmann111
                </span>
                <CopyButton text="Dallmann111" />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/70">
            Diese Zugangsdaten sind vertraulich und duerfen nicht an unbefugte Dritte weitergegeben werden.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
