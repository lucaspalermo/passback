import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sendDisputeOpenedEmail } from "@/lib/email";

const disputeSchema = z.object({
  transactionId: z.string().min(1, "ID da transacao e obrigatorio"),
  reason: z.enum([
    "ingresso_invalido",
    "nao_recebeu",
    "ingresso_diferente",
    "vendedor_nao_responde",
    "outro"
  ]),
  description: z.string().min(10, "Descreva o problema com pelo menos 10 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = disputeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { transactionId, reason, description } = validation.data;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        dispute: true,
        ticket: true,
        buyer: { select: { id: true, name: true, email: true }, include: { reputation: true } },
        seller: { select: { id: true, name: true, email: true }, include: { reputation: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para abrir disputa nesta transacao" },
        { status: 403 }
      );
    }

    if (transaction.dispute) {
      return NextResponse.json(
        { error: "Ja existe uma disputa para esta transacao" },
        { status: 400 }
      );
    }

    if (!["paid", "confirmed"].includes(transaction.status)) {
      return NextResponse.json(
        { error: "Nao e possivel abrir disputa para esta transacao" },
        { status: 400 }
      );
    }

    // Cria ou atualiza reputacao do usuario que abriu a disputa
    await prisma.userReputation.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        disputesOpened: 1,
      },
      update: {
        disputesOpened: { increment: 1 },
      },
    });

    // Cria a disputa
    const dispute = await prisma.dispute.create({
      data: {
        reason,
        description,
        transactionId,
        userId: session.user.id,
      },
    });

    // Atualiza status da transação
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "disputed" },
    });

    // Mapeamento de motivos para exibição
    const reasonLabels: Record<string, string> = {
      ingresso_invalido: "Ingresso invalido",
      nao_recebeu: "Nao recebeu o ingresso",
      ingresso_diferente: "Ingresso diferente do anunciado",
      vendedor_nao_responde: "Vendedor nao responde",
      outro: "Outro motivo",
    };

    // Envia email para quem abriu a disputa
    const opener = isBuyer ? transaction.buyer : transaction.seller;
    const otherParty = isBuyer ? transaction.seller : transaction.buyer;

    sendDisputeOpenedEmail(
      opener.email,
      opener.name,
      transaction.ticket.eventName,
      reasonLabels[reason] || reason,
      dispute.id,
      true
    ).catch((err) => console.error("[Email] Erro disputa opener:", err));

    // Envia email para a outra parte
    sendDisputeOpenedEmail(
      otherParty.email,
      otherParty.name,
      transaction.ticket.eventName,
      reasonLabels[reason] || reason,
      dispute.id,
      false
    ).catch((err) => console.error("[Email] Erro disputa other:", err));

    return NextResponse.json(
      {
        message: "Disputa aberta com sucesso. Nossa equipe analisara o caso em ate 48 horas.",
        dispute,
        disputeId: dispute.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar disputa:", error);
    return NextResponse.json(
      { error: "Erro ao criar disputa" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    // Se for admin e pediu todas as disputas
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    let disputes;

    if (user?.isAdmin && all) {
      // Admin ve todas as disputas
      disputes = await prisma.dispute.findMany({
        include: {
          transaction: {
            include: {
              ticket: true,
              buyer: {
                select: { id: true, name: true, email: true, phone: true },
              },
              seller: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          evidences: true,
          messages: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Usuario normal ve apenas disputas onde é parte
      disputes = await prisma.dispute.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { transaction: { buyerId: session.user.id } },
            { transaction: { sellerId: session.user.id } },
          ],
        },
        include: {
          transaction: {
            include: {
              ticket: true,
              buyer: {
                select: { id: true, name: true, email: true },
              },
              seller: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          evidences: true,
          messages: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Erro ao buscar disputas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar disputas" },
      { status: 500 }
    );
  }
}
