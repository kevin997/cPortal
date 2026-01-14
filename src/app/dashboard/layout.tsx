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

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <main className="pt-14 pb-16 px-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
