"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreativeAssetPicker } from "@/components/CreativeAssetPicker";
import { toast } from "@/hooks/use-toast";

interface RequestAssetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  requestReference?: string | null;
  onSuccess: () => void;
}

export function RequestAssetUploadDialog({
  open,
  onOpenChange,
  requestId,
  requestReference,
  onSuccess,
}: RequestAssetUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFiles([]);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!requestId || files.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`/api/content/requests/${requestId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload files");
      }

      toast({
        title: "Fichiers envoyes",
        description: `${files.length} fichier(s) ajoute(s) a ${requestReference || "la fiche"}.`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer les fichiers",
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
          <DialogTitle>Ajouter des fichiers</DialogTitle>
          <DialogDescription>
            Uploadez les supports Cloudinary pour aider l&apos;equipe creative a comprendre la demande.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CreativeAssetPicker files={files} onChange={setFiles} disabled={loading} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || files.length === 0 || !requestId}>
              {loading ? "Upload..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
