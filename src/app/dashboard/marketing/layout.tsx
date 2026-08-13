import type { ReactNode } from "react";
import { MarketingNavigation } from "@/components/marketing/marketing-navigation";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingNavigation />
      {children}
    </>
  );
}
