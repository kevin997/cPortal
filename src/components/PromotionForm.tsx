"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface PromotionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: any;
  onSuccess: () => void;
}

export function PromotionForm({ open, onOpenChange, promotion, onSuccess }: PromotionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: promotion?.name || "",
    description: promotion?.description || "",
    rewardAmount: promotion?.rewardAmount || "",
    discountPercent: promotion?.discountPercent || "",
    isActive: promotion?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = promotion ? `/api/promotions/${promotion.id}` : "/api/promotions";
      const method = promotion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save promotion");
      }

      toast({
        title: promotion ? "Promotion mise à jour" : "Promotion créée",
        description: `${formData.name} a été ${promotion ? "mise à jour" : "créée"} avec succès`,
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);

      // Reset form if creating new promotion
      if (!promotion) {
        setFormData({
          name: "",
          description: "",
          rewardAmount: "",
          discountPercent: "",
          isActive: true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promotion ? "Modifier la promotion" : "Nouvelle promotion"}</DialogTitle>
          <DialogDescription>
            {promotion
              ? "Modifiez les détails de cette promotion"
              : "Créez une nouvelle promotion pour votre programme de parrainage"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la promotion *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              disabled={loading}
              placeholder="Promo Rentrée 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={loading}
              placeholder="Description de la promotion..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rewardAmount">Récompense (XAF) *</Label>
              <Input
                id="rewardAmount"
                type="number"
                min="0"
                value={formData.rewardAmount}
                onChange={(e) => handleChange("rewardAmount", e.target.value)}
                required
                disabled={loading}
                placeholder="25000"
              />
              <p className="text-xs text-muted-foreground">
                Montant crédité au parrain
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercent">Réduction (%) *</Label>
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => handleChange("discountPercent", e.target.value)}
                required
                disabled={loading}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground">
                Remise pour le filleul
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="isActive">Promotion active</Label>
              <p className="text-xs text-muted-foreground">
                Rendre cette promotion visible aux affiliés
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : promotion ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
