// API Route: /api/modules/chat/messages
// Envia e lista mensagens

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isChatEnabled } from "../../config";
import { getMessages, sendMessage, markAsRead } from "../../services";
import { messageLimiter, checkRateLimit, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

// GET /api/modules/chat/messages?conversationId=xxx
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId é obrigatório" },
        { status: 400 }
      );
    }

    const messages = await getMessages(
      conversationId,
      session.user.id,
      limit,
      before || undefined
    );

    // Marca como lidas
    await markAsRead(conversationId, session.user.id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Chat] Erro ao buscar mensagens:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    );
  }
}

// POST /api/modules/chat/messages
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

  // Rate limiting (30 mensagens por minuto)
  const identifier = getIdentifier(request, session.user.id);
  const rateLimit = await checkRateLimit(messageLimiter(), identifier);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  try {
    const { conversationId, content, attachments } = await request.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: "Conversa e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await sendMessage({
      conversationId,
      senderId: session.user.id,
      content: content.trim(),
      attachments,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("[Chat] Erro ao enviar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
