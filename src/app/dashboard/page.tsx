import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserCheck, TrendingUp } from "lucide-react";

async function getDashboardStats() {
  const [totalStudents, totalBootcamps, totalEnrollments, activeBootcamps] =
    await Promise.all([
      prisma.student.count(),
      prisma.bootcampSession.count(),
      prisma.enrollment.count({ where: { status: "enrolled" } }),
      prisma.bootcampSession.count({ where: { status: "ongoing" } }),
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

  return {
    totalStudents,
    totalBootcamps,
    totalEnrollments,
    activeBootcamps,
    enrollmentRate: Math.round(enrollmentRate * 100),
    bootcampCapacityData,
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
    </div>
  );
}
