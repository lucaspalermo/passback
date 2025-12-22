import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isFraudDetectionEnabled } from "@/modules/fraud";
import { resolveFraudAlert } from "@/modules/fraud/services";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ alertId: string }>;
}

// GET - Buscar detalhes de um alerta
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { alertId } = await params;
    const alert = await prisma.fraudAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Erro ao buscar alerta:", error);
    return NextResponse.json(
      { error: "Erro ao buscar alerta" },
      { status: 500 }
    );
  }
}

// PATCH - Resolver/atualizar alerta
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { alertId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["resolved", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    const success = await resolveFraudAlert(
      alertId,
      session.user.id,
      status as "resolved" | "dismissed"
    );

    if (!success) {
      return NextResponse.json({ error: "Erro ao resolver alerta" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao resolver alerta:", error);
    return NextResponse.json(
      { error: "Erro ao resolver alerta" },
      { status: 500 }
    );
  }
}
