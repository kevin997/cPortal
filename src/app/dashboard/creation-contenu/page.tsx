"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  CalendarClock,
  FileText,
  Lightbulb,
  Paperclip,
  PlusCircle,
  RefreshCw,
  Send,
  Sparkles,
  X,
  Megaphone,
} from "lucide-react";
import { CreativeAssetGallery, type CreativeAssetItem } from "@/components/CreativeAssetGallery";
import { CreativeDeliverableForm } from "@/components/CreativeDeliverableForm";
import { CreativeRequestForm } from "@/components/CreativeRequestForm";
import { RequestAssetUploadDialog } from "@/components/RequestAssetUploadDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { canSelectSocialMediaPlansForRequests } from "@/lib/access";
import {
  CREATIVE_DELIVERABLE_STATUSES,
  CREATIVE_REQUEST_STATUSES,
  getCollaboratorRoleLabel,
  getCreativeDeliverableStatusLabel,
  getCreativeRequestStatusLabel,
} from "@/lib/content";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Deliverable {
  id: string;
  title: string;
  platform: string | null;
  format: string | null;
  scheduledFor: string;
  status: string;
  notes: string | null;
  owner: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface CreativeRequest {
  id: string;
  reference: string;
  requesterName: string;
  requesterFunction: string | null;
  clientName: string | null;
  contentType: string;
  platform: string | null;
  objective: string | null;
  mainMessage: string | null;
  campaignName: string | null;
  publicationDate: string | null;
  publicationTime: string | null;
  creativeDueDate: string | null;
  urgency: string;
  workflowStatus: string;
  workflowResponsible: string | null;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  } | null;
  deliverables: Deliverable[];
  assets: CreativeAssetItem[];
  socialMediaPlanTitle: string | null;
  socialMediaCaptionHtml: string | null;
  socialMediaAdCopyHtml: string | null;
}

