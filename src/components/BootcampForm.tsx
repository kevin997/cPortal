"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
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

interface BootcampFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bootcamp?: any;
  onSuccess: () => void;
}

export function BootcampForm({ open, onOpenChange, bootcamp, onSuccess }: BootcampFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: bootcamp?.name || "",
    description: bootcamp?.description || "",
    startDate: bootcamp?.startDate ? new Date(bootcamp.startDate).toISOString().split('T')[0] : "",
    endDate: bootcamp?.endDate ? new Date(bootcamp.endDate).toISOString().split('T')[0] : "",
    targetCapacity: bootcamp?.targetCapacity || "",
    status: bootcamp?.status || "upcoming",
    location: bootcamp?.location || "",
    imageUrl: bootcamp?.imageUrl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = bootcamp ? `/api/bootcamps/${bootcamp.id}` : "/api/bootcamps";
      const method = bootcamp ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save bootcamp");
      }

      toast({
        title: bootcamp ? "Bootcamp updated" : "Bootcamp created",
        description: `Successfully ${bootcamp ? "updated" : "created"} ${formData.name}`,
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);

      // Reset form if creating new bootcamp
      if (!bootcamp) {
        setFormData({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          targetCapacity: "",
          status: "upcoming",
          location: "",
          imageUrl: "",
        });
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bootcamp ? "Edit Bootcamp" : "Create New Bootcamp"}</DialogTitle>
          <DialogDescription>
            {bootcamp ? "Update bootcamp information" : "Enter bootcamp details to create a new session"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bootcamp Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              disabled={loading}
              placeholder="Web Development Bootcamp Q1 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={loading}
              placeholder="Intensive 12-week web development bootcamp..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetCapacity">Target Capacity *</Label>
              <Input
                id="targetCapacity"
                type="number"
                min="1"
                value={formData.targetCapacity}
                onChange={(e) => handleChange("targetCapacity", e.target.value)}
                required
                disabled={loading}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              disabled={loading}
              placeholder="Douala, Cameroon"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              disabled={loading}
              placeholder="https://example.com/image.jpg"
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : bootcamp ? "Update Bootcamp" : "Create Bootcamp"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
