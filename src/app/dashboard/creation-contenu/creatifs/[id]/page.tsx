"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Megaphone, Pencil } from "lucide-react";
import {
  CreativeDeliverableForm,
  type CreativeDeliverableEditData,
} from "@/components/CreativeDeliverableForm";
import { CreativeAssetGallery, type CreativeAssetItem } from "@/components/CreativeAssetGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getCollaboratorRoleLabel, getCreativeDeliverableStatusLabel } from "@/lib/content";

interface Collaborator {
  id: string;
  name: string;
  role: string;
}

interface RequestOption {
  id: string;
  reference: string;
  clientName: string | null;
  contentType: string;
}

interface SocialMediaPlanOption {
  id: string;
  title: string;
  clientName: string | null;
  platform: string | null;
  scheduledFor: string;
  captionHtml: string | null;
  adCopyHtml: string | null;
}

interface DeliverableDetail extends CreativeDeliverableEditData {
  socialMediaPlanTitle: string | null;
  socialMediaCaptionHtml: string | null;
  socialMediaAdCopyHtml: string | null;
  request: {
    id: string;
    reference: string;
    clientName: string | null;
    contentType: string;
    publicationDate: string | null;
    assets: CreativeAssetItem[];
    assignedTo: {
      id: string;
      name: string;
      role: string;
    } | null;
  };
  socialMediaPlan: {
    id: string;
    title: string;
    clientName: string | null;
    platform: string | null;
    campaignName: string | null;
    scheduledFor: string;
    status: string;
    captionHtml: string | null;
    adCopyHtml: string | null;
    briefHtml: string | null;
  } | null;
  owner: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    role: string;
  } | null;
}

function formatDateTime(value: string | null) {
  if (!value) return "Non defini";
  return new Date(value).toLocaleString("fr-FR");
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || "Non defini"}</p>
    </div>
  );
}

export default function CreativeDeliverableDetailPage() {
  const params = useParams<{ id: string }>();
  const [deliverable, setDeliverable] = useState<DeliverableDetail | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [requests, setRequests] = useState<RequestOption[]>([]);
  const [socialMediaPlans, setSocialMediaPlans] = useState<SocialMediaPlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [deliverableResponse, collaboratorsResponse, requestsResponse, plansResponse] =
        await Promise.all([
          fetch(`/api/content/deliverables/${params.id}`),
          fetch("/api/content/collaborators"),
          fetch("/api/content/requests"),
          fetch("/api/social-media/plans"),
        ]);

      if (
        !deliverableResponse.ok ||
        !collaboratorsResponse.ok ||
        !requestsResponse.ok ||
        !plansResponse.ok
      ) {
        throw new Error("Failed to fetch creative detail");
      }

      const [deliverableData, collaboratorsData, requestsData, plansData] = await Promise.all([
        deliverableResponse.json(),
        collaboratorsResponse.json(),
        requestsResponse.json(),
        plansResponse.json(),
      ]);

      setDeliverable(deliverableData);
      setCollaborators(collaboratorsData);
      setRequests(
        requestsData.map((request: RequestOption) => ({
          id: request.id,
          reference: request.reference,
          clientName: request.clientName,
          contentType: request.contentType,
        }))
      );
      setSocialMediaPlans(plansData);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger le creatif",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!deliverable) {
    return <div className="py-6 text-sm text-muted-foreground">Creatif introuvable.</div>;
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
            <h1 className="text-3xl font-bold tracking-tight">{deliverable.title}</h1>
            <Badge variant="outline">{deliverable.platform || "Sans canal"}</Badge>
            <Badge variant="secondary">{getCreativeDeliverableStatusLabel(deliverable.status)}</Badge>
          </div>
          <p className="text-muted-foreground">
            {deliverable.request.reference} • {deliverable.request.clientName || "Interne"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/creation-contenu/fiches/${deliverable.request.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Voir fiche
            </Link>
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier le creatif
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details du creatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Format" value={deliverable.format} />
                <DetailField label="Plateforme" value={deliverable.platform} />
                <DetailField label="Planifie pour" value={formatDateTime(deliverable.scheduledFor)} />
                <DetailField
                  label="Responsable"
                  value={
                    deliverable.owner
                      ? `${deliverable.owner.name} (${getCollaboratorRoleLabel(deliverable.owner.role)})`
                      : "Non assigne"
                  }
                />
                <DetailField
                  label="Cree par"
                  value={
                    deliverable.createdBy
                      ? `${deliverable.createdBy.name} (${getCollaboratorRoleLabel(deliverable.createdBy.role)})`
                      : "Non defini"
                  }
                />
                <DetailField label="Publication de la fiche" value={formatDateTime(deliverable.request.publicationDate)} />
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Notes de production</p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{deliverable.notes || "Aucune note."}</p>
              </div>
            </CardContent>
          </Card>

          {(deliverable.socialMediaCaptionHtml || deliverable.socialMediaAdCopyHtml || deliverable.socialMediaPlan?.briefHtml) && (
            <Card>
              <CardHeader>
                <CardTitle>Contenu social media associe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliverable.socialMediaPlanTitle && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{deliverable.socialMediaPlanTitle}</Badge>
                    {deliverable.socialMediaPlan?.platform && (
                      <Badge variant="secondary">{deliverable.socialMediaPlan.platform}</Badge>
                    )}
                  </div>
                )}

                {deliverable.socialMediaCaptionHtml && (
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs uppercase text-muted-foreground">Caption</p>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: deliverable.socialMediaCaptionHtml }}
                    />
                  </div>
                )}

                {deliverable.socialMediaAdCopyHtml && (
                  <div className="rounded-lg border p-4">
                    <p className="mb-2 text-xs uppercase text-muted-foreground">Ad copy</p>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: deliverable.socialMediaAdCopyHtml }}
                    />
                  </div>
                )}

                {deliverable.socialMediaPlan?.briefHtml && (
                  <div className="rounded-lg border p-4">
                    <p className="mb-2 text-xs uppercase text-muted-foreground">Brief contextuel</p>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: deliverable.socialMediaPlan.briefHtml }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Contexte de la fiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailField label="Reference fiche" value={deliverable.request.reference} />
                <DetailField label="Client" value={deliverable.request.clientName} />
                <DetailField label="Type de contenu" value={deliverable.request.contentType} />
                <DetailField
                  label="Responsable fiche"
                  value={
                    deliverable.request.assignedTo
                      ? `${deliverable.request.assignedTo.name} (${getCollaboratorRoleLabel(deliverable.request.assignedTo.role)})`
                      : "Non assigne"
                  }
                />
              </div>
              <CreativeAssetGallery assets={deliverable.request.assets} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/dashboard/creation-contenu/fiches/${deliverable.request.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ouvrir la fiche source
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreativeDeliverableForm
        open={editOpen}
        onOpenChange={setEditOpen}
        requests={requests}
        collaborators={collaborators}
        socialMediaPlans={socialMediaPlans}
        editData={deliverable}
        onSuccess={fetchData}
      />
    </div>
  );
}
