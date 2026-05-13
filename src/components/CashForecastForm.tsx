"use client";

import { useEffect, useMemo, useState } from "react";
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

interface CashForecastEditData {
  id: string;
  department: string;
  quantity: number;
  unitPrice: number;
  total: number;
  deadline: string;
  report: string | null;
}

interface CashForecastFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: CashForecastEditData | null;
  onSuccess: () => void;
}

function nextMonthDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function getInitialFormData() {
  return {
    department: "",
    quantity: "1",
    unitPrice: "",
    deadline: nextMonthDate(),
    report: "",
  };
}

export function CashForecastForm({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: CashForecastFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData);
  const isEditing = !!editData;

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setFormData({
        department: editData.department,
        quantity: String(editData.quantity),
        unitPrice: String(editData.unitPrice),
        deadline: toDateInput(editData.deadline),
        report: editData.report ?? "",
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [open, editData]);

  const total = useMemo(() => {
    const quantity = Number(formData.quantity);
    const unitPrice = Number(formData.unitPrice);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
    return Math.max(0, Math.round(quantity) * Math.round(unitPrice));
  }, [formData.quantity, formData.unitPrice]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        department: formData.department.trim(),
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        deadline: new Date(formData.deadline).toISOString(),
        report: formData.report.trim() || null,
      };

      const url = isEditing
        ? `/api/caisse/forecasts/${editData!.id}`
        : "/api/caisse/forecasts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save forecast");
      }

      toast({
        title: isEditing ? "Prevision modifiee" : "Prevision ajoutee",
        description: `${total.toLocaleString("fr-FR")} FCFA - ${formData.department}`,
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
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la prevision" : "Nouvelle prevision"}
          </DialogTitle>
          <DialogDescription>
            Renseignez le departement, la quantite, le prix et le delai.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forecastDepartment">Departement *</Label>
            <Input
              id="forecastDepartment"
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="Ex. Marketing, Operations..."
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="forecastQuantity">Qte *</Label>
              <Input
                id="forecastQuantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forecastUnitPrice">Prix unitaire (FCFA) *</Label>
              <Input
                id="forecastUnitPrice"
                type="number"
                min="1"
                step="1"
                value={formData.unitPrice}
                onChange={(e) => handleChange("unitPrice", e.target.value)}
                placeholder="0"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{total.toLocaleString("fr-FR")} FCFA</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forecastDeadline">Delai *</Label>
            <Input
              id="forecastDeadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange("deadline", e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forecastReport">Reports</Label>
            <Textarea
              id="forecastReport"
              value={formData.report}
              onChange={(e) => handleChange("report", e.target.value)}
              placeholder="Notes, justification, report ou suivi..."
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
                !formData.department.trim() ||
                !formData.quantity ||
                !formData.unitPrice ||
                !formData.deadline
              }
            >
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
