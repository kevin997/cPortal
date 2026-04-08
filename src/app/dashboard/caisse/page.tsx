"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  MinusCircle,
  Settings as SettingsIcon,
  LayoutDashboard,
  History,
  Send,
  Trash2,
  Pencil,
  ChevronRight,
  TrendingUp,
  Target,
  Loader2,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CashOperationForm } from "@/components/CashOperationForm";
import { UpcomingPaymentForm } from "@/components/UpcomingPaymentForm";
import { toast } from "@/hooks/use-toast";

interface CashOperation {
  id: string;
  type: "in" | "out";
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface UpcomingPayment {
  id: string;
  beneficiaryName: string;
  beneficiaryType: "vendor" | "investor" | "partner" | "other";
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "cancelled";
  notes: string | null;
}

interface CashSettings {
  annualTarget: number;
  monthlyTarget: number;
  telegramBotToken: string | null;
  telegramChatId: string | null;
}

type Tab = "dashboard" | "upcoming" | "history" | "settings";

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBeneficiaryTypeLabel(type: UpcomingPayment["beneficiaryType"]) {
  switch (type) {
    case "vendor":
      return "Fournisseur";
    case "investor":
      return "Investisseur";
    case "partner":
      return "Partenaire";
    default:
      return "Autre";
  }
}

function getStatusBadgeVariant(status: UpcomingPayment["status"]) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
}

