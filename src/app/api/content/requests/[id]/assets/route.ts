import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const creativeRequest = await prisma.creativeRequest.findUnique({
      where: { id },
      select: { id: true, reference: true },
    });

    if (!creativeRequest) {
      return NextResponse.json({ error: "Creative request not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds the 50MB upload limit` },
          { status: 400 }
        );
      }
    }

    const assets = await Promise.all(
      files.map(async (file) => {
        const uploaded = await uploadFileToCloudinary({
          file,
          folder: `cportal/content-requests/${creativeRequest.reference}`,
        });

        return prisma.creativeAsset.create({
          data: {
            requestId: creativeRequest.id,
            publicId: uploaded.publicId,
            secureUrl: uploaded.secureUrl,
            originalFilename: uploaded.originalFilename,
            resourceType: uploaded.resourceType,
            format: uploaded.format,
            bytes: uploaded.bytes,
            mimeType: file.type || null,
            uploadedById: session.user.id,
          },
        });
      })
    );

    return NextResponse.json(assets, { status: 201 });
  } catch (error) {
    console.error("Error uploading creative assets:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload assets" },
      { status: 500 }
    );
  }
}
