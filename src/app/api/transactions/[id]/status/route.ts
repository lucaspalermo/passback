import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { creditPendingBalance } from "@/lib/wallet";

// Pega a API key do Asaas
function getAsaasApiKey(): string {
  if (process.env.ASAAS_API_KEY) {
    return process.env.ASAAS_API_KEY;
  }
  try {
    const keyPath = path.join(process.cwd(), ".asaas-key");
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, "utf8").trim();
    }
  } catch {
    // Ignora
  }
  return "";
}

// Verifica pagamento diretamente na API do Asaas
async function checkAsaasPaymentStatus(externalReference: string): Promise<{ status: string; id: string } | null> {
  const apiKey = getAsaasApiKey();
  if (!apiKey) return null;

  const isProduction = process.env.ASAAS_ENVIRONMENT === "production";
  const baseUrl = isProduction ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";

  try {
    const response = await fetch(`${baseUrl}/payments?externalReference=${externalReference}`, {
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.log("[Status] Asaas respondeu com erro:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const payment = data.data[0];
      console.log("[Status] Pagamento Asaas encontrado:", payment.id, "Status:", payment.status);
      return { status: payment.status, id: payment.id };
    }

    return null;
  } catch (error) {
    console.error("[Status] Erro ao consultar Asaas:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        ticket: true,
        seller: { select: { phone: true, name: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacao nao encontrada" },
        { status: 404 }
      );
    }

    // Se ainda está pendente, verifica na API do Asaas
    if (transaction.status === "pending") {
      console.log("[Status] Verificando transacao pendente:", id);

      const asaasPayment = await checkAsaasPaymentStatus(id);

      if (asaasPayment) {
        // Verifica se o pagamento foi confirmado no Asaas
        const paidStatuses = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

        if (paidStatuses.includes(asaasPayment.status)) {
          console.log("[Status] Pagamento CONFIRMADO! Atualizando banco...");

          // Atualiza a transação no banco
          await prisma.transaction.update({
            where: { id },
            data: {
              status: "paid",
              asaasPaymentId: asaasPayment.id,
              paymentMethod: "pix",
              paidAt: new Date(),
            },
          });

          // Atualiza o ingresso
          await prisma.ticket.update({
            where: { id: transaction.ticketId },
            data: { status: "sold" },
          });

          // Credita valor pendente na carteira do vendedor
          await creditPendingBalance(
            transaction.sellerId,
            transaction.sellerAmount,
            transaction.id,
            transaction.ticket?.eventName || "Ingresso"
          );

          console.log("[Status] Transacao atualizada para PAID e valor creditado na carteira");

          return NextResponse.json({
            status: "paid",
            sellerPhone: transaction.seller?.phone,
            sellerName: transaction.seller?.name,
            eventName: transaction.ticket?.eventName,
          });
        } else {
          console.log("[Status] Pagamento ainda pendente no Asaas:", asaasPayment.status);
        }
      } else {
        console.log("[Status] Nenhum pagamento encontrado no Asaas para:", id);
      }
    }

    return NextResponse.json({
      status: transaction.status,
      sellerPhone: transaction.seller?.phone,
      sellerName: transaction.seller?.name,
      eventName: transaction.ticket?.eventName,
    });
  } catch (error) {
    console.error("[Status] Erro geral:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
