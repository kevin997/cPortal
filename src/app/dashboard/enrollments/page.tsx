"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollmentForm } from "@/components/EnrollmentForm";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Enrollment {
  id: string;
  enrollmentDate: string;
  status: string;
  notes?: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  bootcampSession: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  enrolledBy: {
    id: string;
    name: string;
  };
}

const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
  enrolled: "success",
  completed: "default",
  dropped: "destructive",
  transferred: "warning",
};

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/enrollments");
      if (!response.ok) throw new Error("Failed to fetch enrollments");
      const data = await response.json();
      setEnrollments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load enrollments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleDelete = async (enrollment: Enrollment) => {
    if (
      !confirm(
        `Are you sure you want to remove ${enrollment.student.fullName} from ${enrollment.bootcampSession.name}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete enrollment");

      toast({
        title: "Enrollment removed",
        description: `Successfully removed ${enrollment.student.fullName}`,
        variant: "success",
      });

      fetchEnrollments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    fetchEnrollments();
  };

  // Group enrollments by bootcamp
  const groupedEnrollments = enrollments.reduce((acc, enrollment) => {
    const bootcampId = enrollment.bootcampSession.id;
    if (!acc[bootcampId]) {
      acc[bootcampId] = {
        bootcamp: enrollment.bootcampSession,
        enrollments: [],
      };
    }
    acc[bootcampId].enrollments.push(enrollment);
    return acc;
  }, {} as Record<string, { bootcamp: any; enrollments: Enrollment[] }>);

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enrollments</h2>
          <p className="text-muted-foreground">
            Manage student enrollments in bootcamp sessions
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Enroll Student</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments.filter((e) => e.status === "enrolled").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bootcamps with Students</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(groupedEnrollments).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No enrollments yet. Enroll a student in a bootcamp to get started!
            </p>
            <Button onClick={() => setFormOpen(true)} className="mt-4">
              <Plus className="w-4 h-4" />
              Enroll Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedEnrollments).map(({ bootcamp, enrollments }) => (
            <Card key={bootcamp.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{bootcamp.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(bootcamp.startDate)} - {formatDate(bootcamp.endDate)}
                    </p>
                  </div>
                  <Badge variant={statusColors[bootcamp.status] || "default"}>
                    {bootcamp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm font-medium">
                    {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
                  </div>
                  <div className="divide-y">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between py-3 first:pt-0 group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{enrollment.student.fullName}</p>
                            <Badge
                              variant={statusColors[enrollment.status] || "default"}
                              className="text-xs"
                            >
                              {enrollment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.student.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enrolled {formatDate(enrollment.enrollmentDate)} by{" "}
                            {enrollment.enrolledBy.name}
                          </p>
                          {enrollment.notes && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              Note: {enrollment.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(enrollment)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enrollment Form Dialog */}
      <EnrollmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
