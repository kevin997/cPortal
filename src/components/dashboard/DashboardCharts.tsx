"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export interface DashboardChartData {
  enrollmentTrend: { month: string; count: number }[];
  leadFunnel: { status: string; count: number }[];
  topAgents: { name: string; count: number }[];
  bootcampComparison: {
    name: string;
    target: number;
    current: number;
  }[];
  genderDistribution: { gender: string; count: number }[];
  topNeighbourhoods: { neighbourhood: string; count: number }[];
}

function NoData() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-muted-foreground">No data available</p>
    </div>
  );
}

const enrollmentTrendConfig = {
  count: {
    label: "Enrollments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const leadFunnelConfig = {
  count: {
    label: "Leads",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const topAgentsConfig = {
  count: {
    label: "Enrollments",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const bootcampComparisonConfig = {
  target: {
    label: "Target",
    color: "var(--chart-3)",
  },
  current: {
    label: "Current",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const genderColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
];

const neighbourhoodConfig = {
  count: {
    label: "Students",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const LEAD_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  contacted: "Contacted",
  converted: "Converted",
  lost: "Lost",
};

export function DashboardCharts({ data }: { data: DashboardChartData }) {
  const hasEnrollmentTrend =
    data.enrollmentTrend.length > 0 &&
    data.enrollmentTrend.some((d) => d.count > 0);
  const hasLeadFunnel =
    data.leadFunnel.length > 0 && data.leadFunnel.some((d) => d.count > 0);
  const hasTopAgents =
    data.topAgents.length > 0 && data.topAgents.some((d) => d.count > 0);
  const hasBootcampComparison = data.bootcampComparison.length > 0;
  const hasGender =
    data.genderDistribution.length > 0 &&
    data.genderDistribution.some((d) => d.count > 0);
  const hasNeighbourhoods =
    data.topNeighbourhoods.length > 0 &&
    data.topNeighbourhoods.some((d) => d.count > 0);

  const genderConfig = data.genderDistribution.reduce<ChartConfig>(
    (acc, item, i) => {
      acc[item.gender] = {
        label: item.gender,
        color: genderColors[i % genderColors.length],
      };
      return acc;
    },
    {}
  );

  const leadFunnelData = data.leadFunnel.map((item) => ({
    ...item,
    label: LEAD_STATUS_LABELS[item.status] || item.status,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Row 1: Enrollment Trend - Full Width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Enrollment Trend</CardTitle>
          <CardDescription>Monthly enrollments over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasEnrollmentTrend ? (
            <NoData />
          ) : (
            <ChartContainer config={enrollmentTrendConfig} className="h-[300px] w-full">
              <AreaChart data={data.enrollmentTrend} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
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

      {/* Row 2: Lead Funnel + Top Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Conversion Funnel</CardTitle>
          <CardDescription>Leads by status</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasLeadFunnel ? (
            <NoData />
          ) : (
            <ChartContainer config={leadFunnelConfig} className="h-[250px] w-full">
              <BarChart data={leadFunnelData} layout="vertical" accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={80}
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
          <CardTitle>Top Agents</CardTitle>
          <CardDescription>Top 5 agents by enrollment count</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasTopAgents ? (
            <NoData />
          ) : (
            <ChartContainer config={topAgentsConfig} className="h-[250px] w-full">
              <BarChart data={data.topAgents} layout="vertical" accessibilityLayer>
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

      {/* Row 3: Bootcamp Comparison - Full Width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Bootcamp Comparison</CardTitle>
          <CardDescription>Target vs current capacity per bootcamp</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasBootcampComparison ? (
            <NoData />
          ) : (
            <ChartContainer config={bootcampComparisonConfig} className="h-[300px] w-full">
              <BarChart data={data.bootcampComparison} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Gender Distribution + Top Neighbourhoods */}
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>Student demographics</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasGender ? (
            <NoData />
          ) : (
            <ChartContainer config={genderConfig} className="h-[250px] w-full">
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent nameKey="gender" />} />
                <ChartLegend content={<ChartLegendContent nameKey="gender" />} />
                <Pie
                  data={data.genderDistribution}
                  dataKey="count"
                  nameKey="gender"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.genderDistribution.map((entry, index) => (
                    <Cell
                      key={entry.gender}
                      fill={genderColors[index % genderColors.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Neighbourhoods</CardTitle>
          <CardDescription>Top 5 student locations</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasNeighbourhoods ? (
            <NoData />
          ) : (
            <ChartContainer config={neighbourhoodConfig} className="h-[250px] w-full">
              <BarChart data={data.topNeighbourhoods} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="neighbourhood"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
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
  );
}
