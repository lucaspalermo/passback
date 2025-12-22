import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: transaction.status });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
