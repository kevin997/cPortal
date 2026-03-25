"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PlusCircle,
  MinusCircle,
  Settings as SettingsIcon,
  LayoutDashboard,
  History,
  Send,
  Trash2,
  ChevronRight,
  TrendingUp,
  Target,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CashOperationForm } from "@/components/CashOperationForm";
import { toast } from "@/hooks/use-toast";

interface CashOperation {
  id: string;
  type: "in" | "out";
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface CashSettings {
  annualTarget: number;
  monthlyTarget: number;
  telegramBotToken: string | null;
  telegramChatId: string | null;
}

type Tab = "dashboard" | "history" | "settings";

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

export default function CaissePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [operations, setOperations] = useState<CashOperation[]>([]);
  const [settings, setSettings] = useState<CashSettings | null>(null);
  const [loadingOps, setLoadingOps] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"in" | "out">("in");

  // Report period — default: 1st of current month → today
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const monthStartStr = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  };
  const [reportFrom, setReportFrom] = useState(monthStartStr);
  const [reportTo, setReportTo] = useState(todayStr);

  // History filters
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyType, setHistoryType] = useState<"all" | "in" | "out">("all");

  // Settings field refs for blur-save
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
      toast({ title: "Erreur", description: "Impossible de charger les opérations", variant: "destructive" });
    } finally {
      setLoadingOps(false);
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
      toast({ title: "Erreur", description: "Impossible de charger les paramètres", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchOperations();
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
    if (!confirm("Supprimer cette opération ?")) return;
    try {
      const res = await fetch(`/api/caisse/operations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Supprimée", variant: "success" });
      setOperations((prev) => prev.filter((op) => op.id !== id));
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const handleSendReport = async () => {
    if (!settings?.telegramBotToken || !settings?.telegramChatId) {
      toast({ title: "Configuration manquante", description: "Configurez le Bot Token et Chat ID dans Paramètres", variant: "destructive" });
      return;
    }
    setSendingReport(true);
    try {
      const from = new Date(reportFrom);
      const to = new Date(reportTo);
      // set to end-of-day for the "to" date
      to.setHours(23, 59, 59, 999);

      const periodLabel = `${from.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} — ${to.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

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
      const rate = settings.monthlyTarget ? ((periodIn / settings.monthlyTarget) * 100).toFixed(1) : "0";

      const message =
        `*Rapport Caisse — ${periodLabel}*\n\n` +
        `• CA annuel visé : ${fmt(settings.annualTarget)} FCFA\n` +
        `• CA cumulé (${from.getFullYear()}) : ${fmt(yearIn)} FCFA\n` +
        `• Objectif mensuel : ${fmt(settings.monthlyTarget)} FCFA\n` +
        `• Entrées (période) : ${fmt(periodIn)} FCFA\n` +
        `• Sorties (période) : ${fmt(periodOut)} FCFA\n` +
        `• Solde net (période) : ${fmt(periodIn - periodOut)} FCFA\n` +
        `• Taux de réalisation : ${rate}%`;

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
      toast({ title: "Rapport envoyé", description: "Message Telegram envoyé avec succès", variant: "success" });
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

    return { yearIn, monthIn, rate };
  }, [operations, settings]);

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

  const openForm = (type: "in" | "out") => {
    setDefaultType(type);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Caisse
          </h2>
          <p className="text-muted-foreground text-sm">Suivi des entrées et sorties de caisse</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openForm("out")} className="text-rose-600 border-rose-200 hover:bg-rose-50">
            <MinusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Sortie</span>
          </Button>
          <Button size="sm" onClick={() => openForm("in")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Entrée</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        {(["dashboard", "history", "settings"] as Tab[]).map((t) => {
          const icons = { dashboard: LayoutDashboard, history: History, settings: SettingsIcon };
          const labels = { dashboard: "Dashboard", history: "Historique", settings: "Paramètres" };
          const Icon = icons[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Monthly CA */}
            <Card className="bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">CA Mensuel</p>
                <p className="text-3xl font-bold mb-4">{fmt(stats.monthIn)} <span className="text-base font-normal opacity-70">FCFA</span></p>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="opacity-70">Objectif : {fmt(settings?.monthlyTarget ?? 0)}</span>
                  <span className="font-semibold">{stats.rate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(stats.rate, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Annual CA */}
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">CA Annuel Cumulé</p>
                  <p className="text-2xl font-bold">{fmt(stats.yearIn)} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
                  {settings?.annualTarget && (
                    <p className="text-xs text-muted-foreground mt-1">
                      sur {fmt(settings.annualTarget)} visés ({((stats.yearIn / settings.annualTarget) * 100).toFixed(1)}%)
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => openForm("in")}
              className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col items-center gap-2 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <PlusCircle className="w-8 h-8" />
              Entrée
            </button>
            <button
              onClick={() => openForm("out")}
              className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 p-5 rounded-xl border border-rose-200 dark:border-rose-800 flex flex-col items-center gap-2 font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
            >
              <MinusCircle className="w-8 h-8" />
              Sortie
            </button>
          </div>

          {/* Telegram Report */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />
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
              <Button
                className="w-full"
                onClick={handleSendReport}
                disabled={sendingReport || !reportFrom || !reportTo}
              >
                {sendingReport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer le rapport
              </Button>
            </CardContent>
          </Card>

          {/* Recent Operations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Opérations récentes</h3>
              <button
                onClick={() => setTab("history")}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loadingOps ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 h-16" />
                  </Card>
                ))}
              </div>
            ) : operations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Aucune opération. Ajoutez une entrée ou sortie.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {operations.slice(0, 5).map((op) => (
                  <Card key={op.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            op.type === "in"
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                          }`}
                        >
                          {op.type === "in" ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{op.category}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(op.date)}</p>
                          {op.description && <p className="text-xs text-muted-foreground">{op.description}</p>}
                        </div>
                      </div>
                      <p className={`font-bold text-sm ${op.type === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                        {op.type === "in" ? "+" : "-"}{fmt(op.amount)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label htmlFor="hFrom" className="text-xs text-muted-foreground">Du</Label>
              <Input
                id="hFrom"
                type="date"
                value={historyFrom}
                onChange={(e) => setHistoryFrom(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hTo" className="text-xs text-muted-foreground">Au</Label>
              <Input
                id="hTo"
                type="date"
                value={historyTo}
                onChange={(e) => setHistoryTo(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "in", "out"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setHistoryType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    historyType === t
                      ? t === "in"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : t === "out"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t === "all" ? "Tout" : t === "in" ? "+ Entrées" : "− Sorties"}
                </button>
              ))}
            </div>
            {(historyFrom || historyTo || historyType !== "all") && (
              <button
                onClick={() => { setHistoryFrom(""); setHistoryTo(""); setHistoryType("all"); }}
                className="text-xs text-muted-foreground hover:text-foreground underline self-end pb-1.5"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Totals summary */}
          {!loadingOps && filteredOps.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-muted-foreground mb-0.5">Entrées</p>
                <p className="font-bold text-emerald-600">+{fmt(historyTotals.totalIn)}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2 border border-rose-200 dark:border-rose-800">
                <p className="text-xs text-muted-foreground mb-0.5">Sorties</p>
                <p className="font-bold text-rose-600">−{fmt(historyTotals.totalOut)}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 border">
                <p className="text-xs text-muted-foreground mb-0.5">Net</p>
                <p className={`font-bold ${historyTotals.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {historyTotals.net >= 0 ? "+" : ""}{fmt(historyTotals.net)}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{filteredOps.length} opération{filteredOps.length !== 1 ? "s" : ""}</p>

          {loadingOps ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-16" />
                </Card>
              ))}
            </div>
          ) : filteredOps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                {operations.length === 0
                  ? "Aucune opération enregistrée."
                  : "Aucune opération pour ces filtres."}
              </CardContent>
            </Card>
          ) : (
            filteredOps.map((op) => (
              <Card key={op.id} className="group">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        op.type === "in"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                      }`}
                    >
                      {op.type === "in" ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{op.category}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(op.date)}</p>
                      {op.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{op.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className={`font-bold text-sm ${op.type === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                      {op.type === "in" ? "+" : "−"}{fmt(op.amount)}
                    </p>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(op.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-lg">
          {/* Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objectifs CA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="annualTarget">CA Annuel Visé (FCFA)</Label>
                <Input
                  id="annualTarget"
                  type="number"
                  value={annualTarget}
                  onChange={(e) => setAnnualTarget(e.target.value)}
                  onBlur={(e) => saveSetting("annualTarget", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyTarget">CA Mensuel Ciblé (FCFA)</Label>
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

          {/* Telegram */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4" />
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
              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                Créez un bot via <strong>@BotFather</strong> et obtenez votre Chat ID via <strong>@userinfobot</strong>.
                Les paramètres sont sauvegardés automatiquement.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Operation Form Dialog */}
      <CashOperationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType={defaultType}
        onSuccess={fetchOperations}
      />
    </div>
  );
}