function getDayDiff(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function getDueLabel(iso: string) {
  const diff = getDayDiff(iso);
  if (diff < 0) return `En retard de ${Math.abs(diff)} j`;
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return `Dans ${diff} j`;
}

export default function CaissePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [operations, setOperations] = useState<CashOperation[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [settings, setSettings] = useState<CashSettings | null>(null);
  const [loadingOps, setLoadingOps] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [upcomingFormOpen, setUpcomingFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"in" | "out">("in");
  const [editingOperation, setEditingOperation] = useState<CashOperation | null>(null);
  const [editingPayment, setEditingPayment] = useState<UpcomingPayment | null>(null);

  const todayStr = () => new Date().toISOString().slice(0, 10);
  const monthStartStr = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  };
  const [reportFrom, setReportFrom] = useState(monthStartStr);
  const [reportTo, setReportTo] = useState(todayStr);

  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyType, setHistoryType] = useState<"all" | "in" | "out">("all");

  const [upcomingStatus, setUpcomingStatus] = useState<"all" | "pending" | "paid" | "cancelled">("all");

  const [annualTarget, setAnnualTarget] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const fetchOperations = async () => {
    try {
      const res = await fetch("/api/caisse/operations");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOperations(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les operations", variant: "destructive" });
    } finally {
      setLoadingOps(false);
    }
  };

  const fetchUpcomingPayments = async () => {
    try {
      const res = await fetch("/api/caisse/upcoming-payments");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUpcomingPayments(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les paiements a venir", variant: "destructive" });
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/caisse/settings");
      if (!res.ok) throw new Error("Failed");
      const data: CashSettings = await res.json();
      setSettings(data);
      setAnnualTarget(String(data.annualTarget));
      setMonthlyTarget(String(data.monthlyTarget));
      setBotToken(data.telegramBotToken ?? "");
      setChatId(data.telegramChatId ?? "");
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les parametres", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchOperations();
    fetchUpcomingPayments();
    fetchSettings();
  }, []);

  const saveSetting = async (field: string, value: string | number | null) => {
    try {
      const res = await fetch("/api/caisse/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
      const data: CashSettings = await res.json();
      setSettings(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette operation ?")) return;
    try {
      const res = await fetch(`/api/caisse/operations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Supprimee", variant: "success" });
      setOperations((prev) => prev.filter((op) => op.id !== id));
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const handleDeleteUpcomingPayment = async (id: string) => {
    if (!confirm("Supprimer ce paiement a venir ?")) return;
    try {
      const res = await fetch(`/api/caisse/upcoming-payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Paiement supprime", variant: "success" });
      setUpcomingPayments((prev) => prev.filter((payment) => payment.id !== id));
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const handlePaymentStatus = async (
    id: string,
    status: UpcomingPayment["status"]
  ) => {
    try {
      const res = await fetch(`/api/caisse/upcoming-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: UpcomingPayment = await res.json();
      setUpcomingPayments((prev) =>
        prev.map((payment) => (payment.id === id ? updated : payment))
      );
      toast({
        title:
          status === "paid"
            ? "Paiement marque comme paye"
            : status === "cancelled"
              ? "Paiement annule"
              : "Paiement reactive",
        variant: "success",
      });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre a jour le paiement", variant: "destructive" });
    }
  };

  const handleSendReport = async () => {
    if (!settings?.telegramBotToken || !settings?.telegramChatId) {
      toast({ title: "Configuration manquante", description: "Configurez le Bot Token et Chat ID dans Parametres", variant: "destructive" });
      return;
    }
    setSendingReport(true);
    try {
      const from = new Date(reportFrom);
      const to = new Date(reportTo);
      to.setHours(23, 59, 59, 999);

      const periodLabel = `${from.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} - ${to.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

      const startYear = new Date(from.getFullYear(), 0, 1);

      const yearIn = operations
        .filter((op) => op.type === "in" && new Date(op.date) >= startYear)
        .reduce((s, op) => s + op.amount, 0);
      const periodIn = operations
        .filter((op) => op.type === "in" && new Date(op.date) >= from && new Date(op.date) <= to)
        .reduce((s, op) => s + op.amount, 0);
      const periodOut = operations
        .filter((op) => op.type === "out" && new Date(op.date) >= from && new Date(op.date) <= to)
        .reduce((s, op) => s + op.amount, 0);
      const pendingTotal = upcomingPayments
        .filter((payment) => payment.status === "pending")
        .reduce((sum, payment) => sum + payment.amount, 0);
      const rate = settings.monthlyTarget ? ((periodIn / settings.monthlyTarget) * 100).toFixed(1) : "0";

      const message =
        `*Rapport Caisse - ${periodLabel}*\n\n` +
        `• CA annuel vise : ${fmt(settings.annualTarget)} FCFA\n` +
        `• CA cumule (${from.getFullYear()}) : ${fmt(yearIn)} FCFA\n` +
        `• Objectif mensuel : ${fmt(settings.monthlyTarget)} FCFA\n` +
        `• Entrees (periode) : ${fmt(periodIn)} FCFA\n` +
        `• Sorties (periode) : ${fmt(periodOut)} FCFA\n` +
        `• Solde net (periode) : ${fmt(periodIn - periodOut)} FCFA\n` +
        `• Paiements a venir : ${fmt(pendingTotal)} FCFA\n` +
        `• Taux de realisation : ${rate}%`;

      const res = await fetch("/api/caisse/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          message,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Rapport envoye", description: "Message Telegram envoye avec succes", variant: "success" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le rapport", variant: "destructive" });
    } finally {
      setSendingReport(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);

    const yearIn = operations
      .filter((op) => op.type === "in" && new Date(op.date) >= startYear)
      .reduce((s, op) => s + op.amount, 0);
    const monthIn = operations
      .filter((op) => op.type === "in" && new Date(op.date) >= startMonth)
      .reduce((s, op) => s + op.amount, 0);
    const rate = settings?.monthlyTarget ? (monthIn / settings.monthlyTarget) * 100 : 0;

    const pendingPayments = upcomingPayments.filter((payment) => payment.status === "pending");
    const pendingTotal = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const dueSoonCount = pendingPayments.filter((payment) => getDayDiff(payment.dueDate) <= 7).length;

    return { yearIn, monthIn, rate, pendingTotal, dueSoonCount };
  }, [operations, upcomingPayments, settings]);

  const filteredOps = useMemo(() => {
    return operations.filter((op) => {
      if (historyType !== "all" && op.type !== historyType) return false;
      const d = new Date(op.date);
      if (historyFrom && d < new Date(historyFrom)) return false;
      if (historyTo) {
        const to = new Date(historyTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [operations, historyFrom, historyTo, historyType]);

  const historyTotals = useMemo(() => {
    const totalIn = filteredOps.filter((op) => op.type === "in").reduce((s, op) => s + op.amount, 0);
    const totalOut = filteredOps.filter((op) => op.type === "out").reduce((s, op) => s + op.amount, 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filteredOps]);

  const filteredUpcomingPayments = useMemo(() => {
    return upcomingPayments.filter((payment) => {
      if (upcomingStatus !== "all" && payment.status !== upcomingStatus) return false;
      return true;
    });
  }, [upcomingPayments, upcomingStatus]);

  const openForm = (type: "in" | "out") => {
    setEditingOperation(null);
    setDefaultType(type);
    setFormOpen(true);
  };

  const openEditOperation = (op: CashOperation) => {
    setEditingOperation(op);
    setDefaultType(op.type);
    setFormOpen(true);
  };

  const openEditPayment = (payment: UpcomingPayment) => {
    setEditingPayment(payment);
    setUpcomingFormOpen(true);
  };

  const openNewPayment = () => {
    setEditingPayment(null);
    setUpcomingFormOpen(true);
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <TrendingUp className="h-6 w-6 text-primary" />
            Caisse
          </h2>
          <p className="text-sm text-muted-foreground">
            Suivi des entrees, sorties et paiements a venir
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={openNewPayment}>
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Paiement a venir</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => openForm("out")} className="border-rose-200 text-rose-600 hover:bg-rose-50">
            <MinusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Sortie</span>
          </Button>
          <Button size="sm" onClick={() => openForm("in")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Entree</span>
          </Button>
        </div>
      </div>

      <div className="flex border-b">
        {(["dashboard", "upcoming", "history", "settings"] as Tab[]).map((t) => {
          const icons = {
            dashboard: LayoutDashboard,
            upcoming: CalendarClock,
            history: History,
            settings: SettingsIcon,
          };
          const labels = {
            dashboard: "Dashboard",
            upcoming: "Paiements",
            history: "Historique",
            settings: "Parametres",
          };
          const Icon = icons[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="h-4 w-4" />
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <p className="mb-1 text-xs uppercase tracking-wider opacity-70">CA Mensuel</p>
                <p className="mb-4 text-3xl font-bold">
                  {fmt(stats.monthIn)} <span className="text-base font-normal opacity-70">FCFA</span>
                </p>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="opacity-70">Objectif : {fmt(settings?.monthlyTarget ?? 0)}</span>
                  <span className="font-semibold">{stats.rate.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${Math.min(stats.rate, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">CA Annuel Cumule</p>
                  <p className="text-2xl font-bold">
                    {fmt(stats.yearIn)} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                  </p>
                  {settings?.annualTarget && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      sur {fmt(settings.annualTarget)} vises ({((stats.yearIn / settings.annualTarget) * 100).toFixed(1)}%)
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Paiements a venir</p>
                  <p className="text-2xl font-bold">
                    {fmt(stats.pendingTotal)} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.dueSoonCount} paiement{stats.dueSoonCount !== 1 ? "s" : ""} a traiter sous 7 jours
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Landmark className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => openForm("in")}
              className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
            >
              <PlusCircle className="h-8 w-8" />
              Entree
            </button>
            <button
              onClick={() => openForm("out")}
              className="flex flex-col items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-5 font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
            >
              <MinusCircle className="h-8 w-8" />
              Sortie
            </button>
            <button
              onClick={openNewPayment}
              className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              <CalendarClock className="h-8 w-8" />
              Paiement a venir
            </button>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Send className="h-4 w-4 text-muted-foreground" />
                Rapport Telegram
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="reportFrom" className="text-xs">Du</Label>
                  <Input
                    id="reportFrom"
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reportTo" className="text-xs">Au</Label>
                  <Input
                    id="reportTo"
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleSendReport} disabled={sendingReport || !reportFrom || !reportTo}>
                {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer le rapport
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Opérations recentes</h3>
                <button
                  onClick={() => setTab("history")}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Voir tout <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {loadingOps ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-16 p-4" />
                    </Card>
                  ))}
                </div>
              ) : operations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Aucune operation. Ajoutez une entree ou sortie.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {operations.slice(0, 5).map((op) => (
                    <Card key={op.id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${op.type === "in"
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                              }`}
                          >
                            {op.type === "in" ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{op.category}</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(op.date)}</p>
                            {op.description && <p className="text-xs text-muted-foreground">{op.description}</p>}
                          </div>
                        </div>
                        <p className={`text-sm font-bold ${op.type === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                          {op.type === "in" ? "+" : "-"}
                          {fmt(op.amount)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Paiements a venir</h3>
                <button
                  onClick={() => setTab("upcoming")}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Voir tout <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {loadingPayments ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-24 p-4" />
                    </Card>
                  ))}
                </div>
              ) : upcomingPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Aucun paiement planifie.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {upcomingPayments.slice(0, 5).map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <p className="text-sm font-medium">{payment.beneficiaryName}</p>
                              <Badge variant="outline">{getBeneficiaryTypeLabel(payment.beneficiaryType)}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Echeance le {fmtDateOnly(payment.dueDate)} • {getDueLabel(payment.dueDate)}
                            </p>
                            {payment.notes && <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-700">{fmt(payment.amount)} FCFA</p>
                            <Badge variant={getStatusBadgeVariant(payment.status)}>
                              {payment.status === "pending" ? "En attente" : payment.status === "paid" ? "Paye" : "Annule"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "upcoming" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "paid", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setUpcomingStatus(status)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${upcomingStatus === status
                    ? status === "pending"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : status === "paid"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : status === "cancelled"
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                  }`}
              >
                {status === "all"
                  ? "Tout"
                  : status === "pending"
                    ? "En attente"
                    : status === "paid"
                      ? "Payes"
                      : "Annules"}
              </button>
            ))}
          </div>

          {!loadingPayments && filteredUpcomingPayments.length > 0 && (
            <div className="grid gap-2 text-center text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="font-bold text-amber-700">
                  {fmt(filteredUpcomingPayments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-muted-foreground">Payes</p>
                <p className="font-bold text-emerald-600">
                  {fmt(filteredUpcomingPayments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted">
                <p className="text-xs text-muted-foreground">Total affiche</p>
                <p className="font-bold">
                  {fmt(filteredUpcomingPayments.reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filteredUpcomingPayments.length} paiement{filteredUpcomingPayments.length !== 1 ? "s" : ""}
          </p>

          {loadingPayments ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24 p-4" />
                </Card>
              ))}
            </div>
          ) : filteredUpcomingPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {upcomingPayments.length === 0
                  ? "Aucun paiement a venir enregistre."
                  : "Aucun paiement pour ce filtre."}
              </CardContent>
            </Card>
          ) : (
            filteredUpcomingPayments.map((payment) => (
              <Card key={payment.id} className="group">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{payment.beneficiaryName}</p>
                        <Badge variant="outline">{getBeneficiaryTypeLabel(payment.beneficiaryType)}</Badge>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status === "pending" ? "En attente" : payment.status === "paid" ? "Paye" : "Annule"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Echeance le {fmtDateOnly(payment.dueDate)} • {getDueLabel(payment.dueDate)}
                      </p>
                      {payment.notes && <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-amber-700">{fmt(payment.amount)} FCFA</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {payment.status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => handlePaymentStatus(payment.id, "paid")}>
                        <CheckCircle2 className="h-4 w-4" />
                        Marquer paye
                      </Button>
                    )}
                    {payment.status !== "cancelled" && (
                      <Button size="sm" variant="outline" onClick={() => handlePaymentStatus(payment.id, "cancelled")}>
                        <XCircle className="h-4 w-4" />
                        Annuler
                      </Button>
                    )}
                    {payment.status !== "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handlePaymentStatus(payment.id, "pending")}>
                        <CalendarClock className="h-4 w-4" />
                        Remettre en attente
                      </Button>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => openEditPayment(payment)}
                      className="hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDeleteUpcomingPayment(payment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="hFrom" className="text-xs text-muted-foreground">Du</Label>
              <Input
                id="hFrom"
                type="date"
                value={historyFrom}
                onChange={(e) => setHistoryFrom(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hTo" className="text-xs text-muted-foreground">Au</Label>
              <Input
                id="hTo"
                type="date"
                value={historyTo}
                onChange={(e) => setHistoryTo(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "in", "out"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setHistoryType(t)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${historyType === t
                      ? t === "in"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : t === "out"
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                >
                  {t === "all" ? "Tout" : t === "in" ? "+ Entrees" : "- Sorties"}
                </button>
              ))}
            </div>
            {(historyFrom || historyTo || historyType !== "all") && (
              <button
                onClick={() => {
                  setHistoryFrom("");
                  setHistoryTo("");
                  setHistoryType("all");
                }}
                className="self-end pb-1.5 text-xs text-muted-foreground underline hover:text-foreground"
              >
                Reinitialiser
              </button>
            )}
          </div>

          {!loadingOps && filteredOps.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="mb-0.5 text-xs text-muted-foreground">Entrees</p>
                <p className="font-bold text-emerald-600">+{fmt(historyTotals.totalIn)}</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 dark:border-rose-800 dark:bg-rose-950/30">
                <p className="mb-0.5 text-xs text-muted-foreground">Sorties</p>
                <p className="font-bold text-rose-600">-{fmt(historyTotals.totalOut)}</p>
              </div>
              <div className="rounded-lg border bg-muted p-2">
                <p className="mb-0.5 text-xs text-muted-foreground">Net</p>
                <p className={`font-bold ${historyTotals.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {historyTotals.net >= 0 ? "+" : ""}
                  {fmt(historyTotals.net)}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filteredOps.length} operation{filteredOps.length !== 1 ? "s" : ""}
          </p>

          {loadingOps ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-16 p-4" />
                </Card>
              ))}
            </div>
          ) : filteredOps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {operations.length === 0
                  ? "Aucune operation enregistree."
                  : "Aucune operation pour ces filtres."}
              </CardContent>
            </Card>
          ) : (
            filteredOps.map((op) => (
              <Card key={op.id} className="group">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${op.type === "in"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                        }`}
                    >
                      {op.type === "in" ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{op.category}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(op.date)}</p>
                      {op.description && (
                        <p className="max-w-[200px] truncate text-xs text-muted-foreground">{op.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className={`text-sm font-bold ${op.type === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                      {op.type === "in" ? "+" : "-"}
                      {fmt(op.amount)}
                    </p>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => openEditOperation(op)}
                      className="opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(op.id)}
                      className="text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="max-w-lg space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objectifs CA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="annualTarget">CA Annuel Vise (FCFA)</Label>
                <Input
                  id="annualTarget"
                  type="number"
                  value={annualTarget}
                  onChange={(e) => setAnnualTarget(e.target.value)}
                  onBlur={(e) => saveSetting("annualTarget", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyTarget">CA Mensuel Cible (FCFA)</Label>
                <Input
                  id="monthlyTarget"
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  onBlur={(e) => saveSetting("monthlyTarget", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4" />
                Telegram Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="123456789:ABCdef..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  onBlur={(e) => saveSetting("telegramBotToken", e.target.value || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chatId">Chat ID</Label>
                <Input
                  id="chatId"
                  type="text"
                  placeholder="-100123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  onBlur={(e) => saveSetting("telegramChatId", e.target.value || null)}
                />
              </div>
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Creez un bot via <strong>@BotFather</strong> et obtenez votre Chat ID via <strong>@userinfobot</strong>.
                Les parametres sont sauvegardes automatiquement.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <CashOperationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingOperation(null);
        }}
        defaultType={defaultType}
        editData={editingOperation}
        onSuccess={fetchOperations}
      />

      <UpcomingPaymentForm
        open={upcomingFormOpen}
        onOpenChange={(open) => {
          setUpcomingFormOpen(open);
          if (!open) setEditingPayment(null);
        }}
        editData={editingPayment}
        onSuccess={fetchUpcomingPayments}
      />
    </div>
  );
}
