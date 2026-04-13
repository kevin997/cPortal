"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Paperclip, Pencil } from "lucide-react";
import { CreativeAssetGallery, type CreativeAssetItem } from "@/components/CreativeAssetGallery";
import { CreativeRequestForm, type CreativeRequestEditData } from "@/components/CreativeRequestForm";
import { RequestAssetUploadDialog } from "@/components/RequestAssetUploadDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getCollaboratorRoleLabel, getCreativeRequestStatusLabel } from "@/lib/content";

interface Collaborator {
  id: string;
  name: string;
  role: string;
}

interface DeliverableSummary {
  id: string;
  title: string;
  platform: string | null;
  format: string | null;
  scheduledFor: string;
  status: string;
  socialMediaPlanTitle: string | null;
  owner: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface RequestDetail extends CreativeRequestEditData {
  assignedTo: {
    id: string;
    name: string;
    role: string;
  } | null;
  assets: CreativeAssetItem[];
  deliverables: DeliverableSummary[];
}

function formatDateTime(value: string | null) {
  if (!value) return "Non defini";
  return new Date(value).toLocaleString("fr-FR");
}

function formatDate(value: string | null) {
  if (!value) return "Non defini";
  return new Date(value).toLocaleDateString("fr-FR");
}

function DetailField({ label, value }: { label: string; value: string | null | number | boolean }) {
  const display =
    typeof value === "boolean" ? (value ? "Oui" : "Non") : value === null || value === "" ? "Non defini" : String(value);

  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{display}</p>
    </div>
  );
}

export default function CreativeRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [requestResponse, collaboratorsResponse] = await Promise.all([
        fetch(`/api/content/requests/${params.id}`),
        fetch("/api/content/collaborators"),
      ]);

      if (!requestResponse.ok || !collaboratorsResponse.ok) {
        throw new Error("Failed to fetch request");
      }

      const [requestData, collaboratorsData] = await Promise.all([
        requestResponse.json(),
        collaboratorsResponse.json(),
      ]);

      setRequest(requestData);
      setCollaborators(collaboratorsData);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger la fiche",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

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

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!request) {
    return <div className="py-6 text-sm text-muted-foreground">Fiche introuvable.</div>;
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="h-auto px-0 text-muted-foreground">
            <Link href="/dashboard/creation-contenu">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au workflow
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{request.reference}</h1>
            <Badge variant="outline">{request.contentType}</Badge>
            <Badge variant="secondary">{getCreativeRequestStatusLabel(request.workflowStatus)}</Badge>
          </div>
          <p className="text-muted-foreground">
            {request.clientName || "Interne"} • {request.requesterName}
            {request.requesterFunction ? ` (${request.requesterFunction})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Paperclip className="mr-2 h-4 w-4" />
            Ajouter des fichiers
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier la fiche
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brief complet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Date de demande" value={formatDate(request.requestDate)} />
                <DetailField label="Service / pole" value={request.servicePole} />
                <DetailField label="Responsable de compte" value={request.accountManager} />
                <DetailField label="Contact client valideur" value={request.clientApproverContact} />
                <DetailField label="Plateforme" value={request.platform} />
                <DetailField label="Objectif" value={request.objective} />
                <DetailField label="Campagne" value={request.campaignName} />
                <DetailField label="CTA" value={request.callToAction} />
                <DetailField label="Format souhaite" value={request.desiredFormat} />
                <DetailField label="Quantite" value={request.quantity} />
                <DetailField label="Langue" value={request.language} />
                <DetailField label="Copywriter" value={request.copywriterName} />
                <DetailField label="Date de livraison" value={formatDate(request.creativeDueDate)} />
                <DetailField label="Date de publication" value={formatDate(request.publicationDate)} />
                <DetailField label="Heure de publication" value={request.publicationTime} />
                <DetailField label="Validation requise" value={request.validationRequired} />
                <DetailField label="Urgence" value={request.urgency} />
                <DetailField label="Retours inclus" value={request.feedbackRounds} />
              </div>

              {request.mainMessage && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Message principal</p>
                  <div
                    className="prose prose-sm mt-2 max-w-none"
                    dangerouslySetInnerHTML={{ __html: request.mainMessage }}
                  />
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Texte fourni" value={request.copyProvided} />
                <DetailField label="Logo a integrer" value={request.includeLogo} />
                <DetailField label="Charte graphique fournie" value={request.brandGuidelinesProvided} />
                <DetailField label="Photos disponibles" value={request.photosAvailable} />
                <DetailField label="Videos disponibles" value={request.videosAvailable} />
                <DetailField label="Logo disponible" value={request.logoAvailable} />
                <DetailField label="Texte source disponible" value={request.sourceTextAvailable} />
                <DetailField label="Prix a afficher" value={request.priceToDisplay} />
                <DetailField label="Date a afficher" value={request.dateToDisplay} />
                <DetailField label="Heure a afficher" value={request.timeToDisplay} />
                <DetailField label="Lieu a afficher" value={request.locationToDisplay} />
                <DetailField label="Numero de contact" value={request.contactNumber} />
                <DetailField label="Lien / URL" value={request.linkUrl} />
                <DetailField label="Partenaires / sponsors" value={request.partnersSponsors} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Hashtags</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{request.hashtags || "Aucun"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Mentions legales</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{request.legalMentions || "Aucune"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Elements obligatoires</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{request.mandatoryElements || "Aucun"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">References visuelles</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{request.visualReferences || "Aucune"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Liens de reference</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{request.referenceLinks || "Aucun"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Emplacement des fichiers</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{request.assetLocation || "Non defini"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Validation demandeur" value={request.requesterValidation} />
                <DetailField label="Validation marketing" value={request.marketingValidation} />
                <DetailField label="Validation client" value={request.clientValidation} />
                <DetailField label="Validation finale" value={request.finalValidation} />
                <DetailField label="Responsable workflow" value={request.workflowResponsible} />
                <DetailField label="Date de suivi" value={formatDate(request.workflowDate)} />
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Observations complementaires</p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{request.additionalNotes || "Aucune"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creatifs lies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun creatif planifie.</p>
              ) : (
                request.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <p className="font-medium">{deliverable.title}</p>
                        <Badge variant="outline">{deliverable.platform || "Sans canal"}</Badge>
                        <Badge variant="secondary">{deliverable.format || "Sans format"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(deliverable.scheduledFor)} • {deliverable.owner?.name || "Non assigne"}
                      </p>
                      {deliverable.socialMediaPlanTitle && (
                        <p className="text-xs text-muted-foreground">
                          Contenu social media: {deliverable.socialMediaPlanTitle}
                        </p>
                      )}
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/dashboard/creation-contenu/creatifs/${deliverable.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir creatif
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilotage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Statut" value={getCreativeRequestStatusLabel(request.workflowStatus)} />
              <DetailField
                label="Assigne a"
                value={
                  request.assignedTo
                    ? `${request.assignedTo.name} (${getCollaboratorRoleLabel(request.assignedTo.role)})`
                    : "Non assigne"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fichiers de contexte</CardTitle>
            </CardHeader>
            <CardContent>
              <CreativeAssetGallery
                assets={request.assets}
                onDelete={handleDeleteAsset}
                deletingId={deletingAssetId}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <CreativeRequestForm
        open={editOpen}
        onOpenChange={setEditOpen}
        collaborators={collaborators}
        editData={request}
        onSuccess={fetchData}
      />

      <RequestAssetUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        requestId={request.id}
        requestReference={request.reference}
        onSuccess={fetchData}
      />
    </div>
  );
}
