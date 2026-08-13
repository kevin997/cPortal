"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Users,
  Calendar,
  UserPlus,
  LogOut,
  Gift,
  Menu,
  X,
  Target,
  TrendingUp,
  Palette,
  UserCog,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  canManageCollaborators,
  hasCaisseAccess,
  hasContentCreationAccess,
  hasMarketingAccess,
} from "@/lib/access";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Accueil" },
  { href: "/dashboard/students", icon: Users, label: "Étudiants" },
  { href: "/dashboard/bootcamps", icon: Calendar, label: "Sessions" },
  { href: "/dashboard/enrollments", icon: UserPlus, label: "Inscriptions" },
];

function isActiveRoute(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = session?.user?.role;

  const moreNavItems = [
    { href: "/dashboard/promotions", icon: Gift, label: "Promotions" },
    { href: "/dashboard/leads", icon: Target, label: "Prospects" },
    ...(hasContentCreationAccess(role)
      ? [{ href: "/dashboard/creation-contenu", icon: Palette, label: "Création" }]
      : []),
    ...(hasContentCreationAccess(role)
      ? [{ href: "/dashboard/social-media-calendar", icon: CalendarDays, label: "Calendrier social" }]
      : []),
    ...(hasCaisseAccess(role)
      ? [{ href: "/dashboard/caisse", icon: TrendingUp, label: "Caisse" }]
      : []),
    ...(hasMarketingAccess(role)
      ? [{ href: "/dashboard/marketing", icon: Megaphone, label: "Marketing" }]
      : []),
    ...(canManageCollaborators(role)
      ? [{ href: "/dashboard/collaborators", icon: UserCog, label: "Équipe" }]
      : []),
  ];

  const isMoreActive = moreNavItems.some((item) => isActiveRoute(pathname, item.href));

  return (
    <>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b safe-area-inset-top">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo-c-portal.svg"
              alt="cPortal"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={cn(
          "fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 max-h-[min(68vh,34rem)] overflow-y-auto rounded-2xl border bg-card shadow-2xl transition-transform duration-200 ease-out sm:left-auto sm:w-80",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-2">
          {moreNavItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="max-w-full truncate px-1 text-[10px] font-medium sm:text-xs">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isMoreActive || menuOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] font-medium sm:text-xs">Plus</span>
          </button>
        </div>
      </nav>
    </>
  );
}
