import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET - Estatisticas de avaliacoes de um usuario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    // Busca estatisticas agregadas
    const [stats, distribution, recentReviews] = await Promise.all([
      // Media e total
      prisma.review.aggregate({
        where: { reviewedId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      // Distribuicao por estrelas
      prisma.review.groupBy({
        by: ["rating"],
        where: { reviewedId: userId },
        _count: { rating: true },
      }),
      // Ultimas 3 avaliacoes
      prisma.review.findMany({
        where: { reviewedId: userId },
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
          transaction: {
            select: {
              ticket: { select: { eventName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    // Formata distribuicao
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count.rating;
    });

    // Calcula porcentagem de avaliacoes positivas (4-5 estrelas)
    const totalReviews = stats._count.rating;
    const positiveReviews = ratingDistribution[4] + ratingDistribution[5];
    const positivePercentage = totalReviews > 0
      ? Math.round((positiveReviews / totalReviews) * 100)
      : 0;

    return NextResponse.json({
      userId,
      averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      totalReviews,
      positivePercentage,
      distribution: ratingDistribution,
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: {
          name: r.reviewer.name,
          image: r.reviewer.image,
        },
        eventName: r.transaction.ticket.eventName,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar estatisticas:", error);
    return NextResponse.json({ error: "Erro ao buscar estatisticas" }, { status: 500 });
  }
}
