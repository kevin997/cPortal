import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const asset = await prisma.creativeAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await deleteCloudinaryAsset(asset.publicId, asset.resourceType);
    await prisma.creativeAsset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting creative asset:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete asset" },
      { status: 500 }
    );
  }
}
