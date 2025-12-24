import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Verifica se usuario pode avaliar uma transacao
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId obrigatorio" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        reviews: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transacao nao encontrada" }, { status: 404 });
    }

    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({
        canReview: false,
        reason: "Voce nao faz parte desta transacao",
      });
    }

    // Verifica se transacao foi concluida
    if (!["released", "confirmed"].includes(transaction.status)) {
      return NextResponse.json({
        canReview: false,
        reason: "Transacao ainda nao foi concluida",
        status: transaction.status,
      });
    }

    // Verifica se ja avaliou
    const type = isBuyer ? "buyer_to_seller" : "seller_to_buyer";
    const alreadyReviewed = transaction.reviews.some((r) => r.type === type);

    if (alreadyReviewed) {
      const myReview = transaction.reviews.find((r) => r.type === type);
      return NextResponse.json({
        canReview: false,
        reason: "Voce ja avaliou esta transacao",
        existingReview: myReview ? {
          rating: myReview.rating,
          comment: myReview.comment,
          createdAt: myReview.createdAt,
        } : null,
      });
    }

    // Pode avaliar
    return NextResponse.json({
      canReview: true,
      userToReview: isBuyer ? transaction.seller : transaction.buyer,
      reviewType: type,
    });
  } catch (error) {
    console.error("Erro ao verificar avaliacao:", error);
    return NextResponse.json({ error: "Erro ao verificar" }, { status: 500 });
  }
}
