import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { generalLimiter, checkRateLimit, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

// Tipos de arquivo permitidos
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request, session.user.id);
    const rateLimit = await checkRateLimit(generalLimiter(), identifier);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Verifica tipo do arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo nao permitido. Use: JPG, PNG, GIF, WEBP, PDF, MP4 ou WEBM" },
        { status: 400 }
      );
    }

    // Verifica tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Maximo: 10MB" },
        { status: 400 }
      );
    }

    // Cria diretorio de uploads se nao existir
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Gera nome unico para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "bin";
    const fileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // Converte arquivo para buffer e salva
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retorna URL publica do arquivo
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      message: "Arquivo enviado com sucesso",
      url: fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    );
  }
}
