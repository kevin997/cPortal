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
  ClipboardList,
  Search,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CashOperationForm } from "@/components/CashOperationForm";
import { UpcomingPaymentForm } from "@/components/UpcomingPaymentForm";
import { CashForecastForm } from "@/components/CashForecastForm";
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
  status: PaymentStatus;
  notes: string | null;
}

type PaymentStatus = "pending" | "paid" | "partially_paid" | "overdue" | "cancelled";
type SheetRecordType = "operation" | "payment" | "forecast";

interface CashForecast {
  id: string;
  department: string;
  quantity: number;
  unitPrice: number;
  total: number;
  deadline: string;
  report: string | null;
}

interface CashSettings {
  annualTarget: number;
  monthlyTarget: number;
  telegramBotToken: string | null;
  telegramChatId: string | null;
}

type Tab = "dashboard" | "sheet" | "upcoming" | "forecasts" | "history" | "settings";

interface SheetRecord {
  id: string;
  recordType: SheetRecordType;
  kind: string;
  label: string;
  counterparty: string;
  amount: number;
  status: string;
  date: string;
  notes: string;
  searchText: string;
}

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
    case "partially_paid":
      return "default" as const;
    case "cancelled":
      return "destructive" as const;
    case "overdue":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
}

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paye";
    case "partially_paid":
      return "Partiellement paye";
    case "overdue":
      return "Retard";
    case "cancelled":
      return "Annule";
    default:
      return "En attente";
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
  const [forecasts, setForecasts] = useState<CashForecast[]>([]);
  const [settings, setSettings] = useState<CashSettings | null>(null);
  const [loadingOps, setLoadingOps] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingForecasts, setLoadingForecasts] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [upcomingFormOpen, setUpcomingFormOpen] = useState(false);
  const [forecastFormOpen, setForecastFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"in" | "out">("in");
  const [editingOperation, setEditingOperation] = useState<CashOperation | null>(null);
  const [editingPayment, setEditingPayment] = useState<UpcomingPayment | null>(null);
  const [editingForecast, setEditingForecast] = useState<CashForecast | null>(null);

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

  const [upcomingStatus, setUpcomingStatus] = useState<"all" | PaymentStatus>("all");
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetType, setSheetType] = useState<"all" | SheetRecordType>("all");

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

  const fetchForecasts = async () => {
    try {
      const res = await fetch("/api/caisse/forecasts");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setForecasts(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les previsions", variant: "destructive" });
    } finally {
      setLoadingForecasts(false);
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
    fetchForecasts();
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

  const handleDeleteForecast = async (id: string) => {
    if (!confirm("Supprimer cette prevision ?")) return;
    try {
      const res = await fetch(`/api/caisse/forecasts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Prevision supprimee", variant: "success" });
      setForecasts((prev) => prev.filter((forecast) => forecast.id !== id));
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
            : status === "partially_paid"
              ? "Paiement marque comme partiel"
              : status === "overdue"
                ? "Paiement marque en retard"
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
        .filter((payment) => payment.status === "pending" || payment.status === "overdue")
        .reduce((sum, payment) => sum + payment.amount, 0);
      const forecastTotal = forecasts.reduce((sum, forecast) => sum + forecast.total, 0);
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
        `• Previsions : ${fmt(forecastTotal)} FCFA\n` +
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

    const pendingPayments = upcomingPayments.filter((payment) => payment.status === "pending" || payment.status === "overdue");
    const pendingTotal = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const dueSoonCount = pendingPayments.filter((payment) => getDayDiff(payment.dueDate) <= 7).length;
    const forecastTotal = forecasts.reduce((sum, forecast) => sum + forecast.total, 0);

    return { yearIn, monthIn, rate, pendingTotal, dueSoonCount, forecastTotal };
  }, [operations, upcomingPayments, forecasts, settings]);

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

  const sheetRecords = useMemo<SheetRecord[]>(() => {
    const operationRecords = operations.map((op) => {
      const kind = op.type === "in" ? "Entrée" : "Sortie";
      const amount = op.type === "in" ? op.amount : -op.amount;
      const record: SheetRecord = {
        id: op.id,
        recordType: "operation",
        kind,
        label: op.category,
        counterparty: "-",
        amount,
        status: "Enregistré",
        date: op.date,
        notes: op.description || "",
        searchText: "",
      };
      record.searchText = [
        "operation",
        kind,
        op.category,
        op.description,
        fmt(op.amount),
        fmtDate(op.date),
      ].join(" ").toLowerCase();
      return record;
    });

    const paymentRecords = upcomingPayments.map((payment) => {
      const status = getPaymentStatusLabel(payment.status);
      const record: SheetRecord = {
        id: payment.id,
        recordType: "payment",
        kind: "Paiement",
        label: payment.beneficiaryName,
        counterparty: getBeneficiaryTypeLabel(payment.beneficiaryType),
        amount: payment.amount,
        status,
        date: payment.dueDate,
        notes: payment.notes || "",
        searchText: "",
      };
      record.searchText = [
        "paiement",
        payment.beneficiaryName,
        getBeneficiaryTypeLabel(payment.beneficiaryType),
        status,
        payment.notes,
        fmt(payment.amount),
        fmtDateOnly(payment.dueDate),
        getDueLabel(payment.dueDate),
      ].join(" ").toLowerCase();
      return record;
    });

    const forecastRecords = forecasts.map((forecast) => {
      const record: SheetRecord = {
        id: forecast.id,
        recordType: "forecast",
        kind: "Prévision",
        label: forecast.department,
        counterparty: `Qté ${forecast.quantity}`,
        amount: forecast.total,
        status: "Prévu",
        date: forecast.deadline,
        notes: forecast.report || "",
        searchText: "",
      };
      record.searchText = [
        "prevision",
        "prévision",
        forecast.department,
        forecast.quantity,
        forecast.unitPrice,
        forecast.total,
        forecast.report,
        fmtDateOnly(forecast.deadline),
        getDueLabel(forecast.deadline),
      ].join(" ").toLowerCase();
      return record;
    });

    return [...paymentRecords, ...operationRecords, ...forecastRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [operations, upcomingPayments, forecasts]);

  const filteredSheetRecords = useMemo(() => {
    const query = sheetSearch.trim().toLowerCase();
    return sheetRecords.filter((record) => {
      if (sheetType !== "all" && record.recordType !== sheetType) return false;
      if (query && !record.searchText.includes(query)) return false;
      return true;
    });
  }, [sheetRecords, sheetSearch, sheetType]);

  const sheetTotals = useMemo(() => {
    const income = filteredSheetRecords
      .filter((record) => record.recordType === "operation" && record.amount > 0)
      .reduce((sum, record) => sum + record.amount, 0);
    const expenses = filteredSheetRecords
      .filter((record) => record.recordType === "operation" && record.amount < 0)
      .reduce((sum, record) => sum + Math.abs(record.amount), 0);
    const payments = filteredSheetRecords
      .filter((record) => record.recordType === "payment")
      .reduce((sum, record) => sum + record.amount, 0);
    const forecastTotal = filteredSheetRecords
      .filter((record) => record.recordType === "forecast")
      .reduce((sum, record) => sum + record.amount, 0);
    return { income, expenses, payments, forecastTotal };
  }, [filteredSheetRecords]);

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

  const openEditForecast = (forecast: CashForecast) => {
    setEditingForecast(forecast);
    setForecastFormOpen(true);
  };

  const openNewForecast = () => {
    setEditingForecast(null);
    setForecastFormOpen(true);
  };

  const handleSheetRowEdit = (record: SheetRecord) => {
    if (record.recordType === "payment") {
      const payment = upcomingPayments.find((item) => item.id === record.id);
      if (payment) openEditPayment(payment);
      return;
    }
    if (record.recordType === "forecast") {
      const forecast = forecasts.find((item) => item.id === record.id);
      if (forecast) openEditForecast(forecast);
      return;
    }
    const operation = operations.find((item) => item.id === record.id);
    if (operation) openEditOperation(operation);
  };

  const handleSheetRowDelete = (record: SheetRecord) => {
    if (record.recordType === "payment") {
      handleDeleteUpcomingPayment(record.id);
      return;
    }
    if (record.recordType === "forecast") {
      handleDeleteForecast(record.id);
      return;
    }
    handleDelete(record.id);
  };

  const handleExportSheet = () => {
    const headers = ["Type", "Libelle", "Tiers", "Statut", "Date", "Montant", "Notes"];
    const rows = filteredSheetRecords.map((record) => [
      record.kind,
      record.label,
      record.counterparty,
      record.status,
      fmtDateOnly(record.date),
      String(record.amount),
      record.notes,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `caisse-tableur-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <Button size="sm" variant="outline" onClick={openNewForecast}>
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Prevision</span>
          </Button>
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
        {(["dashboard", "sheet", "upcoming", "forecasts", "history", "settings"] as Tab[]).map((t) => {
          const icons = {
            dashboard: LayoutDashboard,
            sheet: FileSpreadsheet,
            upcoming: CalendarClock,
            forecasts: ClipboardList,
            history: History,
            settings: SettingsIcon,
          };
          const labels = {
            dashboard: "Dashboard",
            sheet: "Tableur",
            upcoming: "Paiements",
            forecasts: "Previsions",
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

      {tab === "sheet" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_180px]">
                  <div className="space-y-1">
                    <Label htmlFor="sheetSearch" className="text-xs text-muted-foreground">
                      Recherche
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="sheetSearch"
                        value={sheetSearch}
                        onChange={(e) => setSheetSearch(e.target.value)}
                        placeholder="Rechercher bénéficiaire, catégorie, statut, montant..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="grid grid-cols-4 overflow-hidden rounded-md border">
                      {(["all", "payment", "operation", "forecast"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSheetType(type)}
                          className={`px-2 py-2 text-xs font-medium transition-colors ${sheetType === type
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent"
                            }`}
                        >
                          {type === "all"
                            ? "Tout"
                            : type === "payment"
                              ? "Pay."
                              : type === "operation"
                                ? "Ops"
                                : "Prév."}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(sheetSearch || sheetType !== "all") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSheetSearch("");
                        setSheetType("all");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportSheet}
                    disabled={filteredSheetRecords.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 text-center text-sm sm:grid-cols-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-muted-foreground">Entrées</p>
                  <p className="font-bold text-emerald-700">{fmt(sheetTotals.income)} FCFA</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs text-muted-foreground">Sorties</p>
                  <p className="font-bold text-rose-700">{fmt(sheetTotals.expenses)} FCFA</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-muted-foreground">Paiements</p>
                  <p className="font-bold text-amber-700">{fmt(sheetTotals.payments)} FCFA</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <p className="text-xs text-muted-foreground">Prévisions</p>
                  <p className="font-bold text-sky-700">{fmt(sheetTotals.forecastTotal)} FCFA</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {filteredSheetRecords.length} résultat{filteredSheetRecords.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Tiers</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSheetRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Aucun résultat pour ces filtres.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSheetRecords.map((record) => (
                      <TableRow key={`${record.recordType}-${record.id}`} className="h-12">
                        <TableCell>
                          <Badge
                            variant={
                              record.recordType === "payment"
                                ? "warning"
                                : record.recordType === "forecast"
                                  ? "default"
                                  : record.amount >= 0
                                    ? "success"
                                    : "destructive"
                            }
                          >
                            {record.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{record.label}</TableCell>
                        <TableCell className="text-muted-foreground">{record.counterparty}</TableCell>
                        <TableCell>{record.status}</TableCell>
                        <TableCell>{fmtDateOnly(record.date)}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${record.amount < 0 ? "text-rose-600" : record.recordType === "operation" ? "text-emerald-700" : ""
                            }`}
                        >
                          {record.amount < 0 ? "-" : ""}
                          {fmt(Math.abs(record.amount))} FCFA
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate text-muted-foreground">
                          {record.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => handleSheetRowEdit(record)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleSheetRowDelete(record)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Previsions</p>
                  <p className="text-2xl font-bold">
                    {fmt(stats.forecastTotal)} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {forecasts.length} ligne{forecasts.length !== 1 ? "s" : ""} planifiee{forecasts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <ClipboardList className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
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
            <button
              onClick={openNewForecast}
              className="flex flex-col items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-5 font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              <ClipboardList className="h-8 w-8" />
              Prevision
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
                              {getPaymentStatusLabel(payment.status)}
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
            {(["all", "pending", "partially_paid", "overdue", "paid", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setUpcomingStatus(status)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${upcomingStatus === status
                    ? status === "pending"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : status === "partially_paid"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : status === "overdue"
                          ? "border-red-700 bg-red-700 text-white"
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
                  : getPaymentStatusLabel(status)}
              </button>
            ))}
          </div>

          {!loadingPayments && filteredUpcomingPayments.length > 0 && (
            <div className="grid gap-2 text-center text-sm sm:grid-cols-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="font-bold text-amber-700">
                  {fmt(filteredUpcomingPayments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-muted-foreground">Partiels</p>
                <p className="font-bold text-blue-700">
                  {fmt(filteredUpcomingPayments.filter((payment) => payment.status === "partially_paid").reduce((sum, payment) => sum + payment.amount, 0))}
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
                          {getPaymentStatusLabel(payment.status)}
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
                    {payment.status !== "partially_paid" && (
                      <Button size="sm" variant="outline" onClick={() => handlePaymentStatus(payment.id, "partially_paid")}>
                        Partiel
                      </Button>
                    )}
                    {payment.status !== "overdue" && (
                      <Button size="sm" variant="outline" onClick={() => handlePaymentStatus(payment.id, "overdue")}>
                        Retard
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

      {tab === "forecasts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Gestion des previsions</h3>
              <p className="text-xs text-muted-foreground">
                Departement, qte, prix unitaire, total, delais et reports.
              </p>
            </div>
            <Button size="sm" onClick={openNewForecast}>
              <ClipboardList className="h-4 w-4" />
              Ajouter
            </Button>
          </div>

          {!loadingForecasts && forecasts.length > 0 && (
            <div className="grid gap-2 text-center text-sm sm:grid-cols-3">
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xs text-muted-foreground">Total previsionnel</p>
                <p className="font-bold">{fmt(forecasts.reduce((sum, forecast) => sum + forecast.total, 0))} FCFA</p>
              </div>
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xs text-muted-foreground">Departements</p>
                <p className="font-bold">{new Set(forecasts.map((forecast) => forecast.department)).size}</p>
              </div>
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xs text-muted-foreground">Lignes</p>
                <p className="font-bold">{forecasts.length}</p>
              </div>
            </div>
          )}

          {loadingForecasts ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24 p-4" />
                </Card>
              ))}
            </div>
          ) : forecasts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Aucune prevision enregistree.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {forecasts.map((forecast) => (
                <Card key={forecast.id} className="group">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{forecast.department}</p>
                          <Badge variant="outline">Qte {forecast.quantity}</Badge>
                          <Badge variant="outline">{fmt(forecast.unitPrice)} FCFA / unite</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Delai le {fmtDateOnly(forecast.deadline)} - {getDueLabel(forecast.deadline)}
                        </p>
                        {forecast.report && (
                          <p className="mt-1 max-w-xl text-xs text-muted-foreground">{forecast.report}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-sky-700">{fmt(forecast.total)} FCFA</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEditForecast(forecast)}
                        className="hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteForecast(forecast.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      <CashForecastForm
        open={forecastFormOpen}
        onOpenChange={(open) => {
          setForecastFormOpen(open);
          if (!open) setEditingForecast(null);
        }}
        editData={editingForecast}
        onSuccess={fetchForecasts}
      />
    </div>
  );
}
