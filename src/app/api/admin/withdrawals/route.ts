import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Lista todos os saques (admin)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // Verifica se e admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const withdrawals = await prisma.withdrawal.findMany({
      where: status === "all" ? {} : { status },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                pixKey: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: "asc" },
    });

    // Estatisticas
    const stats = await prisma.withdrawal.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount,
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        status: w.status,
        requestedAt: w.requestedAt,
        processedAt: w.processedAt,
        completedAt: w.completedAt,
        rejectedAt: w.rejectedAt,
        rejectionReason: w.rejectionReason,
        proofUrl: w.proofUrl,
        notes: w.notes,
        user: w.wallet.user,
      })),
      stats: {
        pending: stats.find((s) => s.status === "pending") || { _count: { id: 0 }, _sum: { amount: 0 } },
        processing: stats.find((s) => s.status === "processing") || { _count: { id: 0 }, _sum: { amount: 0 } },
        completed: stats.find((s) => s.status === "completed") || { _count: { id: 0 }, _sum: { amount: 0 } },
        rejected: stats.find((s) => s.status === "rejected") || { _count: { id: 0 }, _sum: { amount: 0 } },
      },
    });
  } catch (error) {
    console.error("Erro ao listar saques:", error);
    return NextResponse.json({ error: "Erro ao listar saques" }, { status: 500 });
  }
}
