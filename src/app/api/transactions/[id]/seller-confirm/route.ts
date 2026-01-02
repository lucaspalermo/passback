import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateCustomer,
  createPayment,
  getPixQrCode,
  createPaymentLink,
} from "@/lib/asaas";
import { sendSellerConfirmedEmail, sendSellerRejectedEmail } from "@/lib/email";

const PAYMENT_TIMEOUT_MINUTES = 5; // 5 minutos para pagar apos confirmacao

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: transactionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Voce precisa estar logado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // "confirm" ou "reject"

    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Acao invalida. Use 'confirm' ou 'reject'" },
        { status: 400 }
      );
    }

    // Busca a transacao
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        ticket: true,
        buyer: true,
        seller: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    // Verifica se e o vendedor
    if (transaction.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para esta acao" },
        { status: 403 }
      );
    }

    // Verifica se esta aguardando confirmacao
    if (transaction.status !== "awaiting_seller") {
      return NextResponse.json(
        { error: "Esta transacao nao esta aguardando confirmacao" },
        { status: 400 }
      );
    }

    // Verifica se expirou
    if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
      // Atualiza para expirado
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "expired" },
        }),
        prisma.ticket.update({
          where: { id: transaction.ticketId },
          data: { status: "available" },
        }),
      ]);

      return NextResponse.json(
        { error: "O tempo para confirmar expirou" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Vendedor rejeitou - cancela a reserva
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "seller_rejected" },
        }),
        prisma.ticket.update({
          where: { id: transaction.ticketId },
          data: { status: "available" },
        }),
      ]);

      // Log de auditoria
      console.log("[Audit] seller_rejected", {
        userId: session.user.id,
        transactionId,
        reason: "Vendedor rejeitou a reserva",
      });

      // Notifica o comprador
      sendSellerRejectedEmail(
        transaction.buyer.email,
        transaction.buyer.name,
        transaction.ticket.eventName,
        transaction.ticket.ticketType,
        transaction.amount,
        transaction.seller.name
      ).catch((err) => console.error("[Email] Erro ao notificar rejeicao:", err));

      return NextResponse.json({
        success: true,
        message: "Reserva rejeitada. O ingresso voltou a ficar disponivel.",
        status: "seller_rejected",
      });
    }

    // Vendedor confirmou - gera o pagamento
    try {
      // Nova expiracao para pagamento (5 minutos)
      const newExpiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

      // Verifica se o comprador tem CPF
      if (!transaction.buyer.cpf) {
        return NextResponse.json(
          { error: "O comprador precisa ter CPF cadastrado" },
          { status: 400 }
        );
      }

      // Cria/busca cliente no Asaas
      const customer = await getOrCreateCustomer({
        name: transaction.buyer.name,
        email: transaction.buyer.email,
        cpfCnpj: transaction.buyer.cpf,
        phone: transaction.buyer.phone || undefined,
      });

      // Atualiza o ID do cliente no usuario se nao tiver
      if (!transaction.buyer.asaasCustomerId) {
        await prisma.user.update({
          where: { id: transaction.buyerId },
          data: { asaasCustomerId: customer.id },
        });
      }

      let paymentData: {
        paymentId?: string;
        pixQrCode?: { encodedImage: string; payload: string; expirationDate: string };
        checkoutUrl?: string;
      } = {};

      const paymentMethod = transaction.paymentMethod?.toUpperCase() || "PIX";

      if (paymentMethod === "CREDIT_CARD") {
        // Para cartao, cria um link de pagamento
        const paymentLink = await createPaymentLink({
          name: `Ingresso: ${transaction.ticket.eventName}`,
          description: `${transaction.ticket.ticketType} - ${transaction.ticket.eventLocation}`,
          value: transaction.amount,
          billingType: "CREDIT_CARD",
          externalReference: transaction.id,
        });

        paymentData.checkoutUrl = paymentLink.url;
      } else {
        // Para PIX, cria cobranca direta
        const payment = await createPayment({
          customerId: customer.id,
          value: transaction.amount,
          description: `Ingresso: ${transaction.ticket.eventName} - ${transaction.ticket.ticketType}`,
          externalReference: transaction.id,
          billingType: "PIX",
        });

        // Obtem QR Code PIX
        const pixQrCode = await getPixQrCode(payment.id);

        paymentData = {
          paymentId: payment.id,
          pixQrCode: {
            encodedImage: pixQrCode.encodedImage,
            payload: pixQrCode.payload,
            expirationDate: pixQrCode.expirationDate,
          },
        };
      }

      // Atualiza a transacao para pending (aguardando pagamento)
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "pending",
          expiresAt: newExpiresAt,
        },
      });

      // Log de auditoria
      console.log("[Audit] seller_confirmed", {
        userId: session.user.id,
        transactionId,
        newStatus: "pending",
        paymentMethod,
      });

      // Notifica o comprador que pode pagar
      sendSellerConfirmedEmail(
        transaction.buyer.email,
        transaction.buyer.name,
        transaction.ticket.eventName,
        transaction.ticket.ticketType,
        transaction.amount,
        transaction.seller.name,
        transactionId,
        PAYMENT_TIMEOUT_MINUTES
      ).catch((err) => console.error("[Email] Erro ao notificar confirmacao:", err));

      return NextResponse.json({
        success: true,
        message: "Reserva confirmada! O comprador foi notificado para pagar.",
        status: "pending",
        expiresAt: newExpiresAt,
        paymentTimeout: PAYMENT_TIMEOUT_MINUTES,
        ...paymentData,
      });
    } catch (asaasError) {
      console.error("Erro Asaas:", asaasError);

      // Mesmo com erro no Asaas, atualiza para pending
      const newExpiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "pending",
          expiresAt: newExpiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Reserva confirmada, mas houve erro ao gerar pagamento. O comprador pode tentar novamente.",
        status: "pending",
        expiresAt: newExpiresAt,
        error: "Erro ao gerar pagamento",
      });
    }
  } catch (error) {
    console.error("Erro ao processar confirmacao do vendedor:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitacao" },
      { status: 500 }
    );
  }
}
