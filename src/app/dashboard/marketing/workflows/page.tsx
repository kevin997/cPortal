"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, Plus, RefreshCw, Tags, Workflow as WorkflowIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { JOURNEY_STAGES, STAGE_LABELS, type JourneyStage } from "@/lib/marketing-api";
import { getWachapLabels, syncWachapContacts, type WachapLabel } from "@/lib/messaging-api";

interface Automation {
  id: string; name: string; trigger_type: "lead_created" | "stage_changed"; trigger_stage: JourneyStage | null;
  delay_days: number; message: string; active: boolean; stats: Record<string, number>;
}

const initialForm = { name: "", trigger_type: "lead_created", trigger_stage: "nurturing", delay_days: "3", message: "Bonjour {name}, avez-vous eu le temps de réfléchir à {product} ? Je reste disponible pour répondre à vos questions.", active: false };

async function workflowFetch<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/marketing/workflows${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Action impossible");
  return data as T;
}

export default function WorkflowsPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [labels, setLabels] = useState<WachapLabel[]>([]);
  const [labelsAvailable, setLabelsAvailable] = useState(true);
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [workflows, labelData] = await Promise.all([
        workflowFetch<{ workflows: Automation[] }>(), getWachapLabels(),
      ]);
      setItems(workflows.workflows); setLabels(labelData.labels); setLabelsAvailable(labelData.available);
    } catch (error) { toast({ title: "Chargement impossible", description: error instanceof Error ? error.message : "Erreur", variant: "destructive" }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await workflowFetch("", { method: "POST", body: JSON.stringify({ ...form, delay_days: Number(form.delay_days), trigger_stage: form.trigger_type === "stage_changed" ? form.trigger_stage : null }) });
      setDialogOpen(false); setForm(initialForm); await load();
      toast({ title: "Workflow créé", description: form.active ? "Il est actif immédiatement." : "Activez-le après vérification du message." });
    } catch (error) { toast({ title: "Création impossible", description: error instanceof Error ? error.message : "Erreur", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const toggle = async (item: Automation, active: boolean) => {
    await workflowFetch(`/${item.id}`, { method: "PATCH", body: JSON.stringify({ ...item, active }) });
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, active } : row));
  };

  const sync = async () => {
    setSyncing(true);
    try { const result = await syncWachapContacts(); toast({ title: "Contacts Wachap synchronisés", description: `${result.created} créés, ${result.merged} fusionnés, ${result.skipped} ignorés.` }); }
    catch (error) { toast({ title: "Synchronisation impossible", description: error instanceof Error ? error.message : "Erreur", variant: "destructive" }); }
    finally { setSyncing(false); }
  };

  return <div className="space-y-6 py-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight">Workflows intelligents</h1><p className="text-muted-foreground">Relancez automatiquement les prospects selon leur ancienneté et leur étape CRM.</p></div>
      <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" />Créer un workflow</Button>
    </div>

    <Card className="border-emerald-200 bg-emerald-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-5 w-5 text-emerald-700" />Cadence recommandée</CardTitle><CardDescription>Point de départ commercial à adapter selon le produit et les réponses.</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-3"><div><strong>J+2 à J+3</strong><p className="text-muted-foreground">Première relance utile après capture.</p></div><div><strong>J+5 à J+7</strong><p className="text-muted-foreground">Objection, preuve sociale ou bénéfice.</p></div><div><strong>J+14</strong><p className="text-muted-foreground">Dernière relance douce avant nurturing.</p></div></CardContent></Card>

    <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Tags className="h-4 w-4" />Contacts et étiquettes Wachap</CardTitle><CardDescription>{labelsAvailable ? `${labels.length} étiquette(s) disponible(s).` : "L'API Wachap de production ne fournit pas encore la route d'étiquettes documentée. La synchronisation globale reste disponible."}</CardDescription></div><Button variant="outline" size="sm" onClick={sync} disabled={syncing}>{syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Synchroniser</Button></CardHeader>{labels.length > 0 && <CardContent className="flex flex-wrap gap-2">{labels.map((label) => <Badge key={label.labelId || label.id || label.name} variant="secondary">{label.name}</Badge>)}</CardContent>}</Card>

    {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : items.length === 0 ? <Card><CardContent className="flex flex-col items-center py-12 text-center"><WorkflowIcon className="mb-3 h-10 w-10 text-muted-foreground" /><p className="font-semibold">Aucun workflow</p><p className="text-sm text-muted-foreground">Commencez par une relance trois jours après l'ajout d'un lead.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle className="text-base">{item.name}</CardTitle><CardDescription>{item.trigger_type === "lead_created" ? "Nouveau lead" : `Étape : ${STAGE_LABELS[item.trigger_stage!]}`} · attente {item.delay_days} jour(s)</CardDescription></div><Switch checked={item.active} onCheckedChange={(checked) => toggle(item, checked)} aria-label={`Activer ${item.name}`} /></CardHeader><CardContent><p className="line-clamp-3 text-sm">{item.message}</p><div className="mt-4 flex gap-2"><Badge variant="secondary">{item.stats.pending || 0} en attente</Badge><Badge variant="secondary">{item.stats.sent || 0} envoyés</Badge><Badge variant="secondary">{item.stats.failed || 0} échecs</Badge></div></CardContent></Card>)}</div>}

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Nouveau workflow</DialogTitle></DialogHeader><div className="space-y-4"><div><Label htmlFor="workflow-name">Nom</Label><Input id="workflow-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Relance après ajout" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Déclencheur</Label><Select value={form.trigger_type} onValueChange={(value) => setForm({ ...form, trigger_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lead_created">Lead ajouté</SelectItem><SelectItem value="stage_changed">Étape CRM modifiée</SelectItem></SelectContent></Select></div>{form.trigger_type === "stage_changed" && <div><Label>Étape</Label><Select value={form.trigger_stage} onValueChange={(value) => setForm({ ...form, trigger_stage: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{JOURNEY_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{STAGE_LABELS[stage]}</SelectItem>)}</SelectContent></Select></div>}<div><Label htmlFor="delay">Attendre (jours)</Label><Input id="delay" type="number" min="0" max="365" value={form.delay_days} onChange={(e) => setForm({ ...form, delay_days: e.target.value })} /></div></div><div><Label htmlFor="workflow-message">Message WhatsApp</Label><Textarea id="workflow-message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Variables : {"{name}"}, {"{product}"}, {"{city}"}</p></div><div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Activer immédiatement</p><p className="text-xs text-muted-foreground">Les leads correspondants seront planifiés au prochain cycle.</p></div><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button><Button onClick={save} disabled={saving || !form.name.trim() || !form.message.trim()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Créer</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
