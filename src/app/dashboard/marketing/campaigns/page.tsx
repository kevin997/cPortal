"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Ban,
  Calendar as CalendarIcon,
  Loader2,
  MessageSquare,
  Pause,
  Plus,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  cancelCampaign,
  createCampaign,
  getCampaign,
  getCampaigns,
  getCampaignSends,
  pauseCampaign,
  previewCampaign,
  retryFailedCampaignSends,
  sendCampaignNow,
  Campaign,
  CampaignPreview,
  CampaignSend,
  CampaignStatus,
  JOURNEY_STAGES,
  JourneyStage,
  STAGE_LABELS,
} from "@/lib/marketing-api";

const STATUS_BADGE: Record<CampaignStatus, { className: string; label: string }> = {
  draft: { className: "bg-gray-500/10 text-gray-600 border-gray-200", label: "Brouillon" },
  scheduled: {
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
    label: "Planifiée",
  },
  running: {
    className: "bg-green-500/10 text-green-600 border-green-200",
    label: "En cours",
  },
  paused: {
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    label: "En pause",
  },
  done: {
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
    label: "Terminée",
  },
  cancelled: {
    className: "bg-slate-500/10 text-slate-600 border-slate-200",
    label: "Annulée",
  },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const variant = STATUS_BADGE[status];
  return <Badge className={variant.className}>{variant.label}</Badge>;
}

