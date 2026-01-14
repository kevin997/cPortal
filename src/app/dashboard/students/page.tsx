"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StudentForm } from "@/components/StudentForm";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  neighbourhood?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  notes?: string;
  createdAt: string;
  _count?: {
    enrollments: number;
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    try {
      const url = search
        ? `/api/students?search=${encodeURIComponent(search)}`
        : "/api/students";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.fullName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete student");

      toast({
        title: "Student deleted",
        description: `Successfully deleted ${student.fullName}`,
        variant: "success",
      });

      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingStudent(null);
  };

  const handleFormSuccess = () => {
    fetchStudents();
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">
            Manage student records and information
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Student</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {search
                ? "No students found matching your search"
                : "No students yet. Add your first student to get started!"}
            </p>
            {!search && (
              <Button onClick={() => setFormOpen(true)} className="mt-4">
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""} found
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{student.fullName}</CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleEdit(student)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(student)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {student._count && student._count.enrollments > 0 && (
                    <Badge variant="secondary" className="w-fit">
                      {student._count.enrollments} enrollment{student._count.enrollments !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{student.phoneNumber}</span>
                  </div>
                  {student.neighbourhood && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{student.neighbourhood}</span>
                    </div>
                  )}
                  <div className="pt-2 text-xs text-muted-foreground border-t">
                    Added {formatDate(student.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Student Form Dialog */}
      <StudentForm
        open={formOpen}
        onOpenChange={handleFormClose}
        student={editingStudent}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
