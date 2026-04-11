"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { COLLABORATOR_ROLE_OPTIONS } from "@/lib/content";

interface CollaboratorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "collaborator",
};

export function CollaboratorForm({
  open,
  onOpenChange,
  onSuccess,
}: CollaboratorFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setFormData(initialForm);
    }
  }, [open]);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create collaborator");
      }

      toast({
        title: "Collaborateur cree",
        description: `${formData.name} peut maintenant se connecter avec son email.`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de creer le collaborateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nouveau collaborateur</DialogTitle>
          <DialogDescription>
            Creez un compte interne pour l&apos;equipe contenu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="collab-name">Nom complet</Label>
              <Input
                id="collab-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Ex. Marie N."
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collab-email">Email</Label>
              <Input
                id="collab-email"
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="nom@csl-brands.com"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collab-phone">Telephone</Label>
              <Input
                id="collab-phone"
                value={formData.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="+237..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collab-password">Mot de passe</Label>
              <Input
                id="collab-password"
                type="password"
                value={formData.password}
                onChange={(event) => handleChange("password", event.target.value)}
                placeholder="Minimum 8 caracteres"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collab-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange("role", value)}
                disabled={loading}
              >
                <SelectTrigger id="collab-role">
                  <SelectValue placeholder="Choisir un role" />
                </SelectTrigger>
                <SelectContent>
                  {COLLABORATOR_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creation..." : "Creer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