const emptyForm = {
  name: "",
  messageFr: "",
  messageEn: "",
  stages: [] as JourneyStage[],
  products: "",
  countries: "",
  inactiveDays: "",
  scheduleMode: "now" as "now" | "later",
  scheduledAt: "",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCampaignData, setPreviewCampaignData] = useState<Campaign | null>(
    null
  );
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [sends, setSends] = useState<CampaignSend[]>([]);
  const [sendsTotal, setSendsTotal] = useState(0);
  const [sendsStatus, setSendsStatus] = useState("all");
  const [sendsLoading, setSendsLoading] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [campaignAction, setCampaignAction] = useState<"cancel" | "retry" | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de charger les campagnes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const toggleStage = (stage: JourneyStage) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    }));
  };

  const resetForm = () => setForm(emptyForm);

  const handleCreate = async () => {
    if (!form.name || !form.messageFr) {
      toast({
        title: "Champs requis",
        description: "Le nom et le message (FR) sont obligatoires",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    try {
      const campaign = await createCampaign({
        name: form.name,
        message_fr: form.messageFr,
        message_en: form.messageEn || undefined,
        audience: {
          stages: form.stages,
          products: form.products
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          countries: form.countries
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          sources: [],
          inactive_days: form.inactiveDays ? Number(form.inactiveDays) : null,
        },
        scheduled_at:
          form.scheduleMode === "later" && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : null,
      });

      setCreateOpen(false);
      resetForm();
      fetchCampaigns();

      // Open preview so the user can confirm before anything is sent
      setPreviewCampaignData(campaign);
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreview(null);
      try {
        const previewData = await previewCampaign(campaign.id);
        setPreview(previewData);
      } catch (error) {
        toast({
          title: "Erreur",
          description:
            error instanceof Error
              ? error.message
              : "Impossible de charger l'aperçu de l'audience",
          variant: "destructive",
        });
      } finally {
        setPreviewLoading(false);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de créer la campagne",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!previewCampaignData) return;
    setConfirming(true);
    try {
      await sendCampaignNow(previewCampaignData.id);
      if (previewCampaignData.scheduled_at) {
        toast({
          title: "Campagne planifiée",
          description: "La campagne partira automatiquement à la date prévue",
          variant: "success",
        });
      } else {
        toast({
          title: "Envoi lancé",
          description: "La campagne WhatsApp est en cours d'envoi",
          variant: "success",
        });
      }
      setPreviewOpen(false);
      fetchCampaigns();
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de lancer l'envoi",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const fetchSends = useCallback(
    async (campaignId: string, status: string) => {
      setSendsLoading(true);
      try {
        const data = await getCampaignSends(campaignId, {
          status: status !== "all" ? status : undefined,
        });
        setSends(data.items);
        setSendsTotal(data.total);
      } catch (error) {
        console.error("Error fetching campaign sends:", error);
      } finally {
        setSendsLoading(false);
      }
    },
    []
  );

  const openDetail = async (campaign: Campaign) => {
    setDetailOpen(true);
    setSendsStatus("all");
    try {
      const fresh = await getCampaign(campaign.id);
      setDetailCampaign(fresh);
      fetchSends(fresh.id, "all");
    } catch (error) {
      setDetailCampaign(campaign);
      fetchSends(campaign.id, "all");
    }
  };

  const handlePause = async () => {
    if (!detailCampaign) return;
    setPausing(true);
    try {
      const updated = await pauseCampaign(detailCampaign.id);
      setDetailCampaign(updated);
      fetchCampaigns();
      toast({
        title: "Campagne mise en pause",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de mettre en pause",
        variant: "destructive",
      });
    } finally {
      setPausing(false);
    }
  };

  const handleCancel = async () => {
    if (!detailCampaign) return;
    setCampaignAction("cancel");
    try {
      const updated = await cancelCampaign(detailCampaign.id);
      setDetailCampaign(updated);
      await fetchCampaigns();
      toast({ title: "Campagne annulée", variant: "success" });
    } catch (error) {
      toast({
        title: "Annulation impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setCampaignAction(null);
    }
  };

  const handleRetryFailed = async () => {
    if (!detailCampaign) return;
    setCampaignAction("retry");
    try {
      const updated = await retryFailedCampaignSends(detailCampaign.id);
      setDetailCampaign(updated);
      await fetchCampaigns();
      await fetchSends(updated.id, "all");
      toast({ title: "Nouvelle tentative programmée", variant: "success" });
    } catch (error) {
      toast({
        title: "Nouvelle tentative impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setCampaignAction(null);
    }
  };

  const audienceSummary = (campaign: Campaign) => {
    const parts: string[] = [];
    // A campaign sent from the messagerie screen is stored with audience={},
    // so every one of these is absent -- and this runs inside campaigns.map(),
    // so a single such row took down the whole list rather than degrading to
    // "Tous les leads", which is exactly what an empty audience means.
    const audience = campaign.audience ?? {};
    const stages = audience.stages ?? [];
    const products = audience.products ?? [];
    const countries = audience.countries ?? [];

    if (stages.length) {
      parts.push(stages.map((s) => STAGE_LABELS[s]).join(", "));
    }
    if (products.length) {
      parts.push(products.join(", "));
    }
    if (countries.length) {
      parts.push(countries.join(", "));
    }
    if (audience.inactive_days) {
      parts.push(`inactifs ${audience.inactive_days}j+`);
    }
    return parts.length ? parts.join(" · ") : "Tous les leads";
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campagnes WhatsApp</h2>
          <p className="text-muted-foreground">
            Créez et suivez vos campagnes de relance par WhatsApp
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune campagne pour le moment
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openDetail(campaign)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{campaign.name}</p>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {audienceSummary(campaign)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      Envoyés : {campaign.stats.sent}
                    </span>
                    <span className="text-destructive">
                      Échecs : {campaign.stats.failed}
                    </span>
                    {campaign.scheduled_at && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(campaign.scheduled_at), "d MMM HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create campaign dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne</DialogTitle>
            <DialogDescription>
              Rédigez le message et définissez l&apos;audience ciblée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nom de la campagne</Label>
              <Input
                id="campaign-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Relance prospects inactifs — Juillet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-fr">Message (FR)</Label>
              <Textarea
                id="message-fr"
                value={form.messageFr}
                onChange={(e) => setForm((f) => ({ ...f, messageFr: e.target.value }))}
                rows={4}
                placeholder="Bonjour {name}, votre intérêt pour {product} nous tient à coeur..."
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles : {"{name}"}, {"{product}"}, {"{city}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-en">Message (EN) — optionnel</Label>
              <Textarea
                id="message-en"
                value={form.messageEn}
                onChange={(e) => setForm((f) => ({ ...f, messageEn: e.target.value }))}
                rows={3}
                placeholder="Hi {name}, ..."
              />
            </div>

            <div className="space-y-2">
              <Label>Étapes ciblées</Label>
              <div className="flex flex-wrap gap-2">
                {JOURNEY_STAGES.map((stage) => (
                  <label
                    key={stage}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                      form.stages.includes(stage)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Checkbox
                      checked={form.stages.includes(stage)}
                      onCheckedChange={() => toggleStage(stage)}
                    />
                    {STAGE_LABELS[stage]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="products">Produits / Services (séparés par virgule)</Label>
                <Input
                  id="products"
                  value={form.products}
                  onChange={(e) => setForm((f) => ({ ...f, products: e.target.value }))}
                  placeholder="Bootcamp Data, Bootcamp Web"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countries">Pays (séparés par virgule)</Label>
                <Input
                  id="countries"
                  value={form.countries}
                  onChange={(e) => setForm((f) => ({ ...f, countries: e.target.value }))}
                  placeholder="Cameroun, Gabon"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inactive-days">Inactivité (jours)</Label>
              <Input
                id="inactive-days"
                type="number"
                min={0}
                value={form.inactiveDays}
                onChange={(e) => setForm((f) => ({ ...f, inactiveDays: e.target.value }))}
                placeholder="Ex: 14"
              />
            </div>

            <div className="space-y-2">
              <Label>Envoi</Label>
              <Select
                value={form.scheduleMode}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, scheduleMode: value as "now" | "later" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Maintenant</SelectItem>
                  <SelectItem value="later">Programmer une date</SelectItem>
                </SelectContent>
              </Select>
              {form.scheduleMode === "later" && (
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview / confirm dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aperçu de l&apos;audience</DialogTitle>
            <DialogDescription>
              Vérifiez l&apos;audience ciblée avant de confirmer l&apos;envoi
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="w-5 h-5 text-primary" />
                {preview?.audience_count ?? 0} destinataire(s)
              </div>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-950">
                WhatsApp Wachap n&apos;a pas de quota quotidien. Les contacts désabonnés sont exclus et les messages sont espacés automatiquement.
              </p>
              {!!preview?.sample.length && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Échantillon</p>
                  <div className="rounded-md border divide-y">
                    {preview.sample.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.phone_masked}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewCampaignData?.scheduled_at && (
                <p className="text-sm text-muted-foreground">
                  Départ prévu le{" "}
                  {format(
                    new Date(previewCampaignData.scheduled_at),
                    "d MMM yyyy 'à' HH:mm",
                    { locale: fr }
                  )}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="w-full">
              Annuler
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={confirming || previewLoading || !preview?.audience_count}
              className="w-full"
            >
              {confirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Programmer l&apos;envoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {detailCampaign.name}
                  <StatusBadge status={detailCampaign.status} />
                </DialogTitle>
                <DialogDescription>{detailCampaign.message_fr}</DialogDescription>
              </DialogHeader>

              {detailCampaign.delivery_mode === "native" && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Pilotage Wachap natif</span>
                    <Badge variant="outline">
                      {detailCampaign.remote_status || "en préparation"}
                    </Badge>
                  </div>
                  {detailCampaign.remote_error && (
                    <p className="mt-2 text-destructive">{detailCampaign.remote_error}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-green-600">
                    {detailCampaign.stats.sent}
                  </p>
                  <p className="text-xs text-muted-foreground">Envoyés</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-destructive">
                    {detailCampaign.stats.failed}
                  </p>
                  <p className="text-xs text-muted-foreground">Échecs</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-muted-foreground">
                    {detailCampaign.stats.skipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Ignorés</p>
                </div>
              </div>

              {detailCampaign.status === "running" && (
                <Button
                  variant="outline"
                  onClick={handlePause}
                  disabled={pausing}
                  className="w-full sm:w-auto"
                >
                  {pausing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  Mettre en pause
                </Button>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {detailCampaign.stats.failed > 0 && detailCampaign.status !== "running" && (
                  <Button
                    variant="outline"
                    onClick={handleRetryFailed}
                    disabled={campaignAction !== null}
                  >
                    {campaignAction === "retry" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Réessayer les échecs
                  </Button>
                )}
                {!['done', 'cancelled'].includes(detailCampaign.status) && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={handleCancel}
                    disabled={campaignAction !== null}
                  >
                    {campaignAction === "cancel" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                    Annuler la campagne
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Envois</Label>
                  <Select
                    value={sendsStatus}
                    onValueChange={(value) => {
                      setSendsStatus(value);
                      fetchSends(detailCampaign.id, value);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="sent">Envoyés</SelectItem>
                      <SelectItem value="failed">Échecs</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : sends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun envoi à afficher
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Détail</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sends.map((send) => (
                          <TableRow key={send.id}>
                            <TableCell>{send.lead_id}</TableCell>
                            <TableCell>{send.status}</TableCell>
                            <TableCell>
                              {send.sent_at
                                ? format(new Date(send.sent_at), "d MMM HH:mm", { locale: fr })
                                : "—"}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                              {send.error || send.wachap_message_id || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-xs text-muted-foreground mt-2">
                      {sendsTotal} envoi(s) au total
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
