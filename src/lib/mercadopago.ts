import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);

export interface CreatePreferenceParams {
  transactionId: string;
  ticketName: string;
  ticketType: string;
  price: number;
  buyerEmail: string;
  buyerName: string;
}

export async function createPaymentPreference({
  transactionId,
  ticketName,
  ticketType,
  price,
  buyerEmail,
  buyerName,
}: CreatePreferenceParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: transactionId,
          title: `Ingresso: ${ticketName}`,
          description: `Tipo: ${ticketType}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: price,
        },
      ],
      payer: {
        email: buyerEmail,
        name: buyerName,
      },
      back_urls: {
        success: `${baseUrl}/compra/${transactionId}?status=success`,
        failure: `${baseUrl}/compra/${transactionId}?status=failure`,
        pending: `${baseUrl}/compra/${transactionId}?status=pending`,
      },
      auto_return: "approved",
      external_reference: transactionId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "PASSBACK",
    },
  });

  return preference;
}

export async function getPayment(paymentId: string) {
  const payment = await paymentClient.get({ id: paymentId });
  return payment;
}
