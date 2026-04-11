"use client";

import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CreativeAssetPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreativeAssetPicker({
  files,
  onChange,
  disabled = false,
}: CreativeAssetPickerProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    onChange(nextFiles);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="creative-assets">Pieces jointes</Label>
        <label
          htmlFor="creative-assets"
          className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
          <span>Ajouter images, videos, PDF, briefs ou autres fichiers</span>
        </label>
        <input
          id="creative-assets"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.type || "Fichier"} • {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Retirer ${file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
