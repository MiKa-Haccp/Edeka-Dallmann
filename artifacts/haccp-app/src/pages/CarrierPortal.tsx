import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExternalLink, Globe, KeyRound, User, Copy, Check, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useListMarkets } from "@workspace/api-client-react";
import { Link } from "wouter";

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

const PORTAL_CONFIGS: Record<number, { name: string; url: string; urlDisplay: string; benutzername: string; passwort: string }> = {
  // Leeder
  1: {
    name: "Carrier-Portal",
    url: "https://new.carrier-e-service.com",
    urlDisplay: "new.carrier-e-service.com",
    benutzername: "ESBDallmannM",
    passwort: "Dallmann111",
  },
  // Buching
  2: {
    name: "Carrier-Portal",
    url: "https://new.carrier-e-service.com",
    urlDisplay: "new.carrier-e-service.com",
    benutzername: "ESBDallmannM",
    passwort: "Dallmann111",
  },
  // MOD
  3: {
    name: "Hauser-Portal",
    url: "https://www.e-lds-internetdienste.de",
    urlDisplay: "www.e-lds-internetdienste.de",
    benutzername: "EM_Marktoberdorf",
    passwort: "K98Vxs453Q",
  },
};

const DEFAULT_CONFIG = PORTAL_CONFIGS[1];

export default function CarrierPortal() {
  const selectedMarketId = useAppStore(s => s.selectedMarketId);
  const { data: markets } = useListMarkets();
  const market = markets?.find(m => m.id === selectedMarketId);

  const config = selectedMarketId && PORTAL_CONFIGS[selectedMarketId]
    ? PORTAL_CONFIGS[selectedMarketId]
    : DEFAULT_CONFIG;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-10">

        {/* HEADER */}
        <PageHeader>
          <div className="flex items-center gap-3">
            <Link href="/category/2" className="p-2 rounded-xl hover:bg-white/15 text-white/75 hover:text-white transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Zugangsdaten {config.name}</h1>
              <p className="text-sm text-white/70">
                Online-Serviceportal für Kühlsysteme
              </p>
            </div>
          </div>
        </PageHeader>

        {/* PORTAL-LINK */}
        <div className="bg-white rounded-xl border border-border/60 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Webadresse</h2>
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline transition-colors group"
          >
            <ExternalLink className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            {config.urlDisplay}
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
                  {config.benutzername}
                </span>
                <CopyButton text={config.benutzername} />
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
                  {config.passwort}
                </span>
                <CopyButton text={config.passwort} />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/70">
            Diese Zugangsdaten sind vertraulich und dürfen nicht an unbefugte Dritte weitergegeben werden.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
