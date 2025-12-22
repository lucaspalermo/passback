// API Route: /api/modules/offers/pay
// Processa pagamento de oferta aceita

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isOffersEnabled, OFFERS_CONFIG } from "@/modules/offers";
import { markOfferAsPaid, expireOffer } from "@/modules/offers/services";
import {
  getOrCreateCustomer,
  createPayment,
  getPixQrCode,
} from "@/lib/asaas";

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

// POST /api/modules/offers/pay
export async function POST(request: NextRequest) {
  if (!isOffersEnabled()) {
    return NextResponse.json(
      { error: "Módulo de ofertas desabilitado" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { offerId, paymentMethod = "PIX" } = await request.json();

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca a oferta
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        ticket: { include: { seller: true } },
        buyer: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Oferta não encontrada" },
        { status: 404 }
      );
    }

    // Verifica se é o comprador
    if (offer.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para pagar esta oferta" },
        { status: 403 }
      );
    }

    // Verifica status
    if (offer.status !== "accepted") {
      return NextResponse.json(
        { error: "Esta oferta não está aguardando pagamento" },
        { status: 400 }
      );
    }

    // Verifica prazo de pagamento
    if (offer.paymentDeadline && new Date() > offer.paymentDeadline) {
      await expireOffer(offerId);
      return NextResponse.json(
        { error: "O prazo para pagamento expirou" },
        { status: 400 }
      );
    }

    // Verifica CPF do comprador
    if (!offer.buyer.cpf) {
      return NextResponse.json(
        { error: "Você precisa cadastrar seu CPF no perfil para pagar" },
        { status: 400 }
      );
    }

    // Calcula taxas com o valor da OFERTA (não do ingresso)
    const amount = offer.amount;
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    const sellerAmount = amount - platformFee;

    // Define expiração para o tempo restante do prazo de pagamento
    const expiresAt = offer.paymentDeadline || new Date(Date.now() + OFFERS_CONFIG.paymentTimeoutMinutes * 60 * 1000);

    // Cria a transação
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        platformFee,
        sellerAmount,
        status: "pending",
        expiresAt,
        ticketId: offer.ticketId,
        buyerId: offer.buyerId,
        sellerId: offer.sellerId,
      },
    });

    // Atualiza status do ingresso para vendido (já estava reservado)
    await prisma.ticket.update({
      where: { id: offer.ticketId },
      data: { status: "sold" },
    });

    // Atualiza a oferta com o ID da transação
    await prisma.offer.update({
      where: { id: offerId },
      data: { transactionId: transaction.id },
    });

    // Cria cliente e pagamento no Asaas
    try {
      const customer = await getOrCreateCustomer({
        name: offer.buyer.name,
        email: offer.buyer.email,
        cpfCnpj: offer.buyer.cpf,
        phone: offer.buyer.phone || undefined,
      });

      // Atualiza o ID do cliente no usuário se não tiver
      if (!offer.buyer.asaasCustomerId) {
        await prisma.user.update({
          where: { id: offer.buyerId },
          data: { asaasCustomerId: customer.id },
        });
      }

      // Cria cobrança PIX
      const payment = await createPayment({
        customerId: customer.id,
        value: amount,
        description: `Oferta aceita: ${offer.ticket.eventName} - ${offer.ticket.ticketType}`,
        externalReference: transaction.id,
        billingType: paymentMethod === "CREDIT_CARD" ? "CREDIT_CARD" : "PIX",
      });

      // Obtém QR Code PIX
      const pixQrCode = await getPixQrCode(payment.id);

      // Log de início de pagamento
      await prisma.offerLog.create({
        data: {
          offerId,
          action: "payment_started",
          details: `Transação: ${transaction.id}`,
        },
      });

      return NextResponse.json({
        success: true,
        transaction,
        offer: {
          id: offer.id,
          amount: offer.amount,
          paymentDeadline: offer.paymentDeadline,
        },
        paymentId: payment.id,
        paymentMethod: "PIX",
        pixQrCode: {
          encodedImage: pixQrCode.encodedImage,
          payload: pixQrCode.payload,
          expirationDate: pixQrCode.expirationDate,
        },
        timeoutMinutes: OFFERS_CONFIG.paymentTimeoutMinutes,
      });
    } catch (asaasError) {
      console.error("[Offers Pay] Erro Asaas:", asaasError);

      return NextResponse.json({
        success: true,
        transaction,
        offer: {
          id: offer.id,
          amount: offer.amount,
          paymentDeadline: offer.paymentDeadline,
        },
        pixQrCode: null,
        message: "Erro ao gerar pagamento. Tente novamente.",
      });
    }
  } catch (error) {
    console.error("[Offers Pay] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}
