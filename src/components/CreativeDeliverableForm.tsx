"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CREATIVE_DELIVERABLE_STATUSES, getCollaboratorRoleLabel } from "@/lib/content";

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

interface CreativeDeliverableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: RequestOption[];
  collaborators: CollaboratorOption[];
  onSuccess: () => void;
}

function nextHour() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
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
};

export function CreativeDeliverableForm({
  open,
  onOpenChange,
  requests,
  collaborators,
  onSuccess,
}: CreativeDeliverableFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialForm,
        requestId: requests[0]?.id || "",
      });
    }
  }, [open, requests]);

  const setField = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/content/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ownerId: formData.ownerId === "self" ? null : formData.ownerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create deliverable");
      }

      toast({
        title: "Creatif planifie",
        description: `${formData.title} a ete ajoute.`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Nouveau creatif</DialogTitle>
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
              {loading ? "Enregistrement..." : "Ajouter le creatif"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
