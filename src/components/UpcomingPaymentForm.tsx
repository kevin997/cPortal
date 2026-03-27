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

const BENEFICIARY_TYPES = [
  { value: "vendor", label: "Fournisseur" },
  { value: "investor", label: "Investisseur" },
  { value: "partner", label: "Partenaire" },
  { value: "other", label: "Autre" },
] as const;

interface UpcomingPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function nextWeekDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function getInitialFormData() {
  return {
    beneficiaryName: "",
    beneficiaryType: "",
    amount: "",
    dueDate: nextWeekDate(),
    notes: "",
  };
}

export function UpcomingPaymentForm({
  open,
  onOpenChange,
  onSuccess,
}: UpcomingPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData);

  useEffect(() => {
    if (!open) {
      setFormData(getInitialFormData());
    }
  }, [open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/caisse/upcoming-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryName: formData.beneficiaryName.trim(),
          beneficiaryType: formData.beneficiaryType,
          amount: Number(formData.amount),
          dueDate: new Date(formData.dueDate).toISOString(),
          notes: formData.notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save upcoming payment");
      }

      toast({
        title: "Paiement planifie",
        description: `${Number(formData.amount).toLocaleString("fr-FR")} FCFA pour ${formData.beneficiaryName}`,
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);
      setFormData(getInitialFormData());
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Nouveau paiement a venir</DialogTitle>
          <DialogDescription>
            Ajoutez une sortie prevue pour un fournisseur, investisseur ou partenaire.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiaryName">Beneficiaire *</Label>
            <Input
              id="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={(e) => handleChange("beneficiaryName", e.target.value)}
              placeholder="Ex. Fournisseur X"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiaryType">Type *</Label>
            <Select
              value={formData.beneficiaryType}
              onValueChange={(value) => handleChange("beneficiaryType", value)}
              disabled={loading}
            >
              <SelectTrigger id="beneficiaryType">
                <SelectValue placeholder="Selectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {BENEFICIARY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upcomingAmount">Montant (FCFA) *</Label>
            <Input
              id="upcomingAmount"
              type="number"
              min="1"
              step="1"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="0"
              required
              disabled={loading}
              className="text-xl font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Date d'echeance *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upcomingNotes">Notes</Label>
            <Textarea
              id="upcomingNotes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Details du paiement..."
              rows={3}
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
                !formData.beneficiaryName ||
                !formData.beneficiaryType ||
                !formData.amount ||
                !formData.dueDate
              }
            >
              {loading ? "Enregistrement..." : "Planifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
