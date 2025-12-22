// API Route: /api/modules/chat/conversations
// Lista e cria conversas

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isChatEnabled } from "../../config";
import { listConversations, getOrCreateConversation } from "../../services";

// GET /api/modules/chat/conversations
export async function GET() {
  if (!isChatEnabled()) {
    return NextResponse.json(
      { error: "Módulo de chat desabilitado" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const conversations = await listConversations(session.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[Chat] Erro ao listar conversas:", error);
    return NextResponse.json(
      { error: "Erro ao listar conversas" },
      { status: 500 }
    );
  }
}

// POST /api/modules/chat/conversations
export async function POST(request: NextRequest) {
  if (!isChatEnabled()) {
    return NextResponse.json(
      { error: "Módulo de chat desabilitado" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { ticketId, transactionId, buyerId, sellerId } = await request.json();

    if (!ticketId || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: "Dados incompletos: ticketId, buyerId e sellerId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se o usuário é parte da conversa
    if (session.user.id !== buyerId && session.user.id !== sellerId) {
      return NextResponse.json(
        { error: "Você não tem acesso a esta conversa" },
        { status: 403 }
      );
    }

    const conversation = await getOrCreateConversation({
      ticketId,
      transactionId,
      buyerId,
      sellerId,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("[Chat] Erro ao criar conversa:", error);
    return NextResponse.json(
      { error: "Erro ao criar conversa" },
      { status: 500 }
    );
  }
}
