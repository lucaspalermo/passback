import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Busca status de verificação do usuário
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const verification = await prisma.identityVerification.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ verification });
  } catch (error) {
    console.error("Erro ao buscar verificação:", error);
    return NextResponse.json({ error: "Erro ao buscar verificação" }, { status: 500 });
  }
}

// Submete nova verificação
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { documentType, documentUrl, selfieUrl } = await request.json();

    if (!documentType || !documentUrl || !selfieUrl) {
      return NextResponse.json({
        error: "Todos os campos são obrigatórios: documentType, documentUrl, selfieUrl",
      }, { status: 400 });
    }

    // Verifica se já existe verificação pendente ou aprovada
    const existing = await prisma.identityVerification.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["pending", "approved"] },
      },
    });

    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json({ error: "Você já foi verificado" }, { status: 400 });
      }
      return NextResponse.json({ error: "Você já tem uma verificação pendente" }, { status: 400 });
    }

    // Cria nova verificação
    const verification = await prisma.identityVerification.create({
      data: {
        userId: session.user.id,
        documentType,
        documentFrontUrl: documentUrl,
        selfieUrl,
        status: "pending",
      },
    });

    return NextResponse.json({ verification });
  } catch (error) {
    console.error("Erro ao criar verificação:", error);
    return NextResponse.json({ error: "Erro ao criar verificação" }, { status: 500 });
  }
}
