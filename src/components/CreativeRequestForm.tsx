"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreativeAssetPicker } from "@/components/CreativeAssetPicker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  CREATIVE_REQUEST_STATUSES,
  CREATIVE_URGENCY_OPTIONS,
  CREATIVE_VALIDATION_OPTIONS,
  getCollaboratorRoleLabel,
} from "@/lib/content";

interface CollaboratorOption {
  id: string;
  name: string;
  role: string;
}

interface CreativeRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborators: CollaboratorOption[];
  onSuccess: () => void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function makeReference() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 12);
  return `CR-${stamp}`;
}

const initialForm = () => ({
  reference: makeReference(),
  requestDate: todayDate(),
  requesterName: "",
  requesterFunction: "",
  servicePole: "",
  clientName: "",
  accountManager: "",
  clientApproverContact: "",
  contentType: "",
  platform: "",
  objective: "",
  campaignName: "",
  mainMessage: "",
  callToAction: "",
  copyProvided: false,
  copywriterName: "",
  desiredFormat: "",
  quantity: "",
  language: "Francais",
  includeLogo: false,
  brandGuidelinesProvided: false,
  priceToDisplay: "",
  dateToDisplay: "",
  timeToDisplay: "",
  locationToDisplay: "",
  contactNumber: "",
  linkUrl: "",
  hashtags: "",
  legalMentions: "",
  partnersSponsors: "",
  mandatoryElements: "",
  photosAvailable: false,
  videosAvailable: false,
  logoAvailable: false,
  sourceTextAvailable: false,
  visualReferences: "",
  referenceLinks: "",
  assetLocation: "",
  creativeDueDate: "",
  publicationDate: "",
  publicationTime: "",
  urgency: "normal",
  validationRequired: "internal_only",
  feedbackRounds: "",
  requesterValidation: "",
  marketingValidation: "",
  clientValidation: "",
  finalValidation: "",
  additionalNotes: "",
  workflowStatus: "brief_received",
  workflowResponsible: "",
  workflowDate: "",
  assignedToId: "none",
});

