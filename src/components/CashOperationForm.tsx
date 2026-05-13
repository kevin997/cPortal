"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/SearchableSelect";

const CATEGORIES = [
  "Vente",
  "Achat",
  "Salaire",
  "Loyer",
  "Transport",
  "Internet",
  "Courant",
  "Marketing digital et E-commerce",
  "Publicite",
  "Impressions",
  "Materiel",
  "Fournitures",
  "Maintenance",
  "Communication",
  "Taxes et impots",
  "Autre",
];

const CUSTOM_CATEGORY_VALUE = "__custom__";

interface CashOperationEditData {
  id: string;
  type: "in" | "out";
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface CashOperationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "in" | "out";
  editData?: CashOperationEditData | null;
  onSuccess: () => void;
}

function nowDatetimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CashOperationForm({
  open,
  onOpenChange,
  defaultType = "in",
  editData,
  onSuccess,
}: CashOperationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: defaultType,
    amount: "",
    category: "",
    customCategory: "",
    description: "",
    date: nowDatetimeLocal(),
  });

  const isEditing = !!editData;

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setFormData({
        type: editData.type,
        amount: String(editData.amount),
        category: CATEGORIES.includes(editData.category) ? editData.category : CUSTOM_CATEGORY_VALUE,
        customCategory: CATEGORIES.includes(editData.category) ? "" : editData.category,
        description: editData.description ?? "",
        date: toDatetimeLocal(editData.date),
      });
    } else {
      setFormData({
        type: defaultType,
        amount: "",
        category: "",
        customCategory: "",
        description: "",
        date: nowDatetimeLocal(),
      });
    }
  }, [defaultType, open, editData]);

  // Keep type in sync when parent changes defaultType (e.g. shortcut buttons)
  const effectiveType = formData.type as "in" | "out";

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const category =
        formData.category === CUSTOM_CATEGORY_VALUE
          ? formData.customCategory.trim()
          : formData.category;
      const payload = {
        type: effectiveType,
        amount: Number(formData.amount),
        category,
        description: formData.description || null,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      };

      const url = isEditing
        ? `/api/caisse/operations/${editData!.id}`
        : "/api/caisse/operations";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save operation");
      }

      toast({
        title: isEditing
          ? "Opération modifiée"
          : effectiveType === "in"
            ? "Entrée enregistrée"
            : "Sortie enregistrée",
        description: `${Number(formData.amount).toLocaleString("fr-FR")} FCFA - ${category}`,
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);

      setFormData({
        type: defaultType,
        amount: "",
        category: "",
        customCategory: "",
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
            {isEditing
              ? "Modifier l'opération"
              : isIn
                ? "Nouvelle Entrée"
                : "Nouvelle Sortie"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les détails de l'opération"
              : `Enregistrez une ${isIn ? "entrée" : "sortie"} de caisse`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChange("type", "in")}
              className={`py-2 rounded-md text-sm font-medium border transition-colors ${isIn
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-border text-muted-foreground hover:bg-accent"
                }`}
            >
              + Entrée
            </button>
            <button
              type="button"
              onClick={() => handleChange("type", "out")}
              className={`py-2 rounded-md text-sm font-medium border transition-colors ${!isIn
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
            <SearchableSelect
              id="category"
              value={formData.category}
              onValueChange={(v) => handleChange("category", v)}
              disabled={loading}
              placeholder="Sélectionner une catégorie"
              searchPlaceholder="Rechercher une catégorie..."
              emptyText="Aucune catégorie trouvée."
              options={[
                ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                { value: CUSTOM_CATEGORY_VALUE, label: "Nouvelle categorie" },
              ]}
            />
          </div>

          {formData.category === CUSTOM_CATEGORY_VALUE && (
            <div className="space-y-2">
              <Label htmlFor="customCategory">Nom de la categorie *</Label>
              <Input
                id="customCategory"
                value={formData.customCategory}
                onChange={(e) => handleChange("customCategory", e.target.value)}
                placeholder="Ex. Equipements, Assurance..."
                required
                disabled={loading}
              />
            </div>
          )}

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
              disabled={
                loading ||
                !formData.amount ||
                !formData.category ||
                (formData.category === CUSTOM_CATEGORY_VALUE && !formData.customCategory.trim())
              }
              className={
                isIn
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            >
              {loading
                ? "Enregistrement..."
                : isEditing
                  ? "Modifier"
                  : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
