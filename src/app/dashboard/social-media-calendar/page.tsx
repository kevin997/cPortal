"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarRange, PlusCircle } from "lucide-react";
import { SocialMediaPlanForm } from "@/components/SocialMediaPlanForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { canEditSocialMediaPlans } from "@/lib/access";
import { getSocialMediaPlanStatusLabel } from "@/lib/content";

interface SocialMediaPlan {
  id: string;
  title: string;
  platform: string | null;
  campaignName: string | null;
  scheduledFor: string;
  status: string;
  captionHtml: string | null;
  adCopyHtml: string | null;
  briefHtml: string | null;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function SocialMediaCalendarPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [plans, setPlans] = useState<SocialMediaPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const monthKey = useMemo(
    () =>
      `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`,
    [selectedDate]
  );

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/api/social-media/plans?month=${monthKey}`);
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      const data = await response.json();
      setPlans(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier social media",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [monthKey]);

  const plansForSelectedDate = plans.filter((plan) =>
    sameDay(new Date(plan.scheduledFor), selectedDate)
  );

  const calendarDots = plans.reduce<Record<string, number>>((accumulator, plan) => {
    const key = new Date(plan.scheduledFor).toDateString();
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Calendar</h1>
          <p className="text-muted-foreground">
            Le social media manager planifie ici les captions, ad copy et contexte editoriaux.
          </p>
        </div>
        {canEditSocialMediaPlans(session?.user?.role) && (
          <Button onClick={() => setFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau plan
          </Button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Mois en cours</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={selectedDate}
              onMonthChange={setSelectedDate}
              modifiers={{
                hasPlan: Object.keys(calendarDots).map((day) => new Date(day)),
              }}
              modifiersClassNames={{
                hasPlan: "relative after:absolute after:bottom-1.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Plans du {selectedDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : plansForSelectedDate.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                <CalendarRange className="mx-auto mb-3 h-6 w-6" />
                Aucun contenu social media planifie pour cette date.
              </div>
            ) : (
              plansForSelectedDate.map((plan) => (
                <div key={plan.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{plan.title}</p>
                    <Badge variant="outline">{plan.platform || "Plateforme libre"}</Badge>
                    <Badge variant="secondary">{getSocialMediaPlanStatusLabel(plan.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Publication: {new Date(plan.scheduledFor).toLocaleString("fr-FR")}
                  </p>
                  {plan.campaignName && (
                    <p className="text-sm">
                      <span className="font-medium">Campagne:</span> {plan.campaignName}
                    </p>
                  )}
                  {plan.captionHtml && (
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="mb-2 text-xs uppercase text-muted-foreground">Texte d'accompagnement</p>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: plan.captionHtml }} />
                    </div>
                  )}
                  {plan.adCopyHtml && (
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="mb-2 text-xs uppercase text-muted-foreground">Ad copy</p>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: plan.adCopyHtml }} />
                    </div>
                  )}
                  {plan.briefHtml && (
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="mb-2 text-xs uppercase text-muted-foreground">Brief contextuel</p>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: plan.briefHtml }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <SocialMediaPlanForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={selectedDate.toISOString().slice(0, 10)}
        onSuccess={fetchPlans}
      />
    </div>
  );
}
