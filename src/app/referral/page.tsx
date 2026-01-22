"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingUp, Users, ArrowRight, Loader2 } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  rewardAmount: number;
  discountPercent: number;
  isActive: boolean;
}

export default function ReferralLandingPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const response = await fetch("/api/promotions?active=true");
        if (response.ok) {
          const data = await response.json();
          setPromotions(data);
        }
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPromotions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " XAF";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">cPortal Referral</h1>
          <Link href="/referral/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Programme d'affiliation
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Gagnez de l'argent en partageant nos formations
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez notre programme de parrainage et gagnez des récompenses pour chaque personne que vous recommandez.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                <Gift className="w-6 h-6 mx-auto mb-1" />
              </div>
              <p className="text-xs text-muted-foreground">Récompenses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                <Users className="w-6 h-6 mx-auto mb-1" />
              </div>
              <p className="text-xs text-muted-foreground">Parrainages</p>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                <TrendingUp className="w-6 h-6 mx-auto mb-1" />
              </div>
              <p className="text-xs text-muted-foreground">Croissance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold mb-6 text-center">
            Promotions Actives
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : promotions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  Aucune promotion active pour le moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {promotions.map((promotion) => (
                <Card
                  key={promotion.id}
                  className="relative overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{promotion.name}</CardTitle>
                        {promotion.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {promotion.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-200">
                        Actif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          Votre Récompense
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(promotion.rewardAmount)}
                        </p>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          Réduction Filleul
                        </p>
                        <p className="text-lg font-bold">
                          {promotion.discountPercent}%
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/referral/signup?promotion=${promotion.id}`}
                      className="block"
                    >
                      <Button className="w-full" size="lg">
                        Rejoindre cette promotion
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold mb-8 text-center">
            Comment ça marche ?
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-medium mb-2">Inscrivez-vous</h4>
              <p className="text-sm text-muted-foreground">
                Créez votre compte affilié et obtenez votre lien de parrainage unique.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-medium mb-2">Partagez</h4>
              <p className="text-sm text-muted-foreground">
                Partagez votre lien avec vos amis, famille et réseau.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-medium mb-2">Gagnez</h4>
              <p className="text-sm text-muted-foreground">
                Recevez vos récompenses pour chaque inscription validée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-md text-center">
          <h3 className="text-xl font-semibold mb-4">Prêt à commencer ?</h3>
          <p className="text-muted-foreground mb-6">
            Rejoignez notre programme d'affiliation et commencez à gagner dès aujourd'hui.
          </p>
          <Link href="/referral/signup">
            <Button size="lg" className="w-full">
              Créer mon compte affilié
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} cPortal. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
