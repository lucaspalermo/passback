import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isFraudDetectionEnabled } from "@/modules/fraud";
import { logSuspiciousActivity } from "@/modules/fraud/services";
import prisma from "@/lib/prisma";

// GET - Buscar atividades suspeitas de um usuário (admin only)
export async function GET(request: NextRequest) {
  try {
    if (!isFraudDetectionEnabled()) {
      return NextResponse.json(
        { error: "Módulo de detecção de fraude desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const activities = await prisma.suspiciousActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Erro ao buscar atividades:", error);
    return NextResponse.json(
      { error: "Erro ao buscar atividades" },
      { status: 500 }
    );
  }
}

// POST - Registrar atividade suspeita (chamada interna)
export async function POST(request: NextRequest) {
  try {
    if (!isFraudDetectionEnabled()) {
      return NextResponse.json(
        { error: "Módulo de detecção de fraude desabilitado" },
        { status: 403 }
      );
    }

    // Verificar token de autorização para chamadas internas
    const authHeader = request.headers.get("authorization");
    const internalToken = process.env.INTERNAL_API_TOKEN;

    if (internalToken && authHeader !== `Bearer ${internalToken}`) {
      // Também permite admins
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { userId, activityType, details, ipAddress, deviceFingerprint } = body;

    if (!userId || !activityType) {
      return NextResponse.json(
        { error: "Dados da atividade são obrigatórios" },
        { status: 400 }
      );
    }

    await logSuspiciousActivity(
      userId,
      activityType,
      details,
      ipAddress,
      deviceFingerprint
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
    return NextResponse.json(
      { error: "Erro ao registrar atividade" },
      { status: 500 }
    );
  }
}
