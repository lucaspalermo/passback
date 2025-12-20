import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const ticketSchema = z.object({
  eventName: z.string().min(3, "Nome do evento deve ter pelo menos 3 caracteres"),
  eventDate: z.string().transform((val) => new Date(val)),
  eventLocation: z.string().min(3, "Local deve ter pelo menos 3 caracteres"),
  ticketType: z.string().min(1, "Tipo do ingresso e obrigatorio"),
  price: z.number().positive("Preco deve ser positivo"),
  originalPrice: z.number().positive().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Limpa transações expiradas e libera ingressos
    const now = new Date();
    const expiredTransactions = await prisma.transaction.findMany({
      where: {
        status: "pending",
        expiresAt: { lt: now },
      },
      select: { id: true, ticketId: true },
    });

    if (expiredTransactions.length > 0) {
      // Marca transações como expiradas
      await prisma.transaction.updateMany({
        where: {
          id: { in: expiredTransactions.map(t => t.id) },
        },
        data: { status: "expired" },
      });

      // Libera os ingressos
      await prisma.ticket.updateMany({
        where: {
          id: { in: expiredTransactions.map(t => t.ticketId) },
          status: "reserved",
        },
        data: { status: "available" },
      });
    }

    const where = {
      status: "available",
      eventDate: { gte: new Date() },
      ...(search && {
        OR: [
          { eventName: { contains: search } },
          { eventLocation: { contains: search } },
        ],
      }),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          seller: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar ingressos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ingressos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Voce precisa estar logado para vender ingressos" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = ticketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.eventDate < new Date()) {
      return NextResponse.json(
        { error: "A data do evento deve ser futura" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        sellerId: session.user.id,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ingresso:", error);
    return NextResponse.json(
      { error: "Erro ao criar ingresso" },
      { status: 500 }
    );
  }
}
