import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedUser | undefined;
  if (!user?.isAdmin) {
    return NextResponse.json({ coupons: [] });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Erro ao buscar cupons:", error);
    return NextResponse.json({ coupons: [] });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedUser | undefined;
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { code, type, value, minAmount, maxUses, validFrom, validUntil } = body;

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minAmount,
        maxUses,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Erro ao criar cupom:", error);
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}
