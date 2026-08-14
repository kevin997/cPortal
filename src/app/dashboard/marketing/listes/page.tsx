"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ChevronRight, Loader2, Plus, Send, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createList, getLists, type ContactList } from "@/lib/messaging-api";

/**
 * Browse the contact lists we've built. Until now lists could be created and
 * messaged but never inspected -- there was no way to see what was actually
 * inside one before sending to it.
 */
export default function ListesPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLists(await getLists());
    } catch (error) {
      toast({
        title: "Listes indisponibles",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createList(name);
      setNewName("");
      toast({ title: "Liste créée", description: name });
      await refresh();
    } catch (error) {
      toast({
        title: "Création impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const totalContacts = lists.reduce((sum, l) => sum + (l.count ?? 0), 0);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listes de contacts</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Chargement…"
              : `${lists.length} liste${lists.length > 1 ? "s" : ""} · ${totalContacts} contact${
                  totalContacts > 1 ? "s" : ""
                }`}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Input
              placeholder="Nom de la nouvelle liste"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              className="w-64"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Créer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des listes…
            </div>
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">Aucune liste pour le moment.</p>
              <p className="text-xs">Créez-en une ci-dessus, puis ajoutez-y des contacts.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="w-32">Contacts</TableHead>
                  <TableHead className="w-44">Créée le</TableHead>
                  <TableHead className="w-56 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/marketing/listes/${list.id}`}
                        className="hover:underline"
                      >
                        {list.name}
                      </Link>
                    </TableCell>
                    <TableCell>{list.count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {list.created_at
                        ? format(new Date(list.created_at), "dd MMM yyyy", { locale: fr })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/marketing/messagerie?listId=${list.id}`}>
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Envoyer
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/marketing/listes/${list.id}`}>
                            Ouvrir
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
