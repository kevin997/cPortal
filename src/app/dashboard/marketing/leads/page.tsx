"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircleMore,
  MessageSquareText,
  Phone,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getLead,
  getLeads,
  JOURNEY_STAGES,
  JourneyStage,
  Lead,
  LeadDetail,
  STAGE_BADGE_CLASSNAMES,
  STAGE_LABELS,
  updateLead,
} from "@/lib/marketing-api";

const PER_PAGE = 20;

function formatValue(value: number | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return format(new Date(date), "d MMM yyyy", { locale: fr });
}

function StageBadge({ stage }: { stage: JourneyStage }) {
  return (
    <Badge className={STAGE_BADGE_CLASSNAMES[stage]}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

function LeadsPageContent() {
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [stageFilter, setStageFilter] = useState(
    searchParams.get("stage") || "all"
  );
  const [productFilter, setProductFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editStage, setEditStage] = useState<JourneyStage>("new");
  const [editNotes, setEditNotes] = useState("");
  const [editOptOut, setEditOptOut] = useState(false);
  const [saving, setSaving] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads({
        stage: stageFilter,
        product: productFilter,
        country: countryFilter,
        q: search || undefined,
        page,
        per_page: PER_PAGE,
      });
      setLeads(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de charger les leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [stageFilter, productFilter, countryFilter, search, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const openLead = async (lead: Lead) => {
    setSheetOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getLead(lead.id);
      setSelectedLead(detail);
      setEditStage(detail.stage);
      setEditNotes("");
      setEditOptOut(detail.opt_out);
    } catch (error) {
      console.error("Error fetching lead detail:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de charger le lead",
        variant: "destructive",
      });
      setSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      await updateLead(selectedLead.id, {
        stage: editStage,
        opt_out: editOptOut,
        ...(editNotes ? { notes: editNotes } : {}),
      });
      toast({
        title: "Lead mis à jour",
        description: "Les modifications ont été enregistrées",
        variant: "success",
      });
      setSheetOpen(false);
      fetchLeads();
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de mettre à jour le lead",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
        <p className="text-muted-foreground">
          Suivez et qualifiez les prospects de la campagne marketing
        </p>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-primary/[0.035]">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold">Contacter cette audience</p>
            <p className="text-sm text-muted-foreground">
              Préparez une liste de 50 contacts par page, puis lancez une campagne depuis ce filtre.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <Button variant="outline" asChild>
              <Link
                href={`/dashboard/marketing/messagerie?stage=${encodeURIComponent(stageFilter)}&channel=sms`}
              >
                <MessageSquareText className="w-4 h-4" />
                Campagne SMS
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={`/dashboard/marketing/messagerie?stage=${encodeURIComponent(stageFilter)}&channel=whatsapp`}
              >
                <MessageCircleMore className="w-4 h-4" />
                Campagne WhatsApp
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={stageFilter}
          onValueChange={(value) => {
            setStageFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Étape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les étapes</SelectItem>
            {JOURNEY_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Produit / Service"
          value={productFilter === "all" ? "" : productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value || "all");
            setPage(1);
          }}
          className="w-full sm:w-[180px]"
        />
        <Input
          placeholder="Pays"
          value={countryFilter === "all" ? "" : countryFilter}
          onChange={(e) => {
            setCountryFilter(e.target.value || "all");
            setPage(1);
          }}
          className="w-full sm:w-[160px]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun lead ne correspond aux filtres sélectionnés
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Produit / Service</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Étape</TableHead>
                    <TableHead>Dernier contact</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => openLead(lead)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.phone_normalized || lead.phone_raw}</TableCell>
                      <TableCell>{lead.product_interest || "-"}</TableCell>
                      <TableCell>{lead.city || "-"}</TableCell>
                      <TableCell>
                        <StageBadge stage={lead.stage} />
                      </TableCell>
                      <TableCell>{formatDate(lead.last_contacted_at)}</TableCell>
                      <TableCell className="text-right">
                        {formatValue(lead.value_fcfa)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer active:bg-accent/50 transition-colors"
                onClick={() => openLead(lead)}
              >
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone_normalized || lead.phone_raw}
                      </p>
                    </div>
                    <StageBadge stage={lead.stage} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{lead.product_interest || "-"}</span>
                    <span>{lead.city || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDate(lead.last_contacted_at)}
                    </span>
                    <span className="font-medium">
                      {formatValue(lead.value_fcfa)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} lead{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Lead detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailLoading || !selectedLead ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLead.name}</SheetTitle>
                <SheetDescription>
                  {selectedLead.phone_normalized || selectedLead.phone_raw}
                  {selectedLead.email ? ` · ${selectedLead.email}` : ""}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Entreprise</p>
                    <p className="font-medium">{selectedLead.company || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ville / Pays</p>
                    <p className="font-medium">
                      {[selectedLead.city, selectedLead.country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Produit / Service</p>
                    <p className="font-medium">
                      {selectedLead.product_interest || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valeur estimée</p>
                    <p className="font-medium">
                      {formatValue(selectedLead.value_fcfa)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Source</p>
                    <p className="font-medium">
                      {selectedLead.source_sheet || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dernier contact</p>
                    <p className="font-medium">
                      {formatDate(selectedLead.last_contacted_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Étape du parcours</Label>
                  <Select
                    value={editStage}
                    onValueChange={(value) => setEditStage(value as JourneyStage)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOURNEY_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {STAGE_LABELS[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="opt-out" className="font-medium">
                      Ne plus contacter (opt-out)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Exclut ce lead des campagnes WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="opt-out"
                    checked={editOptOut}
                    onCheckedChange={setEditOptOut}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ajouter une note..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Historique</Label>
                  {selectedLead.events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun événement enregistré
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {selectedLead.events.map((event, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 text-sm border-l-2 border-muted pl-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{event.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), "d MMM yyyy 'à' HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LeadsPageContent />
    </Suspense>
  );
}
