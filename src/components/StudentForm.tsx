"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/SearchableSelect";

const PAYMENT_STATUSES = [
  { value: "paid", label: "Paye" },
  { value: "partially_paid", label: "Partiellement paye" },
  { value: "pending", label: "En attente" },
  { value: "overdue", label: "Retard" },
  { value: "cancelled", label: "Annule" },
] as const;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  onSuccess: () => void;
}

export function StudentForm({ open, onOpenChange, student, onSuccess }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: student?.fullName || "",
    email: student?.email || "",
    phoneNumber: student?.phoneNumber || "",
    neighbourhood: student?.neighbourhood || "",
    address: student?.address || "",
    dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
    gender: student?.gender || "none",
    paymentStatus: student?.paymentStatus || "pending",
    totalAmountDue: student?.totalAmountDue ? String(student.totalAmountDue) : "",
    amountPaid: student?.amountPaid ? String(student.amountPaid) : "",
    notes: student?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender === "none" ? null : formData.gender,
          totalAmountDue: Number(formData.totalAmountDue || 0),
          amountPaid: Number(formData.amountPaid || 0),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save student");
      }

      toast({
        title: student ? "Student updated" : "Student created",
        description: `Successfully ${student ? "updated" : "created"} ${formData.fullName}`,
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);

      // Reset form if creating new student
      if (!student) {
        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          neighbourhood: "",
          address: "",
          dateOfBirth: "",
          gender: "none",
          paymentStatus: "pending",
          totalAmountDue: "",
          amountPaid: "",
          notes: "",
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
          <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {student ? "Update student information" : "Enter student details to add them to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              required
              disabled={loading}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <SearchableSelect
              id="paymentStatus"
              value={formData.paymentStatus}
              onValueChange={(value) => handleChange("paymentStatus", value)}
              disabled={loading}
              placeholder="Select payment status"
              searchPlaceholder="Search payment status..."
              emptyText="No status found."
              options={PAYMENT_STATUSES.map((status) => ({
                value: status.value,
                label: status.label,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmountDue">Total Amount Due (FCFA)</Label>
              <Input
                id="totalAmountDue"
                type="number"
                min="0"
                step="1"
                value={formData.totalAmountDue}
                onChange={(e) => handleChange("totalAmountDue", e.target.value)}
                disabled={loading}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid (FCFA)</Label>
              <Input
                id="amountPaid"
                type="number"
                min="0"
                step="1"
                value={formData.amountPaid}
                onChange={(e) => handleChange("amountPaid", e.target.value)}
                disabled={loading}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              disabled={loading}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              required
              disabled={loading}
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighbourhood">Neighbourhood</Label>
            <Input
              id="neighbourhood"
              value={formData.neighbourhood}
              onChange={(e) => handleChange("neighbourhood", e.target.value)}
              disabled={loading}
              placeholder="Akwa, Douala"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={loading}
              placeholder="123 Street Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <SearchableSelect
                id="gender"
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
                disabled={loading}
                placeholder="Select gender"
                searchPlaceholder="Search gender..."
                emptyText="No gender found."
                options={[
                  { value: "none", label: "Prefer not to say" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={loading}
              placeholder="Additional information about the student..."
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : student ? "Update Student" : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
