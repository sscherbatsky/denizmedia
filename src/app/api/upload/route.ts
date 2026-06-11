import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
  }

  const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
  const fileType = (file && (file.type || "")) as string;
  if (fileType && ![...validImageTypes, ...validVideoTypes].includes(fileType)) {
    return NextResponse.json({ error: "Sadece JPEG/PNG/GIF/WebP resimler veya MP4/WebM/QuickTime videolar yüklenebilir." }, { status: 400 });
  }

  // Limit: allow larger uploads for videos (50MB), images keep 8MB
  const maxImageSize = 8 * 1024 * 1024;
  const maxVideoSize = 50 * 1024 * 1024;
  // Some runtimes may not expose `size` on File; guard it
  const fileSize = (file as any).size as number | undefined;
  if (fileSize) {
    if (validVideoTypes.includes(fileType) && fileSize > maxVideoSize) {
      return NextResponse.json({ error: "Video boyutu 50MB'dan büyük olamaz." }, { status: 400 });
    }
    if (validImageTypes.includes(fileType) && fileSize > maxImageSize) {
      return NextResponse.json({ error: "Resim boyutu 8MB'dan büyük olamaz." }, { status: 400 });
    }
  }

  // Use Vercel Blob if BLOB_READ_WRITE_TOKEN is available, otherwise fallback to local
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    try {
      const ext = (file.name && file.name.split(".").pop()) || (fileType.split("/")[1] || "png");
      const fileName = `${randomUUID()}.${ext}`;
      const blob = await put(fileName, file, { access: "public" });
      return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: "Blob yüklemesi başarısız.", details: String(err) }, { status: 500 });
    }
  } else {
    // Local fallback for development
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name && file.name.split(".").pop()) || (fileType.split("/")[1] || "png");
    const fileName = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const url = `/uploads/${fileName}`;
    return NextResponse.json({ url }, { status: 201 });
  }
}
