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

const BENEFICIARY_TYPES = [
  { value: "vendor", label: "Fournisseur" },
  { value: "investor", label: "Investisseur" },
  { value: "partner", label: "Partenaire" },
  { value: "other", label: "Autre" },
] as const;

const PAYMENT_STATUSES = [
  { value: "paid", label: "Paye" },
  { value: "partially_paid", label: "Partiellement paye" },
  { value: "pending", label: "En attente" },
  { value: "overdue", label: "Retard" },
  { value: "cancelled", label: "Annule" },
] as const;

type PaymentStatus = (typeof PAYMENT_STATUSES)[number]["value"];

interface UpcomingPaymentEditData {
  id: string;
  beneficiaryName: string;
  beneficiaryType: "vendor" | "investor" | "partner" | "other";
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  notes: string | null;
}

interface UpcomingPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: UpcomingPaymentEditData | null;
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
    status: "pending" as PaymentStatus,
    notes: "",
  };
}

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function UpcomingPaymentForm({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: UpcomingPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData);

  const isEditing = !!editData;

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setFormData({
        beneficiaryName: editData.beneficiaryName,
        beneficiaryType: editData.beneficiaryType,
        amount: String(editData.amount),
        dueDate: toDateInput(editData.dueDate),
        status: editData.status,
        notes: editData.notes ?? "",
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [open, editData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        beneficiaryName: formData.beneficiaryName.trim(),
        beneficiaryType: formData.beneficiaryType,
        amount: Number(formData.amount),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        notes: formData.notes.trim() || null,
      };

      const url = isEditing
        ? `/api/caisse/upcoming-payments/${editData!.id}`
        : "/api/caisse/upcoming-payments";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save upcoming payment");
      }

      toast({
        title: isEditing ? "Paiement modifie" : "Paiement planifie",
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
          <DialogTitle>
            {isEditing ? "Modifier le paiement" : "Nouveau paiement a venir"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les details du paiement planifie."
              : "Ajoutez une sortie prevue pour un fournisseur, investisseur ou partenaire."}
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
            <SearchableSelect
              id="beneficiaryType"
              value={formData.beneficiaryType}
              onValueChange={(value) => handleChange("beneficiaryType", value)}
              disabled={loading}
              placeholder="Selectionner un type"
              searchPlaceholder="Rechercher un type..."
              emptyText="Aucun type trouve."
              options={BENEFICIARY_TYPES.map((type) => ({
                value: type.value,
                label: type.label,
              }))}
            />
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
            <Label htmlFor="paymentStatus">Statut du paiement *</Label>
            <SearchableSelect
              id="paymentStatus"
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
              disabled={loading}
              placeholder="Selectionner un statut"
              searchPlaceholder="Rechercher un statut..."
              emptyText="Aucun statut trouve."
              options={PAYMENT_STATUSES.map((status) => ({
                value: status.value,
                label: status.label,
              }))}
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
              {loading
                ? "Enregistrement..."
                : isEditing
                  ? "Modifier"
                  : "Planifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
