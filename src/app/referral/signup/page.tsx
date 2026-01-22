"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Gift } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  rewardAmount: number;
  discountPercent: number;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promotionId = searchParams.get("promotion");

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPromotion, setLoadingPromotion] = useState(true);

  useEffect(() => {
    async function fetchPromotion() {
      if (promotionId) {
        try {
          const response = await fetch(`/api/promotions/${promotionId}`);
          if (response.ok) {
            const data = await response.json();
            setPromotion(data);
          }
        } catch (error) {
          console.error("Error fetching promotion:", error);
        }
      }
      setLoadingPromotion(false);
    }
    fetchPromotion();
  }, [promotionId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " XAF";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      // Register the user
      const response = await fetch("/api/referral/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          promotionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur s'est produite");
        setLoading(false);
        return;
      }

      // Sign in the user
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Compte créé mais erreur de connexion. Veuillez vous connecter.");
        router.push("/referral/login");
      } else {
        router.push("/referral/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/referral" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Créer un compte affilié</CardTitle>
          <CardDescription>
            Rejoignez notre programme de parrainage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Show selected promotion */}
          {loadingPromotion ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : promotion ? (
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{promotion.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gagnez <span className="font-semibold text-primary">{formatCurrency(promotion.rewardAmount)}</span> par parrainage
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {promotion.discountPercent}% off
                </Badge>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+237 6XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/referral/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReferralSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
