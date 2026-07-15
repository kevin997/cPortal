"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Target,
  Award,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getJourneySummary,
  JOURNEY_STAGES,
  JourneySummary,
  STAGE_BADGE_CLASSNAMES,
  STAGE_LABELS,
} from "@/lib/marketing-api";

function NoData() {
  return (
    <div className="flex h-[220px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
    </div>
  );
}

const addedTrendConfig = {
  count: { label: "Leads ajoutés", color: "var(--chart-1)" },
} satisfies ChartConfig;

const topProductsConfig = {
  count: { label: "Leads", color: "var(--chart-2)" },
} satisfies ChartConfig;

const sourceConfig = {
  count: { label: "Leads", color: "var(--chart-3)" },
} satisfies ChartConfig;

const countryConfig = {
  count: { label: "Leads", color: "var(--chart-4)" },
} satisfies ChartConfig;

export default function MarketingDashboardPage() {
  const [summary, setSummary] = useState<JourneySummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<JourneySummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState("all");
  const [country, setCountry] = useState("all");

  const fetchSummary = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const data = await getJourneySummary({
          product: product !== "all" ? product : undefined,
          country: country !== "all" ? country : undefined,
        });
        setSummary(data);
        if (!filterOptions) {
          setFilterOptions(data);
        }
      } catch (error) {
        console.error("Error fetching journey summary:", error);
        toast({
          title: "Erreur",
          description:
            error instanceof Error
              ? error.message
              : "Impossible de charger le parcours d'achat",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, country]
  );

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, country]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummary({ silent: true });
    setRefreshing(false);
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stagesData = JOURNEY_STAGES.map((stage) => ({
    stage,
    count: summary?.stages.find((s) => s.stage === stage)?.count ?? 0,
  }));
  const maxStageCount = Math.max(1, ...stagesData.map((s) => s.count));

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parcours d&apos;achat</h2>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble des prospects et de leur progression
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Produit / Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits</SelectItem>
            {filterOptions?.by_product.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Pays" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pays</SelectItem>
            {filterOptions?.by_country.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Total leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totals.leads ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-600">
              <Target className="w-4 h-4" />
              Opportunités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary?.totals.opportunities ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
              <Award className="w-4 h-4" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.totals.customers ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
              <TrendingUp className="w-4 h-4" />
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {((summary?.totals.conversion_rate ?? 0) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Entonnoir de conversion</CardTitle>
          <CardDescription>
            Répartition des leads par étape — cliquez sur une étape pour filtrer la liste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stagesData.map(({ stage, count }) => {
            const pct = summary?.totals.leads
              ? Math.round((count / summary.totals.leads) * 100)
              : 0;
            const widthPct = Math.max(
              4,
              Math.round((count / maxStageCount) * 100)
            );
            return (
              <Link
                key={stage}
                href={`/dashboard/marketing/leads?stage=${stage}`}
                className="block group"
              >
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-muted-foreground">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-8 w-full rounded-md bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all ${STAGE_BADGE_CLASSNAMES[stage]} border-0`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Leads ajoutés (30 jours)</CardTitle>
            <CardDescription>Évolution quotidienne des nouveaux leads</CardDescription>
          </CardHeader>
          <CardContent>
            {!summary?.added_last_30d.length ? (
              <NoData />
            ) : (
              <ChartContainer config={addedTrendConfig} className="h-[260px] w-full">
                <AreaChart
                  data={summary.added_last_30d.map((d) => ({
                    ...d,
                    label: format(new Date(d.date), "d MMM", { locale: fr }),
                  }))}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="count"
                    type="monotone"
                    fill="var(--color-count)"
                    fillOpacity={0.3}
                    stroke="var(--color-count)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top produits / services</CardTitle>
            <CardDescription>Leads par produit d&apos;intérêt</CardDescription>
          </CardHeader>
          <CardContent>
            {!summary?.by_product.length ? (
              <NoData />
            ) : (
              <ChartContainer config={topProductsConfig} className="h-[260px] w-full">
                <BarChart
                  data={summary.by_product.slice(0, 8)}
                  layout="vertical"
                  accessibilityLayer
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par source</CardTitle>
            <CardDescription>Leads par fichier / source d&apos;origine</CardDescription>
          </CardHeader>
          <CardContent>
            {!summary?.by_source.length ? (
              <NoData />
            ) : (
              <ChartContainer config={sourceConfig} className="h-[260px] w-full">
                <BarChart
                  data={summary.by_source.slice(0, 8)}
                  layout="vertical"
                  accessibilityLayer
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par pays</CardTitle>
            <CardDescription>Leads par pays</CardDescription>
          </CardHeader>
          <CardContent>
            {!summary?.by_country.length ? (
              <NoData />
            ) : (
              <ChartContainer config={countryConfig} className="h-[260px] w-full">
                <BarChart data={summary.by_country.slice(0, 10)} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