export function CreativeRequestForm({
  open,
  onOpenChange,
  collaborators,
  onSuccess,
}: CreativeRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      setFormData(initialForm());
      setFiles([]);
    }
  }, [open]);

  const setField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        assignedToId: formData.assignedToId === "none" ? null : formData.assignedToId,
      };

      const response = await fetch("/api/content/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create request");
      }

      const createdRequest = await response.json();

      if (files.length > 0) {
        const assetFormData = new FormData();
        files.forEach((file) => assetFormData.append("files", file));

        const uploadResponse = await fetch(`/api/content/requests/${createdRequest.id}/assets`, {
          method: "POST",
          body: assetFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || "Request created but asset upload failed");
        }
      }

      toast({
        title: "Demande enregistree",
        description:
          files.length > 0
            ? `La fiche ${formData.reference} et ses fichiers ont ete ajoutes.`
            : `La fiche ${formData.reference} a ete ajoutee.`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de creer la fiche",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const booleanField = (id: string, label: string, field: keyof ReturnType<typeof initialForm>) => (
    <label htmlFor={id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
      <Checkbox
        id={id}
        checked={Boolean(formData[field])}
        onCheckedChange={(checked) => setField(field, checked === true)}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] p-0 sm:max-w-5xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Nouvelle fiche de besoin</DialogTitle>
          <DialogDescription>
            Brief creatif base sur la fiche de creation de contenu CSL Brands.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] px-6">
          <form id="creative-request-form" onSubmit={handleSubmit} className="space-y-8 pb-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Informations generales
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input id="reference" value={formData.reference} onChange={(event) => setField("reference", event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestDate">Date de demande</Label>
                  <Input id="requestDate" type="date" value={formData.requestDate} onChange={(event) => setField("requestDate", event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterName">Nom du demandeur</Label>
                  <Input id="requesterName" value={formData.requesterName} onChange={(event) => setField("requesterName", event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterFunction">Fonction</Label>
                  <Input id="requesterFunction" value={formData.requesterFunction} onChange={(event) => setField("requesterFunction", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servicePole">Service / pole</Label>
                  <Input id="servicePole" value={formData.servicePole} onChange={(event) => setField("servicePole", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client concerne</Label>
                  <Input id="clientName" value={formData.clientName} onChange={(event) => setField("clientName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountManager">Responsable de compte</Label>
                  <Input id="accountManager" value={formData.accountManager} onChange={(event) => setField("accountManager", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientApproverContact">Contact client valideur</Label>
                  <Input id="clientApproverContact" value={formData.clientApproverContact} onChange={(event) => setField("clientApproverContact", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedToId">Assigne a</Label>
                  <Select value={formData.assignedToId} onValueChange={(value) => setField("assignedToId", value)}>
                    <SelectTrigger id="assignedToId">
                      <SelectValue placeholder="Choisir un responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non assigne</SelectItem>
                      {collaborators.map((collaborator) => (
                        <SelectItem key={collaborator.id} value={collaborator.id}>
                          {collaborator.name} - {getCollaboratorRoleLabel(collaborator.role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Details du besoin
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Type de contenu</Label>
                  <Input id="contentType" value={formData.contentType} onChange={(event) => setField("contentType", event.target.value)} placeholder="Visuel, reel, flyer..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Plateforme / canal</Label>
                  <Input id="platform" value={formData.platform} onChange={(event) => setField("platform", event.target.value)} placeholder="Facebook, Instagram, Email..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective">Objectif</Label>
                  <Input id="objective" value={formData.objective} onChange={(event) => setField("objective", event.target.value)} placeholder="Vente, Branding..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campagne / sujet</Label>
                  <Input id="campaignName" value={formData.campaignName} onChange={(event) => setField("campaignName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callToAction">CTA</Label>
                  <Input id="callToAction" value={formData.callToAction} onChange={(event) => setField("callToAction", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desiredFormat">Format souhaite</Label>
                  <Input id="desiredFormat" value={formData.desiredFormat} onChange={(event) => setField("desiredFormat", event.target.value)} placeholder="1080x1080, Story, A4..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantite</Label>
                  <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={(event) => setField("quantity", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Input id="language" value={formData.language} onChange={(event) => setField("language", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copywriterName">Copy a rediger par</Label>
                  <Input id="copywriterName" value={formData.copywriterName} onChange={(event) => setField("copywriterName", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainMessage">Message principal</Label>
                <Textarea id="mainMessage" rows={3} value={formData.mainMessage} onChange={(event) => setField("mainMessage", event.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {booleanField("copyProvided", "Texte / copy fourni", "copyProvided")}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Elements obligatoires
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {booleanField("includeLogo", "Logo a integrer", "includeLogo")}
                {booleanField("brandGuidelinesProvided", "Charte graphique fournie", "brandGuidelinesProvided")}
                {booleanField("photosAvailable", "Photos disponibles", "photosAvailable")}
                {booleanField("videosAvailable", "Videos disponibles", "videosAvailable")}
                {booleanField("logoAvailable", "Logo disponible", "logoAvailable")}
                {booleanField("sourceTextAvailable", "Texte source disponible", "sourceTextAvailable")}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="priceToDisplay">Prix a afficher</Label>
                  <Input id="priceToDisplay" value={formData.priceToDisplay} onChange={(event) => setField("priceToDisplay", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateToDisplay">Date a afficher</Label>
                  <Input id="dateToDisplay" value={formData.dateToDisplay} onChange={(event) => setField("dateToDisplay", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeToDisplay">Heure a afficher</Label>
                  <Input id="timeToDisplay" value={formData.timeToDisplay} onChange={(event) => setField("timeToDisplay", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationToDisplay">Lieu a afficher</Label>
                  <Input id="locationToDisplay" value={formData.locationToDisplay} onChange={(event) => setField("locationToDisplay", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Numero de contact</Label>
                  <Input id="contactNumber" value={formData.contactNumber} onChange={(event) => setField("contactNumber", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Lien / URL / QR code</Label>
                  <Input id="linkUrl" value={formData.linkUrl} onChange={(event) => setField("linkUrl", event.target.value)} />
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <Label htmlFor="partnersSponsors">Partenaires / sponsors</Label>
                  <Input id="partnersSponsors" value={formData.partnersSponsors} onChange={(event) => setField("partnersSponsors", event.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Textarea id="hashtags" rows={3} value={formData.hashtags} onChange={(event) => setField("hashtags", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalMentions">Mentions legales / avertissements</Label>
                  <Textarea id="legalMentions" rows={3} value={formData.legalMentions} onChange={(event) => setField("legalMentions", event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mandatoryElements">Autres elements obligatoires</Label>
                  <Textarea id="mandatoryElements" rows={3} value={formData.mandatoryElements} onChange={(event) => setField("mandatoryElements", event.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ressources et delais
              </h3>
              <CreativeAssetPicker files={files} onChange={setFiles} disabled={loading} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="visualReferences">References visuelles</Label>
                  <Textarea id="visualReferences" rows={3} value={formData.visualReferences} onChange={(event) => setField("visualReferences", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceLinks">Liens de reference</Label>
                  <Textarea id="referenceLinks" rows={3} value={formData.referenceLinks} onChange={(event) => setField("referenceLinks", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assetLocation">Dossier / emplacement des fichiers</Label>
                  <Textarea id="assetLocation" rows={3} value={formData.assetLocation} onChange={(event) => setField("assetLocation", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creativeDueDate">Date souhaitee de livraison</Label>
                  <Input id="creativeDueDate" type="date" value={formData.creativeDueDate} onChange={(event) => setField("creativeDueDate", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicationDate">Date de publication</Label>
                  <Input id="publicationDate" type="date" value={formData.publicationDate} onChange={(event) => setField("publicationDate", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicationTime">Heure de publication</Label>
                  <Input id="publicationTime" type="time" value={formData.publicationTime} onChange={(event) => setField("publicationTime", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgence</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setField("urgency", value)}>
                    <SelectTrigger id="urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREATIVE_URGENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validationRequired">Validation requise</Label>
                  <Select value={formData.validationRequired} onValueChange={(value) => setField("validationRequired", value)}>
                    <SelectTrigger id="validationRequired">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREATIVE_VALIDATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedbackRounds">Nombre de retours inclus</Label>
                  <Input id="feedbackRounds" type="number" min="0" value={formData.feedbackRounds} onChange={(event) => setField("feedbackRounds", event.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Validation et suivi
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="requesterValidation">Validation demandeur</Label>
                  <Input id="requesterValidation" value={formData.requesterValidation} onChange={(event) => setField("requesterValidation", event.target.value)} placeholder="Nom / Date / Signature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketingValidation">Validation marketing / content</Label>
                  <Input id="marketingValidation" value={formData.marketingValidation} onChange={(event) => setField("marketingValidation", event.target.value)} placeholder="Nom / Date / Signature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientValidation">Validation client</Label>
                  <Input id="clientValidation" value={formData.clientValidation} onChange={(event) => setField("clientValidation", event.target.value)} placeholder="Nom / Date / Signature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finalValidation">Validation finale</Label>
                  <Input id="finalValidation" value={formData.finalValidation} onChange={(event) => setField("finalValidation", event.target.value)} placeholder="Nom / Date / Signature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflowStatus">Statut interne</Label>
                  <Select value={formData.workflowStatus} onValueChange={(value) => setField("workflowStatus", value)}>
                    <SelectTrigger id="workflowStatus">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflowResponsible">Responsable de l&apos;etape</Label>
                  <Input id="workflowResponsible" value={formData.workflowResponsible} onChange={(event) => setField("workflowResponsible", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflowDate">Date de suivi</Label>
                  <Input id="workflowDate" type="date" value={formData.workflowDate} onChange={(event) => setField("workflowDate", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Observations complementaires</Label>
                <Textarea id="additionalNotes" rows={4} value={formData.additionalNotes} onChange={(event) => setField("additionalNotes", event.target.value)} />
              </div>
            </section>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button form="creative-request-form" type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Creer la fiche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
