import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { releaseToAvailableBalance } from "@/lib/wallet";
import { sendPaymentReleasedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transacao e obrigatorio" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        ticket: true,
        seller: { select: { name: true, email: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    // Verifica se o usuário é o comprador
    if (transaction.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "Apenas o comprador pode confirmar" },
        { status: 403 }
      );
    }

    // Verifica se o status permite confirmação
    if (transaction.status !== "paid") {
      return NextResponse.json(
        { error: "Esta transacao nao pode ser confirmada" },
        { status: 400 }
      );
    }

    // Atualiza a transação como confirmada e liberada
    const now = new Date();
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "released",
          confirmedAt: now,
          releasedAt: now,
        },
      }),
      prisma.ticket.update({
        where: { id: transaction.ticketId },
        data: { status: "completed" },
      }),
    ]);

    // Libera o saldo para a carteira do vendedor
    await releaseToAvailableBalance(
      transaction.sellerId,
      transaction.sellerAmount,
      transaction.id,
      transaction.ticket?.eventName || "Ingresso",
      "confirmed"
    );

    // Envia email para o vendedor notificando que o pagamento foi liberado
    sendPaymentReleasedEmail(
      transaction.seller.email,
      transaction.seller.name,
      transaction.ticket.eventName,
      transaction.sellerAmount,
      transactionId
    ).catch((err) => console.error("[Email] Erro ao enviar liberação:", err));

    return NextResponse.json({
      message: "Confirmacao realizada com sucesso! O pagamento foi liberado ao vendedor.",
      transaction: await prisma.transaction.findUnique({
        where: { id: transactionId },
      }),
    });
  } catch (error) {
    console.error("Erro ao confirmar:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar transacao" },
      { status: 500 }
    );
  }
}
