import { NextRequest, NextResponse } from "next/server";
import { processAutoReleases } from "@/lib/wallet";

// Este endpoint deve ser chamado periodicamente (a cada hora, por exemplo)
// Use um serviço como cron-job.org ou Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verifica token de seguranca (opcional)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    console.log("[Cron] Iniciando processamento de liberacoes automaticas...");

    const count = await processAutoReleases();

    console.log(`[Cron] ${count} transacoes liberadas automaticamente`);

    return NextResponse.json({
      message: `${count} transacoes liberadas automaticamente`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Erro ao processar liberacoes:", error);
    return NextResponse.json(
      { error: "Erro ao processar liberacoes" },
      { status: 500 }
    );
  }
}

// POST tambem funciona (para webhooks)
export async function POST(request: NextRequest) {
  return GET(request);
}
