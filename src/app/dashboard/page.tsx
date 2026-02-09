import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserCheck, TrendingUp } from "lucide-react";
import { DashboardCharts, DashboardChartData } from "@/components/dashboard/DashboardCharts";

async function getDashboardStats() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalBootcamps,
    totalEnrollments,
    activeBootcamps,
    recentEnrollments,
    leadsByStatus,
    topAgentsRaw,
    genderGroups,
    neighbourhoodGroups,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.bootcampSession.count(),
    prisma.enrollment.count({ where: { status: "enrolled" } }),
    prisma.bootcampSession.count({ where: { status: "ongoing" } }),
    prisma.enrollment.findMany({
      where: { enrollmentDate: { gte: sixMonthsAgo } },
      select: { enrollmentDate: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.enrollment.groupBy({
      by: ["enrolledById"],
      _count: { enrolledById: true },
      orderBy: { _count: { enrolledById: "desc" } },
      take: 5,
    }),
    prisma.student.groupBy({
      by: ["gender"],
      _count: { gender: true },
    }),
    prisma.student.groupBy({
      by: ["neighbourhood"],
      _count: { neighbourhood: true },
      where: { neighbourhood: { not: null } },
      orderBy: { _count: { neighbourhood: "desc" } },
      take: 5,
    }),
  ]);

  const bootcampCapacityData = await prisma.bootcampSession.findMany({
    select: {
      id: true,
      name: true,
      targetCapacity: true,
      currentCapacity: true,
      status: true,
    },
    where: {
      status: { in: ["upcoming", "ongoing"] },
    },
  });

  const enrollmentRate =
    bootcampCapacityData.reduce((acc, b) => acc + b.currentCapacity, 0) /
    bootcampCapacityData.reduce((acc, b) => acc + b.targetCapacity, 0) || 0;

  // Build enrollment trend: group by year-month
  const enrollmentTrendMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    enrollmentTrendMap.set(key, 0);
  }
  for (const e of recentEnrollments) {
    const d = new Date(e.enrollmentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (enrollmentTrendMap.has(key)) {
      enrollmentTrendMap.set(key, enrollmentTrendMap.get(key)! + 1);
    }
  }
  const enrollmentTrend = Array.from(enrollmentTrendMap.entries()).map(
    ([month, count]) => ({ month, count })
  );

  // Lead funnel
  const leadFunnel = leadsByStatus.map((l) => ({
    status: l.status,
    count: l._count.status,
  }));

  // Top agents: fetch names
  const agentIds = topAgentsRaw.map((a) => a.enrolledById);
  const agentUsers = agentIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      })
    : [];
  const agentNameMap = new Map(agentUsers.map((u) => [u.id, u.name || "Unknown"]));
  const topAgents = topAgentsRaw.map((a) => ({
    name: agentNameMap.get(a.enrolledById) || "Unknown",
    count: a._count.enrolledById,
  }));

  // Bootcamp comparison
  const bootcampComparison = bootcampCapacityData.map((b) => ({
    name: b.name,
    target: b.targetCapacity,
    current: b.currentCapacity,
  }));

  // Gender distribution
  const genderDistribution = genderGroups.map((g) => ({
    gender: g.gender || "Unknown",
    count: g._count.gender,
  }));

  // Top neighbourhoods
  const topNeighbourhoods = neighbourhoodGroups.map((n) => ({
    neighbourhood: n.neighbourhood || "Unknown",
    count: n._count.neighbourhood,
  }));

  const chartData: DashboardChartData = {
    enrollmentTrend,
    leadFunnel,
    topAgents,
    bootcampComparison,
    genderDistribution,
    topNeighbourhoods,
  };

  return {
    totalStudents,
    totalBootcamps,
    totalEnrollments,
    activeBootcamps,
    enrollmentRate: Math.round(enrollmentRate * 100),
    bootcampCapacityData,
    chartData,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name}!</h2>
        <p className="text-muted-foreground">
          Here's an overview of your bootcamp management
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bootcamps</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBootcamps}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats.totalBootcamps} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrollmentRate}%</div>
            <p className="text-xs text-muted-foreground">Overall capacity filled</p>
          </CardContent>
        </Card>
      </div>

      {/* Bootcamp Capacity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Bootcamp Capacity Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.bootcampCapacityData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active or upcoming bootcamps
              </p>
            ) : (
              stats.bootcampCapacityData.map((bootcamp) => {
                const percentage =
                  (bootcamp.currentCapacity / bootcamp.targetCapacity) * 100;
                const isNearFull = percentage >= 80;
                const isFull = percentage >= 100;

                return (
                  <div key={bootcamp.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{bootcamp.name}</span>
                      <span className="text-muted-foreground">
                        {bootcamp.currentCapacity} / {bootcamp.targetCapacity}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFull
                            ? "bg-destructive"
                            : isNearFull
                            ? "bg-yellow-500"
                            : "bg-primary"
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Visualizations */}
      <DashboardCharts data={stats.chartData} />
    </div>
  );
}
