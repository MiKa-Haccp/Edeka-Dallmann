import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Store, ChevronLeft } from "lucide-react";

export default function WareLadenbestellung() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/ware-bestellungen" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-[#1a3a6b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground mb-0.5">Ladenbestellung</h1>
            <p className="text-muted-foreground text-sm">Bestellungen für den Laden erfassen und verwalten.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1a3a6b]/8 flex items-center justify-center">
            <Store className="w-8 h-8 text-[#1a3a6b]/40" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">In Vorbereitung</p>
            <p className="text-sm text-muted-foreground mt-1">Dieser Bereich wird gerade eingerichtet.</p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