interface SocialMediaPlan {
  id: string;
  title: string;
  platform: string | null;
  scheduledFor: string;
  captionHtml: string | null;
  adCopyHtml: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "Non defini";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function urgencyLabel(value: string) {
  if (value === "urgent") return "Urgent";
  if (value === "overdue") return "Hors delai";
  return "Normal";
}

const GUIDE_STORAGE_KEY = "content-creation-guide-seen-v1";

export default function CreationContenuPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [deliverableFormOpen, setDeliverableFormOpen] = useState(false);
  const [requests, setRequests] = useState<CreativeRequest[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [socialMediaPlans, setSocialMediaPlans] = useState<SocialMediaPlan[]>([]);
  const [reportHours, setReportHours] = useState("24");
  const [sendingReport, setSendingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideVisible, setGuideVisible] = useState(true);
  const [uploadDialogRequest, setUploadDialogRequest] = useState<{
    id: string;
    reference: string;
  } | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [requestsResponse, collaboratorsResponse, socialMediaPlansResponse] = await Promise.all([
        fetch("/api/content/requests"),
        fetch("/api/content/collaborators"),
        fetch("/api/social-media/plans"),
      ]);

      if (!requestsResponse.ok || !collaboratorsResponse.ok || !socialMediaPlansResponse.ok) {
        throw new Error("Failed to fetch content data");
      }

      const [requestsData, collaboratorsData, socialMediaPlansData] = await Promise.all([
        requestsResponse.json(),
        collaboratorsResponse.json(),
        socialMediaPlansResponse.json(),
      ]);

      setRequests(requestsData);
      setCollaborators(collaboratorsData);
      setSocialMediaPlans(socialMediaPlansData);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger la creation de contenu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const hasSeenGuide = window.localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!hasSeenGuide) {
      setGuideOpen(true);
    }
  }, []);

  const deliverables = useMemo(
    () =>
      requests
        .flatMap((request) =>
          request.deliverables.map((deliverable) => ({
            ...deliverable,
            request,
          }))
        )
        .sort(
          (left, right) =>
            new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
        ),
    [requests]
  );

  const next48HoursCount = useMemo(() => {
    const now = Date.now();
    const horizon = now + 48 * 60 * 60 * 1000;
    return deliverables.filter((item) => {
      const date = new Date(item.scheduledFor).getTime();
      return date >= now && date <= horizon;
    }).length;
  }, [deliverables]);

  const handleRequestStatusChange = async (id: string, workflowStatus: string) => {
    try {
      const response = await fetch(`/api/content/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request");
      }

      await fetchData();
      toast({
        title: "Statut mis a jour",
        variant: "success",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre a jour la demande",
        variant: "destructive",
      });
    }
  };

  const handleDeliverableStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/content/deliverables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update deliverable");
      }

      await fetchData();
      toast({
        title: "Creatif mis a jour",
        variant: "success",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre a jour le creatif",
        variant: "destructive",
      });
    }
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const response = await fetch("/api/content/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: Number(reportHours) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send report");
      }

      toast({
        title: "Rapport Telegram envoye",
        description: `Fenetre ${reportHours}h envoyee avec succes.`,
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer le rapport",
        variant: "destructive",
      });
    } finally {
      setSendingReport(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    setDeletingAssetId(assetId);
    try {
      const response = await fetch(`/api/content/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete asset");
      }

      await fetchData();
      toast({
        title: "Fichier supprime",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    } finally {
      setDeletingAssetId(null);
    }
  };

  const markGuideAsSeen = () => {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, "true");
  };

  const handleGuideOpenChange = (open: boolean) => {
    setGuideOpen(open);
    if (!open) {
      markGuideAsSeen();
    }
  };

  const openGuide = () => {
    setGuideVisible(true);
    setGuideOpen(true);
  };

  const startNewRequest = () => {
    setActiveTab("requests");
    setRequestFormOpen(true);
    handleGuideOpenChange(false);
  };

  const startNewDeliverable = () => {
    setActiveTab("deliverables");
    setDeliverableFormOpen(true);
    handleGuideOpenChange(false);
  };

  const hideGuidePanel = () => {
    setGuideVisible(false);
    markGuideAsSeen();
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creation de Contenu</h1>
          <p className="text-muted-foreground">
            Suivi des fiches creatives et des contenus planifies issus du brief CSL Brands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openGuide}>
            <BookOpen className="mr-2 h-4 w-4" />
            Guide
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setDeliverableFormOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Ajouter un creatif
          </Button>
          <Button onClick={() => setRequestFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle fiche
          </Button>
        </div>
      </div>

      {guideVisible && (
        <Alert className="border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4" />
          <button
            type="button"
            onClick={hideGuidePanel}
            className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label="Masquer le guide"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertTitle>Parcours recommande</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              1. Creez une fiche de besoin. 2. Ajoutez les creatives a produire. 3. Mettez a jour les statuts jusqu&apos;a publication.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={startNewRequest}>
                Creer une fiche
              </Button>
              <Button size="sm" variant="outline" onClick={startNewDeliverable}>
                Ajouter un creatif
              </Button>
              <Button size="sm" variant="ghost" onClick={openGuide}>
                Voir le guide detaille
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Creatifs planifies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliverables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prochaines 48h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{next48HoursCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Direction contenu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                collaborators.filter((item) =>
                  ["creative_director", "social_media_manager"].includes(item.role)
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {session?.user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport Telegram</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={reportHours} onValueChange={setReportHours}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">Prochaines 24h</SelectItem>
                <SelectItem value="48">Prochaines 48h</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSendReport} disabled={sendingReport}>
              <Send className="mr-2 h-4 w-4" />
              {sendingReport ? "Envoi..." : "Envoyer sur Telegram"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Utilise le Bot Token et le Chat ID configures dans la caisse admin.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Demandes</TabsTrigger>
          <TabsTrigger value="deliverables">Creatifs</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">Chargement...</CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">
                Aucune fiche de creation de contenu enregistree.
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{request.reference}</CardTitle>
                        <Badge variant="outline">{request.contentType}</Badge>
                        <Badge variant="secondary">{urgencyLabel(request.urgency)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.clientName || "Interne"} • {request.requesterName}
                        {request.requesterFunction ? ` (${request.requesterFunction})` : ""}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:min-w-[240px]">
                      <Select
                        value={request.workflowStatus}
                        onValueChange={(value) => handleRequestStatusChange(request.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CREATIVE_REQUEST_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Statut actuel: {getCreativeRequestStatusLabel(request.workflowStatus)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Publication</p>
                      <p className="mt-1 font-medium">{formatDate(request.publicationDate)}</p>
                      {request.publicationTime && (
                        <p className="text-xs text-muted-foreground">Heure: {request.publicationTime}</p>
                      )}
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Livraison creative</p>
                      <p className="mt-1 font-medium">{formatDate(request.creativeDueDate)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Assigne a</p>
                      <p className="mt-1 font-medium">
                        {request.assignedTo?.name || request.workflowResponsible || "Non assigne"}
                      </p>
                      {request.assignedTo?.role && (
                        <p className="text-xs text-muted-foreground">
                          {getCollaboratorRoleLabel(request.assignedTo.role)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Canal / objectif</p>
                      <p className="mt-1 font-medium">{request.platform || "Non precise"}</p>
                      <p className="text-xs text-muted-foreground">{request.objective || "Sans objectif defini"}</p>
                    </div>
                  </div>

                  {request.mainMessage && (
                    <div className="rounded-lg border p-4">
                      <p className="text-xs uppercase text-muted-foreground">Message principal</p>
                      <p className="mt-2 text-sm">{request.mainMessage}</p>
                    </div>
                  )}

                  {(request.socialMediaPlanTitle || request.socialMediaCaptionHtml || request.socialMediaAdCopyHtml) && (
                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Texte social media selectionne
                          {request.socialMediaPlanTitle ? `: ${request.socialMediaPlanTitle}` : ""}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-md bg-muted/40 p-3">
                          <p className="mb-2 text-xs uppercase text-muted-foreground">Caption</p>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: request.socialMediaCaptionHtml || "<p>Aucun texte selectionne.</p>",
                            }}
                          />
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                          <p className="mb-2 text-xs uppercase text-muted-foreground">Ad copy</p>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: request.socialMediaAdCopyHtml || "<p>Aucun ad copy selectionne.</p>",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Fichiers de contexte</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setUploadDialogRequest({
                            id: request.id,
                            reference: request.reference,
                          })
                        }
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        Ajouter des fichiers
                      </Button>
                    </div>
                    <CreativeAssetGallery
                      assets={request.assets}
                      onDelete={handleDeleteAsset}
                      deletingId={deletingAssetId}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Creatifs lies</p>
                    </div>
                    {request.deliverables.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun creatif planifie pour cette fiche.</p>
                    ) : (
                      request.deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="flex flex-col gap-3 rounded-lg border p-4 xl:flex-row xl:items-center xl:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{deliverable.title}</p>
                              <Badge variant="outline">{deliverable.platform || "Canal libre"}</Badge>
                              <Badge variant="secondary">
                                {deliverable.format || "Format libre"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(deliverable.scheduledFor)} • {deliverable.owner?.name || "Non assigne"}
                            </p>
                          </div>
                          <div className="grid gap-2 sm:min-w-[220px]">
                            <Select
                              value={deliverable.status}
                              onValueChange={(value) => handleDeliverableStatusChange(deliverable.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CREATIVE_DELIVERABLE_STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {getCreativeDeliverableStatusLabel(deliverable.status)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">Chargement...</CardContent>
            </Card>
          ) : deliverables.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">
                Aucun creatif planifie.
              </CardContent>
            </Card>
          ) : (
            deliverables.map((deliverable) => (
              <Card key={deliverable.id}>
                <CardContent className="flex flex-col gap-4 py-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{deliverable.title}</p>
                      <Badge variant="outline">{deliverable.request.reference}</Badge>
                      <Badge variant="secondary">{deliverable.request.clientName || "Interne"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {deliverable.request.contentType} • {formatDate(deliverable.scheduledFor)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Responsable: {deliverable.owner?.name || "Non assigne"}
                    </p>
                    {deliverable.notes && <p className="text-sm">{deliverable.notes}</p>}
                  </div>
                  <div className="grid gap-2 sm:min-w-[240px]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      {deliverable.platform || "Sans canal"} • {deliverable.format || "Sans format"}
                    </div>
                    <Select
                      value={deliverable.status}
                      onValueChange={(value) => handleDeliverableStatusChange(deliverable.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CREATIVE_DELIVERABLE_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreativeRequestForm
        open={requestFormOpen}
        onOpenChange={setRequestFormOpen}
        collaborators={collaborators}
        socialMediaPlans={
          canSelectSocialMediaPlansForRequests(session?.user?.role)
            ? socialMediaPlans
            : []
        }
        onSuccess={fetchData}
      />

      <CreativeDeliverableForm
        open={deliverableFormOpen}
        onOpenChange={setDeliverableFormOpen}
        requests={requests.map((request) => ({
          id: request.id,
          reference: request.reference,
          clientName: request.clientName,
          contentType: request.contentType,
        }))}
        collaborators={collaborators}
        onSuccess={fetchData}
      />

      <RequestAssetUploadDialog
        open={!!uploadDialogRequest}
        onOpenChange={(open) => {
          if (!open) {
            setUploadDialogRequest(null);
          }
        }}
        requestId={uploadDialogRequest?.id || null}
        requestReference={uploadDialogRequest?.reference || null}
        onSuccess={fetchData}
      />

      <Dialog open={guideOpen} onOpenChange={handleGuideOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guide d&apos;utilisation</DialogTitle>
            <DialogDescription>
              Voici le circuit recommande pour utiliser le workflow Creation de Contenu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Etape 1</p>
                <p className="mt-2 font-semibold">Creer la fiche</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Remplissez le brief complet depuis le document CSL Brands.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Etape 2</p>
                <p className="mt-2 font-semibold">Planifier les creatives</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajoutez les contenus a produire et la date attendue.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Etape 3</p>
                <p className="mt-2 font-semibold">Suivre les statuts</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Faites avancer la demande jusqu&apos;a validation et publication.
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible defaultValue="item-1" className="rounded-lg border px-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>1. Comment commencer</AccordionTrigger>
                <AccordionContent className="space-y-2 text-muted-foreground">
                  <p>Utilisez le bouton `Nouvelle fiche` pour enregistrer la demande creative.</p>
                  <p>Renseignez au minimum la reference, le demandeur, le type de contenu, les delais, le responsable assigne et joignez les fichiers utiles.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>2. Comment planifier un creatif</AccordionTrigger>
                <AccordionContent className="space-y-2 text-muted-foreground">
                  <p>Une fois la fiche creee, cliquez sur `Ajouter un creatif`.</p>
                  <p>Choisissez la fiche correspondante, donnez un titre au contenu, la plateforme, le format et la date prevue.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>3. Comment suivre l&apos;avancement</AccordionTrigger>
                <AccordionContent className="space-y-2 text-muted-foreground">
                  <p>Dans l&apos;onglet `Demandes`, changez le statut global du brief selon le circuit interne.</p>
                  <p>Dans l&apos;onglet `Creatifs`, mettez a jour chaque contenu de `Planifie` a `Publie`.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>4. Role des admins</AccordionTrigger>
                <AccordionContent className="space-y-2 text-muted-foreground">
                  <p>Les admins gerent les collaborateurs et l&apos;acces a la caisse.</p>
                  <p>Ils peuvent aussi envoyer un rapport Telegram des creatives prevus sur les prochaines 24h ou 48h.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleGuideOpenChange(false)}>
              Fermer
            </Button>
            <Button onClick={startNewRequest}>
              Commencer par une fiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
