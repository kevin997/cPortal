"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Loader2, CheckCircle, AlertCircle, Percent, User } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discountPercent: number;
  isActive: boolean;
}

interface ReferrerInfo {
  name: string;
  referralCode: string;
}

interface PageProps {
  params: Promise<{ code: string }>;
}

function LeadCaptureContent({ referralCode }: { referralCode: string }) {
  const searchParams = useSearchParams();
  const preselectedPromotion = searchParams.get("p");

  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidCode, setInvalidCode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch referrer info
        const referrerResponse = await fetch(`/api/referral/${referralCode}`);
        if (!referrerResponse.ok) {
          setInvalidCode(true);
          setLoading(false);
          return;
        }
        const referrerData = await referrerResponse.json();
        setReferrer(referrerData.referrer);

        // Fetch active promotions
        const promotionsResponse = await fetch("/api/promotions?active=true");
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json();
          setPromotions(promotionsData);

          // Set preselected promotion if provided
          if (preselectedPromotion) {
            const exists = promotionsData.some((p: Promotion) => p.id === preselectedPromotion);
            if (exists) {
              setSelectedPromotion(preselectedPromotion);
            } else if (promotionsData.length > 0) {
              setSelectedPromotion(promotionsData[0].id);
            }
          } else if (promotionsData.length > 0) {
            setSelectedPromotion(promotionsData[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setInvalidCode(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [referralCode, preselectedPromotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/referral/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          referralCode,
          promotionId: selectedPromotion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur s'est produite");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (error) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPromotionData = promotions.find((p) => p.id === selectedPromotion);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invalidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Lien invalide</h2>
            <p className="text-muted-foreground mb-4">
              Ce lien de parrainage n'est pas valide ou a expiré.
            </p>
            <Link href="/referral">
              <Button>Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/5 via-background to-primary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Succès !</h2>
            <p className="text-muted-foreground mb-4">
              Votre réduction est réservée. Un représentant commercial vous contactera sous peu.
            </p>
            {selectedPromotionData && (
              <div className="bg-green-500/5 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground">Votre réduction</p>
                <p className="text-3xl font-bold text-green-600">
                  {selectedPromotionData.discountPercent}% OFF
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Merci de votre confiance !
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-md mx-auto pt-8 pb-16">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/referral" className="flex items-center gap-2">
            <Image
              src="/logo-c-portal.svg"
              alt="cPortal"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Referrer Banner */}
        {referrer && (
          <div className="bg-primary/10 rounded-xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <p className="font-medium">Recommandé par</p>
            </div>
            <p className="text-xl font-bold text-primary">{referrer.name}</p>
          </div>
        )}

        {/* Promotion Card */}
        {selectedPromotionData && (
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center text-primary-foreground">
              <Gift className="w-10 h-10 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-1">{selectedPromotionData.name}</h2>
              {selectedPromotionData.description && (
                <p className="text-sm opacity-90">{selectedPromotionData.description}</p>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-center">
                <Percent className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-4xl font-bold text-green-600">
                    {selectedPromotionData.discountPercent}%
                  </p>
                  <p className="text-sm text-muted-foreground">de réduction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Capture Form */}
        <Card>
          <CardHeader>
            <CardTitle>Réservez votre réduction</CardTitle>
            <CardDescription>
              Remplissez ce formulaire pour bénéficier de l'offre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {promotions.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="promotion">Promotion</Label>
                  <Select
                    value={selectedPromotion}
                    onValueChange={setSelectedPromotion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une promotion" />
                    </SelectTrigger>
                    <SelectContent>
                      {promotions.map((promotion) => (
                        <SelectItem key={promotion.id} value={promotion.id}>
                          {promotion.name} (-{promotion.discountPercent}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Votre nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || !selectedPromotion}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Réserver ma réduction"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                En soumettant ce formulaire, vous acceptez d'être contacté par notre équipe commerciale.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LeadCapturePage({ params }: PageProps) {
  const { code } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <LeadCaptureContent referralCode={code} />
    </Suspense>
  );
}
