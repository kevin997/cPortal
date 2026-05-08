"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronsUpDown,
  Megaphone,
  Pencil,
  PlusCircle,
} from "lucide-react";
import {
  SocialMediaPlanForm,
  type SocialMediaPlanEditData,
} from "@/components/SocialMediaPlanForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { canEditSocialMediaPlans } from "@/lib/access";
import { getSocialMediaPlanStatusLabel } from "@/lib/content";

interface SocialMediaPlan {
  id: string;
  title: string;
  clientName: string | null;
  platform: string | null;
  campaignName: string | null;
  scheduledFor: string;
  status: string;
  captionHtml: string | null;
  adCopyHtml: string | null;
  briefHtml: string | null;
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date) {
  const copy = startOfWeek(date);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function stripHtml(value: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function SocialMediaCalendarPage() {
  const { data: session } = useSession();
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [plans, setPlans] = useState<SocialMediaPlan[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [editingPlan, setEditingPlan] = useState<SocialMediaPlanEditData | null>(null);

  const monthKey = useMemo(() => formatMonthKey(currentMonth), [currentMonth]);

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

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/content/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des clients",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [monthKey]);

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesClient =
        clientFilter === "all" || (plan.clientName?.trim() || "none") === clientFilter;
      const matchesPlatform =
        platformFilter === "all" || (plan.platform?.trim() || "none") === platformFilter;

      return matchesClient && matchesPlatform;
    });
  }, [clientFilter, plans, platformFilter]);

  const visibleDays = useMemo(() => {
    const first = startOfWeek(startOfMonth(currentMonth));
    const last = endOfWeek(endOfMonth(currentMonth));
    const days: Date[] = [];
    let pointer = first;
    while (pointer <= last) {
      days.push(pointer);
      pointer = addDays(pointer, 1);
    }
    return days;
  }, [currentMonth]);

  const plansByDay = useMemo(() => {
    return filteredPlans.reduce<Record<string, SocialMediaPlan[]>>((accumulator, plan) => {
      const key = new Date(plan.scheduledFor).toDateString();
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(plan);
      accumulator[key].sort(
        (left, right) =>
          new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
      );
      return accumulator;
    }, {});
  }, [filteredPlans]);

  const plansForSelectedDate = filteredPlans.filter((plan) =>
    sameDay(new Date(plan.scheduledFor), selectedDate)
  );

  const platformOptions = useMemo(() => {
    return Array.from(
      new Set(plans.map((plan) => plan.platform?.trim() || "none"))
    ).sort();
  }, [plans]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
  };

  const openCreatePlan = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const openEditPlan = (plan: SocialMediaPlan) => {
    setEditingPlan({
      id: plan.id,
      title: plan.title,
      clientName: plan.clientName,
      platform: plan.platform,
      campaignName: plan.campaignName,
      scheduledFor: plan.scheduledFor,
      status: plan.status,
      captionHtml: plan.captionHtml,
      adCopyHtml: plan.adCopyHtml,
      briefHtml: plan.briefHtml,
    });
    setFormOpen(true);
  };

  const selectedClientLabel =
    clientFilter === "all" ? "Tous les clients" : clientFilter;

  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Social Media Calendar</h1>
        <p className="text-muted-foreground">
          Le social media manager planifie ici captions, ad copy et contexte editorial avant transmission aux creatives.
        </p>
      </div>

      <div className="rounded-[28px] border border-border/60 bg-card shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientPickerOpen}
                  className="w-[220px] justify-between rounded-xl"
                >
                  <span className="truncate">{selectedClientLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un client..." />
                  <CommandList>
                    <CommandEmpty>Aucun client trouve.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="Tous les clients"
                        onSelect={() => {
                          setClientFilter("all");
                          setClientPickerOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${clientFilter === "all" ? "opacity-100" : "opacity-0"
                            }`}
                        />
                        Tous les clients
                      </CommandItem>
                      {clients.map((client) => (
                        <CommandItem
                          key={client}
                          value={client}
                          onSelect={() => {
                            setClientFilter(client);
                            setClientPickerOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${clientFilter === client ? "opacity-100" : "opacity-0"
                              }`}
                          />
                          {client}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center rounded-xl border border-border/70 bg-background">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[128px] px-2 text-center text-sm font-semibold">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })}
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-auto w-[170px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="Toutes plateformes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes plateformes</SelectItem>
                  {platformOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "none" ? "Sans plateforme" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canEditSocialMediaPlans(session?.user?.role) && (
              <Button onClick={openCreatePlan} className="rounded-xl">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouveau plan
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20">
                {WEEKDAY_LABELS.map((day) => (
                  <div
                    key={day}
                    className="px-4 py-3 text-center text-sm font-semibold text-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {visibleDays.map((day) => {
                  const dayKey = day.toDateString();
                  const dayPlans = plansByDay[dayKey] || [];
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = sameDay(day, selectedDate);
                  const isToday = sameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[180px] border-b border-r border-border/60 p-3 text-left align-top transition-colors ${isSelected
                          ? "bg-primary/[0.06]"
                          : isCurrentMonth
                            ? "bg-background hover:bg-muted/30"
                            : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                        }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${isToday
                              ? "rounded-full bg-primary px-2 py-1 text-primary-foreground"
                              : ""
                            }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayPlans.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {dayPlans.length} item{dayPlans.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {dayPlans.slice(0, 3).map((plan) => (
                          <div
                            key={plan.id}
                            className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-2.5 shadow-[inset_3px_0_0_0_rgb(34_197_94)]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-900">
                                  {plan.title}
                                </p>
                                <p className="truncate text-[11px] text-slate-600">
                                  {plan.clientName || "CSL Brands"} {plan.platform ? `• ${plan.platform}` : ""}
                                </p>
                              </div>
                              <span className="shrink-0 text-[11px] font-medium text-slate-500">
                                {new Date(plan.scheduledFor).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {plan.adCopyHtml && (
                              <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                                {stripHtml(plan.adCopyHtml)}
                              </p>
                            )}
                            {canEditSocialMediaPlans(session?.user?.role) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="mt-2 h-7 px-2 text-[11px]"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditPlan(plan);
                                }}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Modifier
                              </Button>
                            )}
                          </div>
                        ))}

                        {dayPlans.length > 3 && (
                          <div className="px-1 text-xs font-medium text-primary">
                            Show all ({dayPlans.length})
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 xl:border-l xl:border-t-0">
            <div className="border-b border-border/60 px-5 py-4">
              <p className="text-sm font-semibold text-muted-foreground">Selected day</p>
              <h2 className="mt-1 text-xl font-semibold">
                {selectedDate.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-border/60 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{plansForSelectedDate.length}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredPlans.length}</div>
                  </CardContent>
                </Card>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : plansForSelectedDate.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center">
                  <CalendarRange className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun contenu social media planifie pour cette date.
                  </p>
                </div>
              ) : (
                plansForSelectedDate.map((plan) => (
                  <div key={plan.id} className="space-y-3 rounded-2xl border border-border/60 bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{plan.title}</p>
                        <Badge variant="outline">{plan.clientName || "Sans client"}</Badge>
                        <Badge variant="outline">{plan.platform || "Sans plateforme"}</Badge>
                        <Badge variant="secondary">{getSocialMediaPlanStatusLabel(plan.status)}</Badge>
                      </div>
                      {canEditSocialMediaPlans(session?.user?.role) && (
                        <Button size="sm" variant="outline" onClick={() => openEditPlan(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                      )}
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
                      <div className="rounded-xl bg-muted/35 p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                          Caption
                        </p>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: plan.captionHtml }}
                        />
                      </div>
                    )}

                    {plan.adCopyHtml && (
                      <div className="rounded-xl bg-muted/35 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Ad copy
                          </p>
                        </div>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: plan.adCopyHtml }}
                        />
                      </div>
                    )}

                    {plan.briefHtml && (
                      <div className="rounded-xl bg-muted/35 p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                          Brief contextuel
                        </p>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: plan.briefHtml }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <SocialMediaPlanForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingPlan(null);
          }
        }}
        defaultDate={selectedDate.toISOString().slice(0, 10)}
        editData={editingPlan}
        onSuccess={fetchPlans}
        clients={clients}
      />
    </div>
  );
}
