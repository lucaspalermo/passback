// API Route isolada para o módulo de notificações
// Endpoint: /api/modules/notifications

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isNotificationsEnabled } from "../config";
import {
  notifyPaymentConfirmed,
  notifyTicketSold,
  notifyDisputeOpened,
  notifyWelcome,
} from "../services";
import type { NotificationRecipient } from "../types";

// POST /api/modules/notifications
// Dispara notificações via API interna
export async function POST(request: NextRequest) {
  // Verifica se módulo está habilitado
  if (!isNotificationsEnabled()) {
    return NextResponse.json(
      { error: "Módulo de notificações desabilitado" },
      { status: 503 }
    );
  }

  // Verifica autenticação (apenas chamadas internas autenticadas)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, recipient, data } = body;

    if (!type || !recipient) {
      return NextResponse.json(
        { error: "Tipo e destinatário são obrigatórios" },
        { status: 400 }
      );
    }

    const recipientData: NotificationRecipient = {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      phone: recipient.phone,
    };

    let result;

    switch (type) {
      case "payment_confirmed":
        result = await notifyPaymentConfirmed(recipientData, data);
        break;

      case "ticket_sold":
        result = await notifyTicketSold(recipientData, data);
        break;

      case "dispute_opened":
        if (!body.opponent) {
          return NextResponse.json(
            { error: "Oponente é obrigatório para disputas" },
            { status: 400 }
          );
        }
        result = await notifyDisputeOpened(recipientData, body.opponent, data);
        break;

      case "welcome":
        result = await notifyWelcome(recipientData);
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de notificação desconhecido: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Notifications API] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar notificação" },
      { status: 500 }
    );
  }
}

// GET /api/modules/notifications
// Retorna status do módulo
export async function GET() {
  return NextResponse.json({
    enabled: isNotificationsEnabled(),
    module: "notifications",
    version: "1.0.0",
  });
}
