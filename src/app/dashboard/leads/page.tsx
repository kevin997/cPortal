"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Loader2,
  Users,
  Phone,
  Mail,
  Calendar,
  User,
  Gift,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  convertedAt: string | null;
  referrer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  promotion: {
    id: string;
    name: string;
    rewardAmount: number;
    discountPercent: number;
  };
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "contacted", label: "Contacté" },
  { value: "converted", label: "Converti" },
  { value: "lost", label: "Perdu" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    notes: "",
  });

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/leads?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      status: lead.status,
      notes: lead.notes || "",
    });
    setEditOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      toast({
        title: "Lead mis à jour",
        description: data.credited
          ? `${selectedLead.referrer.name} a été crédité de ${formatCurrency(data.creditedAmount)}`
          : "Le statut du lead a été mis à jour",
        variant: "success",
      });

      fetchLeads();
      setEditOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " XAF";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-200", label: "En attente" },
      contacted: { className: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Contacté" },
      converted: { className: "bg-green-500/10 text-green-600 border-green-200", label: "Converti" },
      lost: { className: "bg-gray-500/10 text-gray-600 border-gray-200", label: "Perdu" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      lead.referrer.name.toLowerCase().includes(query) ||
      lead.promotion.name.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: leads.length,
    pending: leads.filter((l) => l.status === "pending").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
        <p className="text-muted-foreground">
          Gérez les prospects référés par vos affiliés
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Contactés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Convertis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone, parrain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-2">Aucun lead trouvé</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Les leads apparaîtront ici quand vos affiliés partageront leurs liens"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEditClick(lead)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{lead.name}</h3>
                      {getStatusBadge(lead.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </span>
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <User className="w-3 h-3" />
                      {lead.referrer.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3 text-primary" />
                      <span className="font-medium">{lead.promotion.name}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Lead Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Détails du lead</DialogTitle>
            <DialogDescription>
              Mettez à jour le statut et ajoutez des notes
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nom</span>
                  <span className="font-medium">{selectedLead.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Téléphone</span>
                  <a href={`tel:${selectedLead.phone}`} className="font-medium text-primary">
                    {selectedLead.phone}
                  </a>
                </div>
                {selectedLead.email && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <a href={`mailto:${selectedLead.email}`} className="font-medium text-primary">
                      {selectedLead.email}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Promotion</span>
                  <span className="font-medium">{selectedLead.promotion.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parrain</span>
                  <span className="font-medium">{selectedLead.referrer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Récompense parrain</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(selectedLead.promotion.rewardAmount)}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="contacted">Contacté</SelectItem>
                    <SelectItem value="converted">Converti</SelectItem>
                    <SelectItem value="lost">Perdu</SelectItem>
                  </SelectContent>
                </Select>
                {editForm.status === "converted" && selectedLead.status !== "converted" && (
                  <p className="text-xs text-green-600 bg-green-500/10 p-2 rounded">
                    Le parrain sera crédité de {formatCurrency(selectedLead.promotion.rewardAmount)}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajouter des notes sur ce lead..."
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updating}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateLead} disabled={updating}>
              {updating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
