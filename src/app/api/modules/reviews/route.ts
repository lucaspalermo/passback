import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Criar avaliacao
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const { transactionId, rating, comment } = await request.json();

    // Validacoes
    if (!transactionId) {
      return NextResponse.json({ error: "ID da transacao obrigatorio" }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Avaliacao deve ser entre 1 e 5 estrelas" }, { status: 400 });
    }

    // Busca a transacao
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        ticket: { select: { eventName: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transacao nao encontrada" }, { status: 404 });
    }

    // Verifica se o usuario faz parte da transacao
    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Voce nao faz parte desta transacao" }, { status: 403 });
    }

    // Verifica se a transacao foi concluida (released ou confirmed)
    if (!["released", "confirmed"].includes(transaction.status)) {
      return NextResponse.json(
        { error: "Voce so pode avaliar apos a transacao ser concluida" },
        { status: 400 }
      );
    }

    // Define quem esta avaliando quem
    const reviewerId = session.user.id;
    const reviewedId = isBuyer ? transaction.sellerId : transaction.buyerId;
    const type = isBuyer ? "buyer_to_seller" : "seller_to_buyer";

    // Verifica se ja avaliou
    const existingReview = await prisma.review.findUnique({
      where: {
        transactionId_type: {
          transactionId,
          type,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "Voce ja avaliou esta transacao" }, { status: 400 });
    }

    // Cria a avaliacao
    const review = await prisma.review.create({
      data: {
        transactionId,
        reviewerId,
        reviewedId,
        rating,
        comment: comment?.trim() || null,
        type,
      },
    });

    // Atualiza estatisticas de reputacao do avaliado
    await prisma.userReputation.upsert({
      where: { userId: reviewedId },
      create: {
        userId: reviewedId,
        totalSales: isBuyer ? 1 : 0,
        totalPurchases: isSeller ? 1 : 0,
        completedSales: isBuyer ? 1 : 0,
        completedPurchases: isSeller ? 1 : 0,
      },
      update: {
        completedSales: isBuyer ? { increment: 1 } : undefined,
        completedPurchases: isSeller ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json({
      message: "Avaliacao enviada com sucesso!",
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        type: review.type,
      },
    });
  } catch (error) {
    console.error("Erro ao criar avaliacao:", error);
    return NextResponse.json({ error: "Erro ao criar avaliacao" }, { status: 500 });
  }
}

// GET - Listar avaliacoes de um usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // received ou given
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }

    // Busca avaliacoes
    const whereClause = type === "given"
      ? { reviewerId: userId }
      : { reviewedId: userId };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
          reviewed: { select: { id: true, name: true, image: true } },
          transaction: {
            select: {
              ticket: { select: { eventName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where: whereClause }),
    ]);

    // Calcula estatisticas
    const stats = await prisma.review.aggregate({
      where: { reviewedId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Distribuicao por estrelas
    const distribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { reviewedId: userId },
      _count: { rating: true },
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count.rating;
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        type: r.type,
        createdAt: r.createdAt,
        reviewer: r.reviewer,
        reviewed: r.reviewed,
        eventName: r.transaction.ticket.eventName,
      })),
      total,
      stats: {
        averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
        totalReviews: stats._count.rating,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar avaliacoes:", error);
    return NextResponse.json({ error: "Erro ao buscar avaliacoes" }, { status: 500 });
  }
}
