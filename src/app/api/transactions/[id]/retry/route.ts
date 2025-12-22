import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateCustomer,
  createPayment,
  getPixQrCode,
} from "@/lib/asaas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Voce precisa estar logado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Busca a transação
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        ticket: true,
        buyer: true,
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
        { error: "Voce nao tem permissao para acessar esta transacao" },
        { status: 403 }
      );
    }

    // Verifica se a transação está pendente
    if (transaction.status !== "pending") {
      return NextResponse.json(
        { error: "Esta transacao nao esta mais pendente" },
        { status: 400 }
      );
    }

    // Verifica se a transação expirou
    const now = new Date();
    if (transaction.expiresAt && new Date(transaction.expiresAt) < now) {
      // Marca como expirada e libera o ingresso
      await prisma.transaction.update({
        where: { id },
        data: { status: "expired" },
      });
      await prisma.ticket.update({
        where: { id: transaction.ticketId },
        data: { status: "available" },
      });

      return NextResponse.json(
        { error: "Esta transacao expirou. O ingresso voltou a ficar disponivel." },
        { status: 400 }
      );
    }

    // Verifica se o comprador tem CPF
    if (!transaction.buyer.cpf) {
      return NextResponse.json(
        { error: "Voce precisa cadastrar seu CPF no perfil para comprar" },
        { status: 400 }
      );
    }

    // Recria o pagamento no Asaas
    try {
      // Cria/busca cliente no Asaas
      const customer = await getOrCreateCustomer({
        name: transaction.buyer.name,
        email: transaction.buyer.email,
        cpfCnpj: transaction.buyer.cpf,
        phone: transaction.buyer.phone || undefined,
      });

      // Atualiza o ID do cliente no usuário se não tiver
      if (!transaction.buyer.asaasCustomerId) {
        await prisma.user.update({
          where: { id: transaction.buyerId },
          data: { asaasCustomerId: customer.id },
        });
      }

      // Cria nova cobrança PIX
      const payment = await createPayment({
        customerId: customer.id,
        value: transaction.amount,
        description: `Ingresso: ${transaction.ticket.eventName} - ${transaction.ticket.ticketType}`,
        externalReference: transaction.id,
        billingType: "PIX",
      });

      // Obtém QR Code PIX
      const pixQrCode = await getPixQrCode(payment.id);

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        pixQrCode: {
          encodedImage: pixQrCode.encodedImage,
          payload: pixQrCode.payload,
          expirationDate: pixQrCode.expirationDate,
        },
        expiresAt: transaction.expiresAt,
      });
    } catch (asaasError) {
      console.error("Erro ao criar pagamento Asaas:", asaasError);
      return NextResponse.json(
        { error: "Erro ao gerar link de pagamento" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao retomar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitacao" },
      { status: 500 }
    );
  }
}
