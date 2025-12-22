import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isFraudDetectionEnabled } from "@/modules/fraud";
import { listFraudAlerts, analyzeTransactionRisk } from "@/modules/fraud/services";

// GET - Buscar alertas de fraude (admin only)
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
    const status = searchParams.get("status") || "open";

    const alerts = await listFraudAlerts(status as "open" | "investigating" | "resolved" | "dismissed");

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Erro ao buscar alertas de fraude:", error);
    return NextResponse.json(
      { error: "Erro ao buscar alertas de fraude" },
      { status: 500 }
    );
  }
}

// POST - Analisar transação
export async function POST(request: NextRequest) {
  try {
    if (!isFraudDetectionEnabled()) {
      return NextResponse.json(
        { error: "Módulo de detecção de fraude desabilitado" },
        { status: 403 }
      );
    }

    // Pode ser chamado internamente ou por admin
    const authHeader = request.headers.get("authorization");
    const internalToken = process.env.INTERNAL_API_TOKEN;

    const session = await getServerSession(authOptions);
    const isInternal = internalToken && authHeader === `Bearer ${internalToken}`;
    const isAdmin = session?.user?.isAdmin;

    if (!isInternal && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, buyerId, amount, deviceInfo } = body;

    if (!transactionId || !buyerId || !amount) {
      return NextResponse.json(
        { error: "Dados da transação são obrigatórios" },
        { status: 400 }
      );
    }

    const analysis = await analyzeTransactionRisk(
      transactionId,
      buyerId,
      amount,
      deviceInfo
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Erro ao analisar transação:", error);
    return NextResponse.json(
      { error: "Erro ao analisar transação" },
      { status: 500 }
    );
  }
}
