"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { canSelectSocialMediaPlansForRequests } from "@/lib/access";
import { CREATIVE_DELIVERABLE_STATUSES, getCollaboratorRoleLabel } from "@/lib/content";
import { cn } from "@/lib/utils";

interface RequestOption {
  id: string;
  reference: string;
  clientName: string | null;
  contentType: string;
}

interface CollaboratorOption {
  id: string;
  name: string;
  role: string;
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

export interface CreativeDeliverableEditData {
  id: string;
  request: {
    id: string;
  };
  title: string;
  platform: string | null;
  format: string | null;
  scheduledFor: string;
  status: string;
  notes: string | null;
  socialMediaPlan: {
    id: string;
  } | null;
  owner: {
    id: string;
  } | null;
}

interface CreativeDeliverableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: RequestOption[];
  collaborators: CollaboratorOption[];
  socialMediaPlans: SocialMediaPlanOption[];
  onSuccess: () => void;
  editData?: CreativeDeliverableEditData | null;
}

function nextHour() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function datetimeLocalValue(value?: string | null) {
  if (!value) return nextHour();
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

const initialForm = {
  requestId: "",
  title: "",
  platform: "",
  format: "",
  scheduledFor: nextHour(),
  status: "planned",
  notes: "",
  ownerId: "self",
  socialMediaPlanId: "none",
};

function formFromEditData(editData: CreativeDeliverableEditData) {
  return {
    requestId: editData.request.id,
    title: editData.title,
    platform: editData.platform || "",
    format: editData.format || "",
    scheduledFor: datetimeLocalValue(editData.scheduledFor),
    status: editData.status,
    notes: editData.notes || "",
    ownerId: editData.owner?.id || "self",
    socialMediaPlanId: editData.socialMediaPlan?.id || "none",
  };
}

export function CreativeDeliverableForm({
  open,
  onOpenChange,
  requests,
  collaborators,
  socialMediaPlans,
  onSuccess,
  editData,
}: CreativeDeliverableFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      setFormData(
        editData
          ? formFromEditData(editData)
          : {
              ...initialForm,
              requestId: requests[0]?.id || "",
            }
      );
      setPlanPickerOpen(false);
    }
  }, [open, requests, editData]);

  const setField = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "requestId") {
        next.socialMediaPlanId = "none";
      }
      return next;
    });
  };

  const selectedRequest = requests.find((request) => request.id === formData.requestId) || null;
  const normalizedClientName = (selectedRequest?.clientName || "").trim().toLowerCase();
  const canSelectPlan = canSelectSocialMediaPlansForRequests(session?.user?.role);
  const filteredPlans = useMemo(() => {
    if (!normalizedClientName) {
      return [];
    }

    return socialMediaPlans.filter(
      (plan) => (plan.clientName || "").trim().toLowerCase() === normalizedClientName
    );
  }, [normalizedClientName, socialMediaPlans]);
  const selectedPlan =
    formData.socialMediaPlanId !== "none"
      ? filteredPlans.find((plan) => plan.id === formData.socialMediaPlanId) || null
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        isEditing ? `/api/content/deliverables/${editData.id}` : "/api/content/deliverables",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            ownerId: formData.ownerId === "self" ? null : formData.ownerId,
            socialMediaPlanId:
              formData.socialMediaPlanId === "none" ? null : formData.socialMediaPlanId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save deliverable");
      }

      toast({
        title: isEditing ? "Creatif mis a jour" : "Creatif planifie",
        description: isEditing
          ? `${formData.title} a ete mis a jour.`
          : `${formData.title} a ete ajoute.`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter le creatif",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanLabel = selectedPlan
    ? `${selectedPlan.title} - ${new Date(selectedPlan.scheduledFor).toLocaleDateString("fr-FR")}`
    : "Rechercher un contenu planifie";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le creatif" : "Nouveau creatif"}</DialogTitle>
          <DialogDescription>
            Planifiez un contenu a produire pour une date precise.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliverable-request">Fiche associee</Label>
              <Select value={formData.requestId} onValueChange={(value) => setField("requestId", value)} disabled={loading}>
                <SelectTrigger id="deliverable-request">
                  <SelectValue placeholder="Choisir une fiche" />
                </SelectTrigger>
                <SelectContent>
                  {requests.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.reference} - {request.clientName || "Interne"} - {request.contentType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliverable-title">Titre</Label>
              <Input id="deliverable-title" value={formData.title} onChange={(event) => setField("title", event.target.value)} placeholder="Ex. Reel teasing lancement" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-platform">Plateforme</Label>
              <Input id="deliverable-platform" value={formData.platform} onChange={(event) => setField("platform", event.target.value)} placeholder="Instagram, LinkedIn..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-format">Format</Label>
              <Input id="deliverable-format" value={formData.format} onChange={(event) => setField("format", event.target.value)} placeholder="Story, Reel 9:16..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-scheduled">Date de production / livraison</Label>
              <Input id="deliverable-scheduled" type="datetime-local" value={formData.scheduledFor} onChange={(event) => setField("scheduledFor", event.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-status">Statut initial</Label>
              <Select value={formData.status} onValueChange={(value) => setField("status", value)} disabled={loading}>
                <SelectTrigger id="deliverable-status">
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

            {canSelectPlan && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliverable-social-media">Texte social media a utiliser</Label>
                <Popover open={planPickerOpen} onOpenChange={setPlanPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={planPickerOpen}
                      className="w-full justify-between"
                      disabled={!selectedRequest?.clientName}
                    >
                      <span className="truncate">
                        {!selectedRequest?.clientName
                          ? "La fiche choisie n'a pas de client"
                          : selectedPlanLabel}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher par date, titre, texte..." />
                      <CommandList>
                        <CommandEmpty>
                          {selectedRequest?.clientName
                            ? "Aucun contenu trouve pour ce client."
                            : "La fiche doit avoir un client pour charger les contenus."}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="Aucun texte selectionne"
                            onSelect={() => {
                              setField("socialMediaPlanId", "none");
                              setPlanPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.socialMediaPlanId === "none" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Aucun texte selectionne
                          </CommandItem>
                          {filteredPlans.map((plan) => {
                            const searchValue = [
                              plan.title,
                              plan.clientName || "",
                              plan.platform || "",
                              new Date(plan.scheduledFor).toLocaleDateString("fr-FR"),
                              plan.captionHtml || "",
                              plan.adCopyHtml || "",
                            ].join(" ");

                            return (
                              <CommandItem
                                key={plan.id}
                                value={searchValue}
                                onSelect={() => {
                                  setField("socialMediaPlanId", plan.id);
                                  setPlanPickerOpen(false);
                                }}
                                className="items-start"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 mt-0.5 h-4 w-4 shrink-0",
                                    formData.socialMediaPlanId === plan.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{plan.title}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {new Date(plan.scheduledFor).toLocaleDateString("fr-FR")}
                                    {plan.platform ? ` • ${plan.platform}` : ""}
                                  </p>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedRequest?.clientName && filteredPlans.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucun contenu social media n&apos;est encore planifie pour {selectedRequest.clientName}.
                  </p>
                )}
              </div>
            )}

            {selectedPlan && (
              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Texte d'accompagnement selectionne</p>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPlan.captionHtml || "<p>Aucun texte.</p>" }}
                  />
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Ad copy selectionne</p>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPlan.adCopyHtml || "<p>Aucun ad copy.</p>" }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliverable-owner">Responsable</Label>
              <Select value={formData.ownerId} onValueChange={(value) => setField("ownerId", value)} disabled={loading}>
                <SelectTrigger id="deliverable-owner">
                  <SelectValue placeholder="Assigner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Moi</SelectItem>
                  {collaborators.map((collaborator) => (
                    <SelectItem key={collaborator.id} value={collaborator.id}>
                      {collaborator.name} - {getCollaboratorRoleLabel(collaborator.role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliverable-notes">Notes</Label>
              <Textarea id="deliverable-notes" rows={4} value={formData.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Precisions de production..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.requestId}>
              {loading ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Ajouter le creatif"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
