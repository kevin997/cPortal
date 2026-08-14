"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Loader2, Search, Send, Users } from "lucide-react";
import {
  getList,
  getListContacts,
  type ContactList,
  type ListContactRow,
} from "@/lib/messaging-api";

const PAGE_SIZE = 50;

/**
 * The contacts inside one list. Paginated and searchable server-side -- a
 * synced list can hold thousands of numbers, so it is never fetched whole.
 */
export default function ListeDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = params?.id;

  const [list, setList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<ListContactRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!listId) return;
    getList(listId)
      .then(setList)
      .catch(() => setNotFound(true));
  }, [listId]);

  const load = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    try {
      const data = await getListContacts(listId, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        q: query,
      });
      setContacts(data.contacts);
      setTotal(data.total);
    } catch (error) {
      toast({
        title: "Contacts indisponibles",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [listId, page, query]);

  useEffect(() => {
    load();
  }, [load]);

  // Searching from page 3 of the old result set would show an empty page.
  const applySearch = () => {
    setPage(0);
    setQuery(search);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (notFound) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Cette liste est introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/marketing/listes">
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Retour aux listes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-7 px-2">
            <Link href="/dashboard/marketing/listes">
              <ChevronLeft className="mr-1 h-4 w-4" /> Listes
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {list?.name ?? "Liste"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} contact{total > 1 ? "s" : ""}
            {query ? ` correspondant à « ${query} »` : ""}
          </p>
        </div>
        {listId && (
          <Button asChild>
            <Link href={`/dashboard/marketing/messagerie?listId=${listId}`}>
              <Send className="mr-2 h-4 w-4" /> Envoyer à cette liste
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un numéro ou un nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={applySearch}>
          Rechercher
        </Button>
        {query && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setQuery("");
              setPage(0);
            }}
          >
            Effacer
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des contacts…
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                {query ? "Aucun contact ne correspond à cette recherche." : "Cette liste est vide."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead className="w-32">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name?.trim() || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">+{contact.phone}</TableCell>
                    <TableCell>
                      {contact.opted_out ? (
                        <Badge variant="destructive">Désinscrit</Badge>
                      ) : (
                        <Badge variant="secondary">Actif</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
