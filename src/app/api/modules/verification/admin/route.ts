import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

// Lista verificações pendentes (admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedUser | undefined;
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const verifications = await prisma.identityVerification.findMany({
      where: { status: "pending" },
      include: {
        user: {
          select: { id: true, name: true, email: true, cpf: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Erro ao buscar verificações:", error);
    return NextResponse.json({ error: "Erro ao buscar verificações" }, { status: 500 });
  }
}

// Aprovar ou rejeitar verificação (admin)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedUser | undefined;
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { verificationId, action, rejectionReason } = await request.json();

    if (!verificationId || !action) {
      return NextResponse.json({ error: "verificationId e action são obrigatórios" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action deve ser 'approve' ou 'reject'" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "rejectionReason é obrigatório para rejeição" }, { status: 400 });
    }

    const verification = await prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return NextResponse.json({ error: "Verificação não encontrada" }, { status: 404 });
    }

    if (verification.status !== "pending") {
      return NextResponse.json({ error: "Verificação já foi processada" }, { status: 400 });
    }

    // Atualiza verificação
    const updated = await prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        rejectionReason: action === "reject" ? rejectionReason : null,
        verifiedAt: action === "approve" ? new Date() : null,
        reviewedBy: user.id,
      },
    });

    // Se aprovado, marca usuário como verificado
    if (action === "approve") {
      await prisma.user.update({
        where: { id: verification.userId },
        data: { verified: true },
      });
    }

    return NextResponse.json({ verification: updated });
  } catch (error) {
    console.error("Erro ao processar verificação:", error);
    return NextResponse.json({ error: "Erro ao processar verificação" }, { status: 500 });
  }
}
