"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Send, UserPlus, Users } from "lucide-react";
import {
  JOURNEY_STAGES,
  STAGE_BADGE_CLASSNAMES,
  STAGE_LABELS,
  getJourneySummary,
  getLeads,
  type JourneyStage,
  type Lead,
} from "@/lib/marketing-api";
import {
  DEFAULT_CONTACT_NAME,
  MESSAGE_CHANNELS,
  addContactsToList,
  createList,
  getLists,
  parseContactLines,
  sendBulkMessage,
  type ContactList,
  type MessageChannel,
  type SendBulkResult,
} from "@/lib/eshu-api";

const MAX_MESSAGE_LENGTH = 1000;
const LEADS_PER_PAGE = 50;

export default function MessageriePage() {
  // ── Lists ────────────────────────────────────────────────────────────────
  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  // ── Funnel ───────────────────────────────────────────────────────────────
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<JourneyStage | "all">("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // ── Manual entry ─────────────────────────────────────────────────────────
  const [manualRaw, setManualRaw] = useState("");

  // ── Compose ──────────────────────────────────────────────────────────────
  const [channel, setChannel] = useState<MessageChannel>("sms");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendBulkResult | null>(null);

  const selectedList = useMemo(
    () => lists.find((l) => l.id === selectedListId) ?? null,
    [lists, selectedListId]
  );

  const refreshLists = useCallback(async () => {
    try {
      const fetched = await getLists();
      setLists(fetched);
      return fetched;
    } catch (error) {
      toast({
        title: "Listes indisponibles",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return [];
    }
  }, []);

  useEffect(() => {
    refreshLists();
    getJourneySummary({})
      .then((summary) => {
        const counts: Record<string, number> = {};
        for (const s of summary.stages) counts[s.stage] = s.count;
        setStageCounts(counts);
      })
      .catch(() => {
        /* stage chips simply show no counts */
      });
  }, [refreshLists]);

  // Leads reload whenever the stage filter changes.
  useEffect(() => {
    let cancelled = false;
    setLoadingLeads(true);
    setSelectedLeadIds(new Set());
    getLeads({
      stage: stage === "all" ? undefined : stage,
      page: 1,
      per_page: LEADS_PER_PAGE,
    })
      .then((res) => {
        if (cancelled) return;
        setLeads(res.items);
        setLeadsTotal(res.total);
      })
      .catch((error) => {
        if (cancelled) return;
        setLeads([]);
        setLeadsTotal(0);
        toast({
          title: "Impossible de charger les leads",
          description: error instanceof Error ? error.message : "Erreur inconnue",
          variant: "destructive",
        });
      })
      .finally(() => !cancelled && setLoadingLeads(false));
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // Leads with no usable phone can't be messaged.
  const reachableLeads = useMemo(
    () => leads.filter((l) => !l.opt_out && (l.phone_normalized || l.phone_raw)),
    [leads]
  );

  const allSelected =
    reachableLeads.length > 0 && selectedLeadIds.size === reachableLeads.length;

  function toggleAll() {
    setSelectedLeadIds(
      allSelected ? new Set() : new Set(reachableLeads.map((l) => l.id))
    );
  }

  function toggleLead(id: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCreateList() {
    const name = newListName.trim();
    if (!name) return;
    setCreatingList(true);
    try {
      const list = await createList(name);
      setNewListName("");
      await refreshLists();
      setSelectedListId(list.id);
      toast({ title: "Liste créée", description: list.name });
    } catch (error) {
      toast({
        title: "Échec de la création",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setCreatingList(false);
    }
  }

  async function handleAddSelectedLeads() {
    if (!selectedListId || selectedLeadIds.size === 0) return;
    const contacts = reachableLeads
      .filter((l) => selectedLeadIds.has(l.id))
      .map((l) => ({
        phone: (l.phone_normalized || l.phone_raw) as string,
        name: l.name?.trim() || DEFAULT_CONTACT_NAME,
      }));
    await addContacts(contacts);
    setSelectedLeadIds(new Set());
  }

  async function handleAddManual() {
    const contacts = parseContactLines(manualRaw);
    if (contacts.length === 0) return;
    await addContacts(contacts);
    setManualRaw("");
  }

  async function addContacts(contacts: { phone: string; name?: string | null }[]) {
    if (!selectedListId) {
      toast({
        title: "Aucune liste sélectionnée",
        description: "Choisissez ou créez une liste d'abord.",
        variant: "destructive",
      });
      return;
    }
    setAdding(true);
    try {
      const res = await addContactsToList(selectedListId, contacts);
      await refreshLists();
      const details = [
        `${res.added} ajouté(s)`,
        res.duplicates > 0 ? `${res.duplicates} déjà présent(s)` : null,
        res.optedOut > 0 ? `${res.optedOut} désabonné(s) ignoré(s)` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      toast({ title: "Contacts ajoutés", description: details });
    } catch (error) {
      toast({
        title: "Échec de l'ajout",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleSend() {
    if (!selectedListId || message.trim().length === 0) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendBulkMessage({
        channel,
        message: message.trim(),
        listId: selectedListId,
      });
      setResult(res);
      toast({
        title: "Campagne mise en file",
        description: `${res.queued} message(s) en cours d'envoi.`,
      });
      if (res.skipped === 0) setMessage("");
    } catch (error) {
      toast({
        title: "Échec de l'envoi",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  const canSend =
    Boolean(selectedListId) && message.trim().length > 0 && !sending;

  return (
    <div className="space-y-6 py-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/marketing">
            <ArrowLeft className="w-4 h-4" />
            Marketing
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Messagerie en masse</h2>
        <p className="text-muted-foreground">
          Constituez une liste depuis l&apos;entonnoir de conversion, puis envoyez
          vos SMS et messages WhatsApp.
        </p>
      </div>

      {/* ── 1. Liste de diffusion ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            1. Liste de diffusion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="list">Liste active</Label>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger id="list">
                  <SelectValue placeholder="Choisir une liste…" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({l.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="newList">Nouvelle liste</Label>
              <div className="flex gap-2">
                <Input
                  id="newList"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder="Relance clients T3"
                />
                <Button
                  variant="outline"
                  onClick={handleCreateList}
                  disabled={creatingList || !newListName.trim()}
                >
                  {creatingList ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {lists.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune liste pour l&apos;instant — créez-en une pour commencer.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Ajouter des contacts ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4" />
            2. Ajouter des contacts
            {selectedList && (
              <span className="font-normal text-muted-foreground">
                → {selectedList.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Depuis l'entonnoir */}
          <div className="space-y-3">
            <Label>Depuis l&apos;entonnoir de conversion</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={stage === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStage("all")}
              >
                Tous
              </Button>
              {JOURNEY_STAGES.map((s) => (
                <Button
                  key={s}
                  variant={stage === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStage(s)}
                >
                  {STAGE_LABELS[s]}
                  {stageCounts[s] !== undefined && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {stageCounts[s]}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Tout sélectionner"
                      />
                    </TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Étape</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLeads ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto w-5 h-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : reachableLeads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucun lead joignable pour ce filtre.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reachableLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedLeadIds.has(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                            aria-label={`Sélectionner ${lead.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.name?.trim() || (
                            <span className="text-muted-foreground">
                              {DEFAULT_CONTACT_NAME}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {lead.phone_normalized || lead.phone_raw}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STAGE_BADGE_CLASSNAMES[lead.stage]}
                          >
                            {STAGE_LABELS[lead.stage]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {reachableLeads.length} affiché(s) sur {leadsTotal} · les leads
                désabonnés sont exclus
              </p>
              <Button
                size="sm"
                onClick={handleAddSelectedLeads}
                disabled={adding || selectedLeadIds.size === 0 || !selectedListId}
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter {selectedLeadIds.size > 0 && `(${selectedLeadIds.size})`}
              </Button>
            </div>
          </div>

          {/* Saisie manuelle */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="manual">Ou saisie manuelle</Label>
            <Textarea
              id="manual"
              rows={4}
              value={manualRaw}
              onChange={(event) => setManualRaw(event.target.value)}
              placeholder={"6XXXXXXXX, Jean Dupont\n6XXXXXXXX"}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Un contact par ligne : numéro, puis nom (optionnel — «{" "}
                {DEFAULT_CONTACT_NAME} » par défaut).
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddManual}
                disabled={adding || !manualRaw.trim() || !selectedListId}
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter à la liste
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Composer et envoyer ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4" />
            3. Composer et envoyer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel">Canal</Label>
            <Select
              value={channel}
              onValueChange={(value) => setChannel(value as MessageChannel)}
            >
              <SelectTrigger id="channel" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <span className="text-xs text-muted-foreground">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="message"
              rows={5}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Votre message…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSend} disabled={!canSend}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Envoyer
              {selectedList && ` à ${selectedList.name} (${selectedList.count})`}
            </Button>
            {!selectedListId && (
              <span className="text-xs text-muted-foreground">
                Sélectionnez une liste pour envoyer.
              </span>
            )}
          </div>

          {result && (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Campagne {result.campaignId}</p>
              <p className="text-muted-foreground">
                {result.queued} en file · {result.skipped} reportés ·{" "}
                {result.total} au total
              </p>
              {result.skipped > 0 && (
                <p className="mt-2 text-muted-foreground">
                  Les envois reportés dépassent le quota ou la limite
                  anti-blocage du canal. Relancez plus tard pour envoyer le reste.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
