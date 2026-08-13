"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Search, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { EshuCrmLead, getEshuCrmLeads } from "@/lib/marketing-api";

const PER_PAGE = 20;
const NEEDS: Record<string, string> = {
  sales: "Convertir plus de ventes",
  follow_up: "Automatiser les relances",
  support: "Suivre le service client",
  campaigns: "Lancer des campagnes",
  automation: "Automatiser avec l’IA",
};

export default function EshuCrmLeadsPage() {
  const [items, setItems] = useState<EshuCrmLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEshuCrmLeads({ q: search || undefined, page, per_page: PER_PAGE });
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      toast({
        title: "Impossible de charger les onboardings Eshu CRM",
        description: error instanceof Error ? error.message : "Service indisponible",
        variant: "destructive",
      });
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6 py-6">
      <section className="overflow-hidden rounded-3xl bg-[#12372d] px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" /> Acquisition Eshu CRM
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Eshu CRM Leads</h1>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Les entreprises qui ont créé leur compte et terminé la qualification CRM avant l’achat.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3">
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-emerald-50/65">onboarding{total > 1 ? "s" : ""} capturé{total > 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nom, entreprise, e-mail ou WhatsApp…" className="pl-9" />
      </div>

      {loading ? (
        <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-14 text-center"><Users className="h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">Aucun onboarding trouvé</p><p className="mt-1 text-sm text-muted-foreground">Les nouveaux comptes Eshu CRM apparaîtront automatiquement ici.</p></CardContent></Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Contact</TableHead><TableHead>Entreprise</TableHead><TableHead>WhatsApp</TableHead><TableHead>Équipe</TableHead><TableHead>Besoin principal</TableHead><TableHead>Créé le</TableHead><TableHead /></TableRow></TableHeader><TableBody>
              {items.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.full_name}</p><p className="text-xs text-muted-foreground">{item.email}</p></TableCell><TableCell>{item.business_name}</TableCell><TableCell>{item.whatsapp_number}</TableCell><TableCell><Badge variant="outline">{item.team_size}</Badge></TableCell><TableCell>{NEEDS[item.primary_need] || item.primary_need}</TableCell><TableCell>{format(new Date(item.created_at), "d MMM yyyy, HH:mm", { locale: fr })}</TableCell><TableCell><Button asChild variant="ghost" size="icon-sm"><a href={`https://wa.me/${item.phone_normalized.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`Contacter ${item.full_name}`}><ExternalLink className="h-4 w-4" /></a></Button></TableCell></TableRow>)}
            </TableBody></Table></CardContent>
          </Card>

          <div className="grid gap-3 md:hidden">{items.map((item) => <Card key={item.id}><CardContent className="space-y-3 py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.full_name}</p><p className="text-sm text-muted-foreground">{item.business_name}</p></div><Badge variant="outline">{item.team_size}</Badge></div><div className="text-sm"><p>{item.whatsapp_number}</p><p className="text-muted-foreground">{item.email}</p></div><div className="flex items-center justify-between gap-3 border-t pt-3"><span className="text-xs text-muted-foreground">{NEEDS[item.primary_need] || item.primary_need}</span><Button asChild size="sm"><a href={`https://wa.me/${item.phone_normalized.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp <ExternalLink className="h-3.5 w-3.5" /></a></Button></div></CardContent></Card>)}</div>

          <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{total} lead{total > 1 ? "s" : ""} · page {page}/{pages}</p><div className="flex gap-2"><Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></Button></div></div>
        </>
      )}
      <p className="text-xs text-muted-foreground">Ces contacts restent aussi disponibles dans le pipeline <Link href="/dashboard/marketing/leads?source=eshu-crm" className="font-medium text-primary hover:underline">Contacts marketing</Link> pour les campagnes et workflows.</p>
    </div>
  );
}
