"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ContactRound,
  Gem,
  FileUp,
  Megaphone,
  MessageSquareText,
  Puzzle,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MARKETING_ROOT = "/dashboard/marketing";

const sections = [
  { href: MARKETING_ROOT, label: "Vue d'ensemble", icon: BarChart3 },
  { href: `${MARKETING_ROOT}/leads`, label: "Contacts", icon: ContactRound },
  { href: `${MARKETING_ROOT}/eshu-crm-leads`, label: "Eshu CRM Leads", icon: Gem },
  { href: `${MARKETING_ROOT}/messagerie`, label: "Messagerie", icon: MessageSquareText },
  { href: `${MARKETING_ROOT}/campaigns`, label: "Campagnes", icon: Megaphone },
  { href: `${MARKETING_ROOT}/workflows`, label: "Workflows", icon: Workflow },
  { href: `${MARKETING_ROOT}/import`, label: "Import", icon: FileUp },
  { href: `${MARKETING_ROOT}/extension`, label: "Eshu CRM", icon: Puzzle },
] as const;

export function MarketingNavigation() {
  const pathname = usePathname();
  const isMarketingHome = pathname === MARKETING_ROOT;

  return (
    <div className="space-y-3 pt-4 sm:pt-6">
      <nav aria-label="Navigation marketing" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 rounded-xl border bg-muted/40 p-1">
          {sections.map(({ href, label, icon: Icon }) => {
            const active =
              href === MARKETING_ROOT ? isMarketingHome : pathname.startsWith(href);

            return (
              <Button
                key={href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "min-h-10 gap-2 px-3 text-muted-foreground",
                  active && "bg-background text-foreground shadow-sm hover:bg-background"
                )}
              >
                <Link href={href} aria-current={active ? "page" : undefined}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
