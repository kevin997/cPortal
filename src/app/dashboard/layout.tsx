import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MobileNav } from "@/components/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "referrer" && !session.user.twoFactorVerified) {
    redirect("/verify-2fa");
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <main className="mx-auto max-w-7xl px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-14 sm:px-5 lg:px-6">
        {children}
      </main>
    </div>
  );
}
