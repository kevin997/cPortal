"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Check, Eye, EyeOff, Loader2, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import {
  createService,
  deleteService,
  getServices,
  updateService,
  type CatalogService,
} from "@/lib/messaging-api";

/**
 * The service list offered in the WhatsApp extension.
 *
 * It lived as a hardcoded array in the extension's content script, so adding
 * an offering meant rebuilding and redistributing the extension. Editing here
 * reaches every installed extension the next time a panel is opened.
 */
export default function ServicesPage() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setServices(await getServices(true));
    } catch (error) {
      toast({
        title: "Services indisponibles",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      setServices([]);
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
      await createService(name);
      setNewName("");
      toast({ title: "Service ajouté", description: name, variant: "success" });
      await refresh();
    } catch (error) {
      toast({
        title: "Ajout impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (service: CatalogService) => {
    const name = editingName.trim();
    if (!name || name === service.name) {
      setEditingId(null);
      return;
    }
    setBusyId(service.id);
    try {
      await updateService(service.id, { name });
      setEditingId(null);
      await refresh();
    } catch (error) {
      toast({
        title: "Renommage impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (service: CatalogService) => {
    setBusyId(service.id);
    try {
      await updateService(service.id, { active: !service.active });
      await refresh();
    } catch (error) {
      toast({
        title: "Modification impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service: CatalogService) => {
    setBusyId(service.id);
    try {
      await deleteService(service.id);
      toast({ title: "Service supprimé", description: service.name });
      await refresh();
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Tags className="h-5 w-5" /> Services proposés
          </h1>
          <p className="text-sm text-muted-foreground">
            La liste recherchable affichée dans l&apos;extension WhatsApp.{" "}
            {loading ? "Chargement…" : `${activeCount} actif(s) sur ${services.length}.`}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Input
            placeholder="Nouveau service (ex. Mentorat)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            className="w-72"
          />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des services…
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Tags className="h-8 w-8 opacity-40" />
              <p className="text-sm">Aucun service enregistré.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="w-32">État</TableHead>
                  <TableHead className="w-64 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className={service.active ? "" : "opacity-60"}>
                    <TableCell className="font-medium">
                      {editingId === service.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(service);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="h-8 max-w-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRename(service)}
                            disabled={busyId === service.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        service.name
                      )}
                    </TableCell>
                    <TableCell>
                      {service.active ? (
                        <Badge variant="secondary">Actif</Badge>
                      ) : (
                        <Badge variant="outline">Masqué</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === service.id || editingId === service.id}
                          onClick={() => {
                            setEditingId(service.id);
                            setEditingName(service.name);
                          }}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Renommer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === service.id}
                          onClick={() => handleToggle(service)}
                          title={
                            service.active
                              ? "Masquer dans l'extension sans le supprimer"
                              : "Réafficher dans l'extension"
                          }
                        >
                          {service.active ? (
                            <EyeOff className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <Eye className="mr-1 h-3.5 w-3.5" />
                          )}
                          {service.active ? "Masquer" : "Afficher"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={busyId === service.id}
                          onClick={() => handleDelete(service)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <p className="text-xs text-muted-foreground">
        « Masquer » retire un service de la liste sans l&apos;effacer. Les leads déjà
        enregistrés conservent le service choisi à l&apos;époque, même après suppression.
      </p>
    </div>
  );
}
