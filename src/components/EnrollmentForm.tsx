"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface EnrollmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnrollmentForm({ open, onOpenChange, onSuccess }: EnrollmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [bootcamps, setBootcamps] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    studentId: "",
    bootcampSessionId: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchBootcamps();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchBootcamps = async () => {
    try {
      const response = await fetch("/api/bootcamps");
      if (response.ok) {
        const data = await response.json();
        // Filter to only show upcoming and ongoing bootcamps
        const activeBootcamps = data.filter(
          (b: any) => b.status === "upcoming" || b.status === "ongoing"
        );
        setBootcamps(activeBootcamps);
      }
    } catch (error) {
      console.error("Failed to fetch bootcamps:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll student");
      }

      toast({
        title: "Student enrolled",
        description: "Successfully enrolled student in bootcamp",
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        studentId: "",
        bootcampSessionId: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedBootcamp = bootcamps.find((b) => b.id === formData.bootcampSessionId);
  const capacityInfo = selectedBootcamp
    ? `${selectedBootcamp.currentCapacity} / ${selectedBootcamp.targetCapacity} enrolled`
    : null;
  const isFull = selectedBootcamp
    ? selectedBootcamp.currentCapacity >= selectedBootcamp.targetCapacity
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Select a student and bootcamp session to create an enrollment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student *</Label>
            <Select
              value={formData.studentId}
              onValueChange={(value) => handleChange("studentId", value)}
              disabled={loading}
              required
            >
              <SelectTrigger id="studentId">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No students available
                  </div>
                ) : (
                  students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} ({student.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bootcampSessionId">Bootcamp Session *</Label>
            <Select
              value={formData.bootcampSessionId}
              onValueChange={(value) => handleChange("bootcampSessionId", value)}
              disabled={loading}
              required
            >
              <SelectTrigger id="bootcampSessionId">
                <SelectValue placeholder="Select a bootcamp" />
              </SelectTrigger>
              <SelectContent>
                {bootcamps.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No active bootcamps available
                  </div>
                ) : (
                  bootcamps.map((bootcamp) => {
                    const full = bootcamp.currentCapacity >= bootcamp.targetCapacity;
                    return (
                      <SelectItem
                        key={bootcamp.id}
                        value={bootcamp.id}
                        disabled={full}
                      >
                        {bootcamp.name}
                        {full && " (Full)"}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {capacityInfo && (
              <p className={`text-sm ${isFull ? "text-destructive" : "text-muted-foreground"}`}>
                {capacityInfo}
                {isFull && " - At full capacity"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={loading}
              placeholder="Any additional information about this enrollment..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isFull}>
              {loading ? "Enrolling..." : "Enroll Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
