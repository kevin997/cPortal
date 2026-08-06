"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import {
  MESSAGE_CHANNELS,
  parseNumbers,
  sendBulkMessage,
  type MessageChannel,
  type SendBulkResult,
} from "@/lib/eshu-api";

const MAX_MESSAGE_LENGTH = 1000;

export default function MessageriePage() {
  const [channel, setChannel] = useState<MessageChannel>("sms");
  const [message, setMessage] = useState("");
  const [rawNumbers, setRawNumbers] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendBulkResult | null>(null);

  const numbers = useMemo(() => parseNumbers(rawNumbers), [rawNumbers]);
  const canSend = numbers.length > 0 && message.trim().length > 0 && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendBulkMessage({ channel, message: message.trim(), numbers });
      setResult(res);
      toast({
        title: "Campagne mise en file",
        description: `${res.queued} message(s) en cours d'envoi.`,
      });
      if (res.skipped === 0) {
        setMessage("");
        setRawNumbers("");
      }
    } catch (error) {
      toast({
        title: "Échec de l'envoi",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/marketing">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Marketing
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Messagerie en masse</h2>
        <p className="text-muted-foreground">
          Envoyez des SMS ou des messages WhatsApp à une liste de numéros via Eshu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="channel">Canal</Label>
            <Select
              value={channel}
              onValueChange={(value) => setChannel(value as MessageChannel)}
            >
              <SelectTrigger id="channel" className="w-full md:w-64">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="numbers">Destinataires</Label>
              <Badge variant="secondary">{numbers.length} numéro(s)</Badge>
            </div>
            <Textarea
              id="numbers"
              rows={6}
              value={rawNumbers}
              onChange={(event) => setRawNumbers(event.target.value)}
              placeholder={"6XXXXXXXX\n+237 6XXXXXXXX\nUn numéro par ligne (ou séparés par des virgules)"}
            />
            <p className="text-xs text-muted-foreground">
              Les numéros locaux sont automatiquement préfixés (+237).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSend} disabled={!canSend}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer
            </Button>
          </div>

          {result && (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Campagne {result.campaignId}</p>
              <p className="text-muted-foreground">
                {result.queued} en file · {result.skipped} reportés · {result.total} au total
              </p>
              {result.skipped > 0 && (
                <p className="mt-2 text-muted-foreground">
                  Les envois reportés dépassent le quota ou la limite anti-blocage du
                  canal. Relancez plus tard pour envoyer le reste.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
