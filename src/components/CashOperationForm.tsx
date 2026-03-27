"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Vente",
  "Achat",
  "Salaire",
  "Loyer",
  "Transport",
  "Autre",
];

interface CashOperationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "in" | "out";
  onSuccess: () => void;
}

function nowDatetimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CashOperationForm({
  open,
  onOpenChange,
  defaultType = "in",
  onSuccess,
}: CashOperationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: defaultType,
    amount: "",
    category: "",
    description: "",
    date: nowDatetimeLocal(),
  });

  useEffect(() => {
    if (!open) return;
    setFormData((prev) => ({
      ...prev,
      type: defaultType,
    }));
  }, [defaultType, open]);

  // Keep type in sync when parent changes defaultType (e.g. shortcut buttons)
  const effectiveType = formData.type as "in" | "out";

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/caisse/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: effectiveType,
          amount: Number(formData.amount),
          category: formData.category,
          description: formData.description || null,
          date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save operation");
      }

      toast({
        title: effectiveType === "in" ? "Entrée enregistrée" : "Sortie enregistrée",
        description: `${Number(formData.amount).toLocaleString("fr-FR")} FCFA — ${formData.category}`,
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);

      setFormData({
        type: defaultType,
        amount: "",
        category: "",
        description: "",
        date: nowDatetimeLocal(),
      });
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

  const isIn = effectiveType === "in";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {isIn ? "Nouvelle Entrée" : "Nouvelle Sortie"}
          </DialogTitle>
          <DialogDescription>
            Enregistrez une{" "}
            {isIn ? "entrée" : "sortie"} de caisse
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChange("type", "in")}
              className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                isIn
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              + Entrée
            </button>
            <button
              type="button"
              onClick={() => handleChange("type", "out")}
              className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                !isIn
                  ? "bg-rose-600 text-white border-rose-600"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              − Sortie
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
              disabled={loading}
              autoFocus
              className="text-xl font-bold"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => handleChange("category", v)}
              disabled={loading}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date et heure</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Détails de l'opération..."
              rows={2}
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
            <Button
              type="submit"
              disabled={loading || !formData.amount || !formData.category}
              className={
                isIn
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
