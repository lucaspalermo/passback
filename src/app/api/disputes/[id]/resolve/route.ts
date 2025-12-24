import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendDisputeResolvedEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: disputeId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Verifica se e admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem resolver disputas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { decision, resolution } = body;

    // decision: "buyer" (reembolso), "seller" (libera pagamento), "split" (divide)
    if (!["buyer", "seller", "split"].includes(decision)) {
      return NextResponse.json(
        { error: "Decisao invalida. Use: buyer, seller ou split" },
        { status: 400 }
      );
    }

    if (!resolution || resolution.length < 10) {
      return NextResponse.json(
        { error: "Justificativa deve ter pelo menos 10 caracteres" },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: {
          include: {
            ticket: true,
            buyer: { select: { id: true, name: true, email: true }, include: { reputation: true } },
            seller: { select: { id: true, name: true, email: true }, include: { reputation: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Disputa nao encontrada" },
        { status: 404 }
      );
    }

    if (!["open", "under_review"].includes(dispute.status)) {
      return NextResponse.json(
        { error: "Esta disputa ja foi resolvida" },
        { status: 400 }
      );
    }

    const transaction = dispute.transaction;
    const buyerId = transaction.buyerId;
    const sellerId = transaction.sellerId;

    // Determina o status final baseado na decisao
    let disputeStatus = "closed";
    let transactionStatus = "refunded";

    if (decision === "buyer") {
      disputeStatus = "resolved_buyer";
      transactionStatus = "refunded";
    } else if (decision === "seller") {
      disputeStatus = "resolved_seller";
      transactionStatus = "released";
    } else if (decision === "split") {
      disputeStatus = "closed";
      transactionStatus = "released"; // Nesse caso, split seria tratado manualmente
    }

    // Atualiza a disputa
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: disputeStatus,
        resolution,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
      },
    });

    // Atualiza a transacao
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: transactionStatus,
        ...(transactionStatus === "released" && { releasedAt: new Date() }),
      },
    });

    // Atualiza reputacao do perdedor
    if (decision === "buyer") {
      // Vendedor perdeu - diminui trust score
      await prisma.userReputation.upsert({
        where: { userId: sellerId },
        create: {
          userId: sellerId,
          disputesLost: 1,
          trustScore: 70, // Penalidade inicial
        },
        update: {
          disputesLost: { increment: 1 },
          trustScore: { decrement: 15 },
        },
      });

      // Comprador ganhou
      await prisma.userReputation.upsert({
        where: { userId: buyerId },
        create: {
          userId: buyerId,
          disputesWon: 1,
        },
        update: {
          disputesWon: { increment: 1 },
        },
      });
    } else if (decision === "seller") {
      // Comprador perdeu - pode ser golpista
      await prisma.userReputation.upsert({
        where: { userId: buyerId },
        create: {
          userId: buyerId,
          disputesLost: 1,
          trustScore: 60, // Penalidade maior para possivel golpista
          isSuspicious: true,
        },
        update: {
          disputesLost: { increment: 1 },
          trustScore: { decrement: 20 },
          isSuspicious: true,
        },
      });

      // Vendedor ganhou
      await prisma.userReputation.upsert({
        where: { userId: sellerId },
        create: {
          userId: sellerId,
          disputesWon: 1,
        },
        update: {
          disputesWon: { increment: 1 },
          trustScore: { increment: 5 }, // Bonus por ser inocentado
        },
      });
    }

    // Verifica se usuario tem muitas disputas perdidas - marca como suspeito
    const loserReputation = await prisma.userReputation.findUnique({
      where: { userId: decision === "buyer" ? sellerId : buyerId },
    });

    if (loserReputation && loserReputation.disputesLost >= 3) {
      await prisma.userReputation.update({
        where: { userId: decision === "buyer" ? sellerId : buyerId },
        data: { isSuspicious: true },
      });
    }

    // Adiciona mensagem do sistema
    await prisma.disputeMessage.create({
      data: {
        message: `Disputa resolvida a favor do ${decision === "buyer" ? "COMPRADOR" : "VENDEDOR"}. Motivo: ${resolution}`,
        sender: "admin",
        senderId: session.user.id,
        disputeId,
      },
    });

    // Envia emails para ambas as partes
    const buyerWon = decision === "buyer";

    // Email para o comprador
    sendDisputeResolvedEmail(
      transaction.buyer.email,
      transaction.buyer.name,
      transaction.ticket.eventName,
      decision as "buyer" | "seller",
      buyerWon,
      transaction.amount,
      disputeId
    ).catch((err) => console.error("[Email] Erro disputa comprador:", err));

    // Email para o vendedor
    sendDisputeResolvedEmail(
      transaction.seller.email,
      transaction.seller.name,
      transaction.ticket.eventName,
      decision as "buyer" | "seller",
      !buyerWon,
      transaction.sellerAmount,
      disputeId
    ).catch((err) => console.error("[Email] Erro disputa vendedor:", err));

    return NextResponse.json({
      message: `Disputa resolvida a favor do ${decision === "buyer" ? "comprador" : "vendedor"}`,
      decision,
      transactionStatus,
    });
  } catch (error) {
    console.error("Erro ao resolver disputa:", error);
    return NextResponse.json(
      { error: "Erro ao resolver disputa" },
      { status: 500 }
    );
  }
}
