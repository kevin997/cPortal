"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BootcampForm } from "@/components/BootcampForm";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Bootcamp {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  targetCapacity: number;
  currentCapacity: number;
  status: string;
  location?: string;
  imageUrl?: string;
  _count?: {
    enrollments: number;
  };
}

const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
  upcoming: "default",
  ongoing: "success",
  completed: "secondary",
  cancelled: "destructive",
};

export default function BootcampsPage() {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBootcamp, setEditingBootcamp] = useState<Bootcamp | null>(null);

  const fetchBootcamps = async () => {
    try {
      const response = await fetch("/api/bootcamps");
      if (!response.ok) throw new Error("Failed to fetch bootcamps");
      const data = await response.json();
      setBootcamps(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bootcamps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootcamps();
  }, []);

  const handleDelete = async (bootcamp: Bootcamp) => {
    if (!confirm(`Are you sure you want to delete ${bootcamp.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bootcamps/${bootcamp.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete bootcamp");

      toast({
        title: "Bootcamp deleted",
        description: `Successfully deleted ${bootcamp.name}`,
        variant: "success",
      });

      fetchBootcamps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (bootcamp: Bootcamp) => {
    setEditingBootcamp(bootcamp);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBootcamp(null);
  };

  const handleFormSuccess = () => {
    fetchBootcamps();
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bootcamp Sessions</h2>
          <p className="text-muted-foreground">
            Manage bootcamp sessions and schedules
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Bootcamp</span>
        </Button>
      </div>

      {/* Bootcamps List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
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
      ) : bootcamps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No bootcamp sessions yet. Create your first bootcamp to get started!
            </p>
            <Button onClick={() => setFormOpen(true)} className="mt-4">
              <Plus className="w-4 h-4" />
              Create Bootcamp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bootcamps.map((bootcamp) => {
            const percentage = (bootcamp.currentCapacity / bootcamp.targetCapacity) * 100;
            const isNearFull = percentage >= 80;
            const isFull = percentage >= 100;

            return (
              <Card key={bootcamp.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{bootcamp.name}</CardTitle>
                      <Badge
                        variant={statusColors[bootcamp.status] || "default"}
                        className="mt-2"
                      >
                        {bootcamp.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleEdit(bootcamp)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(bootcamp)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {bootcamp.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {bootcamp.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>
                        {formatDate(bootcamp.startDate)} - {formatDate(bootcamp.endDate)}
                      </span>
                    </div>

                    {bootcamp.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{bootcamp.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>
                        {bootcamp.currentCapacity} / {bootcamp.targetCapacity} enrolled
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Capacity</span>
                      <span className={isFull ? "text-destructive font-medium" : ""}>
                        {Math.round(percentage)}%
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bootcamp Form Dialog */}
      <BootcampForm
        open={formOpen}
        onOpenChange={handleFormClose}
        bootcamp={editingBootcamp}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
