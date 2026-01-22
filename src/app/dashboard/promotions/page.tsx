"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromotionForm } from "@/components/PromotionForm";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Gift, Users } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  rewardAmount: number;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    leads: number;
  };
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletePromotion, setDeletePromotion] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPromotions = async () => {
    try {
      const response = await fetch("/api/promotions");
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletePromotion) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/promotions/${deletePromotion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete promotion");
      }

      toast({
        title: "Promotion supprimée",
        description: `${deletePromotion.name} a été supprimée`,
        variant: "success",
      });

      fetchPromotions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeletePromotion(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " XAF";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Promotions</h2>
          <p className="text-muted-foreground">
            Gérez vos campagnes de parrainage
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPromotion(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {promotions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-2">Aucune promotion</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première promotion pour lancer votre programme de parrainage
            </p>
            <Button
              onClick={() => {
                setEditingPromotion(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une promotion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promotions.map((promotion) => (
            <Card key={promotion.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {promotion.name}
                    </CardTitle>
                    {promotion.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {promotion.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    className={
                      promotion.isActive
                        ? "bg-green-500/10 text-green-600 border-green-200"
                        : "bg-gray-500/10 text-gray-600 border-gray-200"
                    }
                  >
                    {promotion.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Récompense</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(promotion.rewardAmount)}
                    </p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Réduction</p>
                    <p className="text-lg font-bold">{promotion.discountPercent}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{promotion._count.leads} leads générés</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(promotion)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeletePromotion(promotion)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PromotionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        promotion={editingPromotion}
        onSuccess={fetchPromotions}
      />

      <AlertDialog open={!!deletePromotion} onOpenChange={() => setDeletePromotion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la promotion ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deletePromotion?.name}" ?
              Cette action est irréversible et supprimera également tous les leads associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
