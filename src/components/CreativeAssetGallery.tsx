"use client";

import { FileText, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CreativeAssetItem {
  id: string;
  secureUrl: string;
  originalFilename: string;
  resourceType: string;
  format: string | null;
  bytes: number;
  mimeType: string | null;
}

interface CreativeAssetGalleryProps {
  assets: CreativeAssetItem[];
  onDelete?: (assetId: string) => void;
  deletingId?: string | null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAsset(asset: CreativeAssetItem) {
  return asset.resourceType === "image" && asset.mimeType !== "application/pdf";
}

function isVideoAsset(asset: CreativeAssetItem) {
  return asset.resourceType === "video";
}

export function CreativeAssetGallery({
  assets,
  onDelete,
  deletingId = null,
}: CreativeAssetGalleryProps) {
  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun fichier joint.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <div key={asset.id} className="overflow-hidden rounded-lg border">
          <div className="aspect-video bg-muted/40">
            {isImageAsset(asset) ? (
              <img
                src={asset.secureUrl}
                alt={asset.originalFilename}
                className="h-full w-full object-cover"
              />
            ) : isVideoAsset(asset) ? (
              <video
                src={asset.secureUrl}
                controls
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                {asset.resourceType === "video" ? (
                  <Video className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="truncate text-sm font-medium">{asset.originalFilename}</p>
              <p className="text-xs text-muted-foreground">
                {asset.mimeType || asset.resourceType} • {formatFileSize(asset.bytes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={asset.secureUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ouvrir
              </a>
              {onDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(asset.id)}
                  disabled={deletingId === asset.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingId === asset.id ? "Suppression..." : "Supprimer"}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
