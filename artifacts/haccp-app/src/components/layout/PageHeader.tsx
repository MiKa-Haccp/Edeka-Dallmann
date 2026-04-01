import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 sm:p-6 text-white shadow-lg min-h-[88px] flex flex-col justify-center",
        className,
      )}
    >
      <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-[0.07] pointer-events-none select-none hidden sm:block">
        <ShieldCheck className="w-48 h-48" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
