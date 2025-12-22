// API Route: /api/modules/offers/cron
// Processa ofertas expiradas (para ser chamado por cron job)

import { NextRequest, NextResponse } from "next/server";
import { isOffersEnabled } from "@/modules/offers";
import { processExpiredOffers } from "@/modules/offers/services";

// GET /api/modules/offers/cron - Processa ofertas expiradas
// Pode ser chamado por Vercel Cron, GitHub Actions, ou qualquer scheduler
export async function GET(request: NextRequest) {
  // Verifica token de autorização para evitar chamadas não autorizadas
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Se CRON_SECRET está configurado, exige autenticação
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  if (!isOffersEnabled()) {
    return NextResponse.json({
      success: true,
      message: "Módulo de ofertas desabilitado",
      processed: 0,
    });
  }

  try {
    const processed = await processExpiredOffers();

    return NextResponse.json({
      success: true,
      message: `${processed} ofertas processadas`,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Offers Cron] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar ofertas expiradas" },
      { status: 500 }
    );
  }
}

// Configuração para Vercel Cron (executar a cada 1 minuto)
export const dynamic = "force-dynamic";
export const maxDuration = 30;
