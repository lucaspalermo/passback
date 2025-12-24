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
import { transactionLimiter, checkRateLimit, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";
import { logTransactionEvent, logSecurityEvent } from "@/lib/audit";

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Rate limiting
    const identifier = getIdentifier(request, session?.user?.id);
    const rateLimit = await checkRateLimit(transactionLimiter(), identifier);
    if (!rateLimit.success) {
      logSecurityEvent("rate_limited", request, session?.user?.id, { route: "/api/transactions" });
      return rateLimitResponse(rateLimit.reset);
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Voce precisa estar logado para comprar" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId, paymentMethod = "PIX" } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "ID do ingresso e obrigatorio" },
        { status: 400 }
      );
    }

    // Busca o ingresso
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { seller: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso nao encontrado" },
        { status: 404 }
      );
    }

    // Verifica se há transações existentes
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        ticketId: ticket.id,
      },
      include: {
        buyer: true,
      },
    });

    if (existingTransaction) {
      const now = new Date();
      const isExpired = existingTransaction.status === "expired" ||
        (existingTransaction.status === "pending" && existingTransaction.expiresAt && new Date(existingTransaction.expiresAt) < now);

      if (isExpired) {
        // Deleta disputas e mensagens relacionadas antes de deletar a transação
        const dispute = await prisma.dispute.findUnique({
          where: { transactionId: existingTransaction.id },
        });
        if (dispute) {
          await prisma.disputeMessage.deleteMany({
            where: { disputeId: dispute.id },
          });
          await prisma.dispute.delete({
            where: { id: dispute.id },
          });
        }

        // Deleta a transação expirada para permitir nova compra
        await prisma.transaction.delete({
          where: { id: existingTransaction.id },
        });

        // Libera o ingresso
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "available" },
        });

        // Atualiza o ticket local
        ticket.status = "available";
      } else if (existingTransaction.status === "pending") {
        // Se é o mesmo comprador, gera novo pagamento
        if (existingTransaction.buyerId === session.user.id) {
          try {
            // Verifica se o comprador tem CPF
            if (!existingTransaction.buyer.cpf) {
              return NextResponse.json(
                { error: "Voce precisa cadastrar seu CPF no perfil para comprar" },
                { status: 400 }
              );
            }

            // Cria/busca cliente no Asaas
            const customer = await getOrCreateCustomer({
              name: existingTransaction.buyer.name,
              email: existingTransaction.buyer.email,
              cpfCnpj: existingTransaction.buyer.cpf,
              phone: existingTransaction.buyer.phone || undefined,
            });

            // Atualiza o ID do cliente no usuário se não tiver
            if (!existingTransaction.buyer.asaasCustomerId) {
              await prisma.user.update({
                where: { id: existingTransaction.buyerId },
                data: { asaasCustomerId: customer.id },
              });
            }

            // Cria cobrança PIX
            const payment = await createPayment({
              customerId: customer.id,
              value: existingTransaction.amount,
              description: `Ingresso: ${ticket.eventName} - ${ticket.ticketType}`,
              externalReference: existingTransaction.id,
              billingType: "PIX",
            });

            // Obtém QR Code PIX
            const pixQrCode = await getPixQrCode(payment.id);

            return NextResponse.json({
              transaction: existingTransaction,
              paymentId: payment.id,
              pixQrCode: {
                encodedImage: pixQrCode.encodedImage,
                payload: pixQrCode.payload,
                expirationDate: pixQrCode.expirationDate,
              },
            });
          } catch (asaasError) {
            console.error("Erro Asaas:", asaasError);
            return NextResponse.json({
              transaction: existingTransaction,
              pixQrCode: null,
              message: "Erro ao gerar pagamento. Tente novamente.",
            });
          }
        }
        // Transação pendente de outro comprador
        return NextResponse.json(
          { error: "Este ingresso já está sendo comprado por outra pessoa" },
          { status: 400 }
        );
      } else if (["paid", "confirmed", "released"].includes(existingTransaction.status)) {
        // Transação já concluída
        return NextResponse.json(
          { error: "Este ingresso já foi vendido" },
          { status: 400 }
        );
      } else if (existingTransaction.status === "cancelled" || existingTransaction.status === "refunded") {
        // Transação cancelada ou reembolsada - pode deletar e criar nova
        // Deleta disputas e mensagens relacionadas antes de deletar a transação
        const dispute = await prisma.dispute.findUnique({
          where: { transactionId: existingTransaction.id },
        });
        if (dispute) {
          await prisma.disputeMessage.deleteMany({
            where: { disputeId: dispute.id },
          });
          await prisma.dispute.delete({
            where: { id: dispute.id },
          });
        }

        await prisma.transaction.delete({
          where: { id: existingTransaction.id },
        });
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "available" },
        });
        ticket.status = "available";
      } else if (existingTransaction.status === "disputed") {
        // Transação em disputa - não pode criar nova
        return NextResponse.json(
          { error: "Este ingresso está em disputa e não pode ser comprado" },
          { status: 400 }
        );
      } else {
        // Status desconhecido - retorna erro
        return NextResponse.json(
          { error: "Este ingresso não está disponível no momento" },
          { status: 400 }
        );
      }
    }

    if (ticket.status !== "available") {
      return NextResponse.json(
        { error: "Este ingresso nao esta mais disponivel" },
        { status: 400 }
      );
    }

    if (ticket.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "Voce nao pode comprar seu proprio ingresso" },
        { status: 400 }
      );
    }

    // Busca dados do comprador
    const buyer = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    // Verifica se o comprador tem CPF cadastrado
    if (!buyer.cpf) {
      return NextResponse.json(
        { error: "Voce precisa cadastrar seu CPF no perfil para comprar" },
        { status: 400 }
      );
    }

    // Calcula taxas
    const amount = ticket.price;
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    const sellerAmount = amount - platformFee;

    // Define expiração em 5 minutos (tempo para pagar)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Cria a transação
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        platformFee,
        sellerAmount,
        status: "pending",
        expiresAt,
        ticketId: ticket.id,
        buyerId: session.user.id,
        sellerId: ticket.sellerId,
      },
    });

    // Atualiza status do ingresso
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "reserved" },
    });

    // Log de auditoria
    logTransactionEvent("created", session.user.id, transaction.id, {
      ticketId: ticket.id,
      amount,
      sellerId: ticket.sellerId,
    });

    // Cria cliente e pagamento no Asaas
    try {
      // Cria/busca cliente no Asaas
      const customer = await getOrCreateCustomer({
        name: buyer.name,
        email: buyer.email,
        cpfCnpj: buyer.cpf,
        phone: buyer.phone || undefined,
      });

      // Atualiza o ID do cliente no usuário se não tiver
      if (!buyer.asaasCustomerId) {
        await prisma.user.update({
          where: { id: buyer.id },
          data: { asaasCustomerId: customer.id },
        });
      }

      // Verifica o método de pagamento
      if (paymentMethod === "CREDIT_CARD") {
        // Para cartão, cria um link de pagamento
        const paymentLink = await createPaymentLink({
          name: `Ingresso: ${ticket.eventName}`,
          description: `${ticket.ticketType} - ${ticket.eventLocation}`,
          value: amount,
          billingType: "CREDIT_CARD",
          externalReference: transaction.id,
        });

        return NextResponse.json({
          transaction,
          checkoutUrl: paymentLink.url,
          paymentMethod: "CREDIT_CARD",
        });
      }

      // Para PIX, cria cobrança direta
      const payment = await createPayment({
        customerId: customer.id,
        value: amount,
        description: `Ingresso: ${ticket.eventName} - ${ticket.ticketType}`,
        externalReference: transaction.id,
        billingType: "PIX",
      });

      // Obtém QR Code PIX
      const pixQrCode = await getPixQrCode(payment.id);

      return NextResponse.json({
        transaction,
        paymentId: payment.id,
        paymentMethod: "PIX",
        pixQrCode: {
          encodedImage: pixQrCode.encodedImage,
          payload: pixQrCode.payload,
          expirationDate: pixQrCode.expirationDate,
        },
      });
    } catch (asaasError) {
      console.error("Erro Asaas:", asaasError);

      // Se falhar no Asaas, ainda retorna a transação para fluxo manual
      return NextResponse.json({
        transaction,
        pixQrCode: null,
        message: "Erro ao gerar pagamento. Tente novamente.",
      });
    }
  } catch (error) {
    console.error("Erro ao criar transacao:", error);
    return NextResponse.json(
      { error: "Erro ao processar compra" },
      { status: 500 }
    );
  }
}
