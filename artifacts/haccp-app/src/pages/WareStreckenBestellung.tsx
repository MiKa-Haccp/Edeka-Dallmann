import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { ChevronLeft, ShoppingBag } from "lucide-react";

export default function WareStreckenBestellung() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3">
          <Link href="/ware-streckenbestellung" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#1a3a6b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Bestellung Streckenlieferanten</h1>
            <p className="text-sm text-muted-foreground">Bestellungen erfassen und verwalten</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-sm font-semibold text-muted-foreground">Dieser Bereich wird demnächst eingerichtet.</p>
        </div>

      </div>
    </AppLayout>
  );
}
