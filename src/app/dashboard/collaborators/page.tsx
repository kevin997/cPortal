"use client";

import { useEffect, useState } from "react";
import { PlusCircle, RefreshCw } from "lucide-react";
import { CollaboratorForm } from "@/components/CollaboratorForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getCollaboratorRoleLabel } from "@/lib/content";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  createdBy?: {
    name: string;
  } | null;
}

export default function CollaboratorsPage() {
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const fetchCollaborators = async () => {
    try {
      const response = await fetch("/api/admin/collaborators");
      if (!response.ok) {
        throw new Error("Failed to fetch collaborators");
      }
      const data = await response.json();
      setCollaborators(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les collaborateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collaborateurs</h1>
          <p className="text-muted-foreground">
            Les admins creent ici les comptes internes qui se connecteront au panel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCollaborators}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total comptes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{collaborators.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Direction creation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {collaborators.filter((item) => item.role === "creative_director").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Social media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {collaborators.filter((item) => item.role === "social_media_manager").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes internes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun collaborateur ajoute.</p>
          ) : (
            collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{collaborator.name}</p>
                    <Badge variant="outline">{getCollaboratorRoleLabel(collaborator.role)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Cree le {new Date(collaborator.createdAt).toLocaleDateString("fr-FR")}
                    {collaborator.createdBy?.name ? ` par ${collaborator.createdBy.name}` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CollaboratorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchCollaborators}
      />
    </div>
  );
}
