import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// Lista mensagens de uma conversa
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    // Verifica se o usuário faz parte da conversa
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerId: session.user.id },
          { sellerId: session.user.id },
        ],
      },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        ticket: { select: { id: true, eventName: true, imageUrl: true, price: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    // Busca mensagens
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true } },
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Marca mensagens como lidas
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

// Padrões de conteúdo bloqueado (anti-fraude)
const blockedPatterns = [
  /\d{10,11}/g, // Telefones
  /whatsapp/gi,
  /zap/gi,
  /telegram/gi,
  /pix/gi,
  /chave.*pix/gi,
  /cpf.*\d/gi,
  /conta.*banco/gi,
  /transfer.*diret/gi,
];

function containsBlockedContent(text: string): boolean {
  return blockedPatterns.some((pattern) => pattern.test(text));
}

// Interface para anexos
interface AttachmentData {
  type: string;
  url: string;
  filename: string;
  size: number;
}

// Envia mensagem
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    const { content, attachments } = await request.json() as {
      content?: string;
      attachments?: AttachmentData[];
    };

    // Precisa ter conteúdo ou anexo
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    // Verifica conteúdo bloqueado (apenas se tiver texto)
    if (content && containsBlockedContent(content)) {
      return NextResponse.json({
        error: "Mensagem bloqueada: não compartilhe dados pessoais, telefone ou informações de pagamento fora da plataforma.",
      }, { status: 400 });
    }

    // Verifica se o usuário faz parte da conversa
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerId: session.user.id },
          { sellerId: session.user.id },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    // Cria mensagem com anexos
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content?.trim() || "",
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map((att) => ({
            type: att.type,
            url: att.url,
            filename: att.filename,
            size: att.size,
          })),
        } : undefined,
      },
      include: {
        sender: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    // Atualiza timestamp da conversa
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
