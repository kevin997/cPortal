"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "@/hooks/use-toast";
import { SOCIAL_MEDIA_PLAN_STATUSES } from "@/lib/content";

interface SocialMediaPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  onSuccess: () => void;
}

const initialForm = (defaultDate?: string) => ({
  title: "",
  clientName: "",
  platform: "",
  campaignName: "",
  scheduledFor: defaultDate ? `${defaultDate}T10:00` : "",
  status: "planned",
  captionHtml: "",
  adCopyHtml: "",
  briefHtml: "",
});

export function SocialMediaPlanForm({
  open,
  onOpenChange,
  defaultDate,
  onSuccess,
}: SocialMediaPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm(defaultDate));

  useEffect(() => {
    if (open) {
      setFormData(initialForm(defaultDate));
    }
  }, [open, defaultDate]);

  const setField = (field: keyof ReturnType<typeof initialForm>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/social-media/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create social media plan");
      }

      toast({
        title: "Plan social media cree",
        description: formData.title,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de creer le plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nouveau plan social media</DialogTitle>
          <DialogDescription>
            Preparez le texte et l&apos;ad copy qui pourront etre reutilises lors des demandes creatives.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sm-title">Titre</Label>
              <Input id="sm-title" value={formData.title} onChange={(event) => setField("title", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sm-client">Client</Label>
              <Input id="sm-client" value={formData.clientName} onChange={(event) => setField("clientName", event.target.value)} placeholder="Ex. CSL Brands, KURSA..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sm-platform">Plateforme</Label>
              <Input id="sm-platform" value={formData.platform} onChange={(event) => setField("platform", event.target.value)} placeholder="Instagram, LinkedIn..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sm-campaign">Campagne</Label>
              <Input id="sm-campaign" value={formData.campaignName} onChange={(event) => setField("campaignName", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sm-date">Date de publication</Label>
              <Input id="sm-date" type="datetime-local" value={formData.scheduledFor} onChange={(event) => setField("scheduledFor", event.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sm-status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setField("status", value)}>
                <SelectTrigger id="sm-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_MEDIA_PLAN_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <RichTextEditor
            label="Texte d'accompagnement"
            value={formData.captionHtml}
            onChange={(value) => setField("captionHtml", value)}
            placeholder="Legende, hashtags, CTA..."
          />

          <RichTextEditor
            label="Ad copy"
            value={formData.adCopyHtml}
            onChange={(value) => setField("adCopyHtml", value)}
            placeholder="Copy publicitaire a utiliser pour les creatives ou ads..."
          />

          <RichTextEditor
            label="Brief contextuel"
            value={formData.briefHtml}
            onChange={(value) => setField("briefHtml", value)}
            placeholder="Notes pour aider la creation visuelle..."
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Creer le plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
