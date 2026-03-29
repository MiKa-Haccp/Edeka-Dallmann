import { AppLayout } from "@/components/layout/AppLayout";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

export default function WareStreckenBestellung({ noLayout }: { noLayout?: boolean } = {}) {
  const Wrap = noLayout
    ? ({ children }: { children: ReactNode }) => <>{children}</>
    : ({ children }: { children: ReactNode }) => <AppLayout>{children}</AppLayout>;

  return (
    <Wrap>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-border/60 p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-sm font-semibold text-muted-foreground">Dieser Bereich wird demnächst eingerichtet.</p>
        </div>
      </div>
    </Wrap>
  );
}
