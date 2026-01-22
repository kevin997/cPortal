"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Users,
  Copy,
  Check,
  LogOut,
  Loader2,
  Gift,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  promotionName: string;
  rewardAmount: number;
  createdAt: string;
}

interface Stats {
  referralCode: string;
  walletBalance: number;
  totalLeads: number;
  statusCounts: {
    pending: number;
    contacted: number;
    converted: number;
    lost: number;
  };
  potentialEarnings: number;
  recentLeads: Lead[];
}

export default function ReferrerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/referral/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/referral/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else if (response.status === 401) {
          router.push("/referral/login");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchStats();
    }
  }, [status, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  const getReferralLink = () => {
    if (typeof window === "undefined" || !stats?.referralCode) return "";
    return `${window.location.origin}/r/${stats.referralCode}`;
  };

  const handleCopyLink = async () => {
    const link = getReferralLink();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-200", label: "En attente" },
      contacted: { className: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Contacté" },
      converted: { className: "bg-green-500/10 text-green-600 border-green-200", label: "Converti" },
      lost: { className: "bg-gray-500/10 text-gray-600 border-gray-200", label: "Perdu" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b safe-area-inset-top">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-primary">Mon Espace Affilié</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/referral" })}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-24">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold">Bonjour, {session?.user?.name}!</h2>
          <p className="text-muted-foreground">
            Voici un aperçu de vos performances de parrainage
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2">
          {/* Wallet Balance - The most prominent KPI */}
          <Card className="col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                <Wallet className="w-4 h-4" />
                Récompenses Accumulées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-bold tracking-tight">
                {formatCurrency(stats?.walletBalance || 0)}
                <span className="text-lg md:text-xl ml-1 font-normal opacity-90">XAF</span>
              </div>
              <p className="text-xs mt-2 opacity-80">
                Total des commissions gagnées
              </p>
            </CardContent>
          </Card>

          {/* Referred Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Filleuls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Personnes référées
              </p>
            </CardContent>
          </Card>

          {/* Converted */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gift className="w-4 h-4 text-muted-foreground" />
                Convertis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.statusCounts?.converted || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Inscriptions validées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Votre Lien de Parrainage</CardTitle>
            <CardDescription>
              Partagez ce lien avec vos contacts pour gagner des récompenses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={getReferralLink()}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const link = getReferralLink();
                  const text = `Rejoins cette formation et bénéficie d'une réduction ! ${link}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="flex-1 sm:flex-none"
              >
                Partager sur WhatsApp
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vos Filleuls Récents</CardTitle>
            <CardDescription>
              Liste des personnes que vous avez référées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentLeads && stats.recentLeads.length > 0 ? (
              <div className="space-y-3">
                {stats.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {getStatusBadge(lead.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  Aucun filleul pour le moment
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Partagez votre lien pour commencer à gagner
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        {stats && stats.totalLeads > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Résumé par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-yellow-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.statusCounts.pending}
                  </p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.statusCounts.contacted}
                  </p>
                  <p className="text-xs text-muted-foreground">Contactés</p>
                </div>
                <div className="text-center p-3 bg-green-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.statusCounts.converted}
                  </p>
                  <p className="text-xs text-muted-foreground">Convertis</p>
                </div>
                <div className="text-center p-3 bg-gray-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.statusCounts.lost}
                  </p>
                  <p className="text-xs text-muted-foreground">Perdus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
