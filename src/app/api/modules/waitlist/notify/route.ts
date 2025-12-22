import { NextRequest, NextResponse } from "next/server";
import { isWaitlistEnabled } from "@/modules/waitlist";
import { notifyWaitlist } from "@/modules/waitlist/services";

// POST - Notificar próximos da lista quando ingresso disponível
// Este endpoint deve ser chamado quando um novo ingresso é listado
export async function POST(request: NextRequest) {
  try {
    if (!isWaitlistEnabled()) {
      return NextResponse.json(
        { error: "Módulo de lista de espera desabilitado" },
        { status: 403 }
      );
    }

    // Verificar token de autorização para chamadas internas
    const authHeader = request.headers.get("authorization");
    const internalToken = process.env.INTERNAL_API_TOKEN;

    if (internalToken && authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { eventName, ticketPrice, ticketId } = body;

    if (!eventName || !ticketId) {
      return NextResponse.json(
        { error: "Dados do ingresso são obrigatórios" },
        { status: 400 }
      );
    }

    const notifiedCount = await notifyWaitlist(eventName, ticketId, ticketPrice || 0);

    return NextResponse.json({
      notified: notifiedCount,
    });
  } catch (error) {
    console.error("Erro ao notificar lista de espera:", error);
    return NextResponse.json(
      { error: "Erro ao notificar lista de espera" },
      { status: 500 }
    );
  }
}
