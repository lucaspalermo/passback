import { Resend } from "resend";

// Lazy initialization para evitar erro durante o build
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Passback <noreply@passback.com.br>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://passback.com.br";

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// Função genérica de envio
async function sendEmail({ to, subject, html }: EmailTemplate) {
  const resend = getResendClient();

  if (!resend) {
    console.log("[Email] RESEND_API_KEY não configurada. Email não enviado:", { to, subject });
    return { success: false, error: "API key não configurada" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Erro ao enviar:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Enviado com sucesso:", { to, subject, id: data?.id });
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return { success: false, error: "Erro interno" };
  }
}

// Template base para todos os emails
function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passback</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1F33; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #16C784;">
                Passback
              </h1>
              <p style="margin: 5px 0 0; font-size: 14px; color: #8B9DB5;">
                Revenda segura de ingressos
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #0F2A44; border-radius: 16px; padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px;">
              <p style="margin: 0; font-size: 12px; color: #5A6C7D;">
                Este email foi enviado pelo Passback.<br>
                Se voce nao reconhece esta acao, ignore este email.
              </p>
              <p style="margin: 15px 0 0; font-size: 12px; color: #5A6C7D;">
                <a href="${APP_URL}" style="color: #16C784; text-decoration: none;">passback.com.br</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Botão estilizado
function buttonHtml(text: string, url: string) {
  return `
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); color: #0B1F33; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-top: 20px;">
      ${text}
    </a>
  `;
}

// Formatar preço
function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ==================== TEMPLATES DE EMAIL ====================

// 1. Boas-vindas ao cadastro
export async function sendWelcomeEmail(to: string, name: string) {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF;">
      Bem-vindo ao Passback, ${name}!
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Sua conta foi criada com sucesso. Agora voce pode comprar e vender ingressos com total seguranca.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      No Passback, o pagamento fica retido ate que o comprador confirme a entrada no evento, protegendo ambas as partes.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Acessar Minha Conta", APP_URL)}
    </div>
  `);

  return sendEmail({
    to,
    subject: "Bem-vindo ao Passback!",
    html,
  });
}

// 2. Compra iniciada (aguardando pagamento)
export async function sendPurchaseInitiatedEmail(
  to: string,
  buyerName: string,
  eventName: string,
  ticketType: string,
  price: number,
  transactionId: string
) {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF;">
      Compra Iniciada
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${buyerName}, voce iniciou a compra de um ingresso:
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <p style="margin: 0 0 10px; font-size: 14px; color: #8B9DB5;">
        Tipo: ${ticketType}
      </p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16C784;">
        ${formatPrice(price)}
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 16px; color: #FF8A00; line-height: 1.6;">
      <strong>Importante:</strong> Complete o pagamento em ate 15 minutos para garantir seu ingresso.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Pagar Agora", `${APP_URL}/compra/${transactionId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Pagamento pendente - ${eventName}`,
    html,
  });
}

// 3. Pagamento confirmado (comprador)
export async function sendPaymentConfirmedBuyerEmail(
  to: string,
  buyerName: string,
  eventName: string,
  ticketType: string,
  eventDate: string,
  eventLocation: string,
  price: number,
  sellerName: string,
  sellerPhone: string | null,
  transactionId: string
) {
  const contactSection = sellerPhone
    ? `
    <div style="background-color: #16C784; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #0B1F33; font-weight: 600;">
        Contato do Vendedor
      </p>
      <p style="margin: 0 0 5px; font-size: 16px; color: #0B1F33;">
        ${sellerName}
      </p>
      <p style="margin: 0; font-size: 14px; color: #0B1F33;">
        WhatsApp: ${sellerPhone}
      </p>
    </div>
    `
    : "";

  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px;">✓</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Pagamento Confirmado!
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${buyerName}, seu pagamento foi confirmado com sucesso!
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #8B9DB5;">
        ${ticketType}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #8B9DB5;">
        ${eventDate}
      </p>
      <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5;">
        ${eventLocation}
      </p>
      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #16C784;">
        ${formatPrice(price)}
      </p>
    </div>
    ${contactSection}
    <p style="margin: 20px 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      <strong>Proximo passo:</strong> Entre em contato com o vendedor para combinar a entrega do ingresso.
    </p>
    <p style="margin: 0 0 15px; font-size: 14px; color: #FF8A00; line-height: 1.6;">
      Apos entrar no evento, confirme o recebimento no app para liberar o pagamento ao vendedor.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Detalhes da Compra", `${APP_URL}/compra/${transactionId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Pagamento confirmado - ${eventName}`,
    html,
  });
}

// 4. Nova venda (vendedor)
export async function sendNewSaleEmail(
  to: string,
  sellerName: string,
  eventName: string,
  ticketType: string,
  price: number,
  sellerAmount: number,
  buyerName: string,
  buyerPhone: string | null,
  transactionId: string
) {
  const contactSection = buyerPhone
    ? `
    <div style="background-color: #16C784; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #0B1F33; font-weight: 600;">
        Contato do Comprador
      </p>
      <p style="margin: 0 0 5px; font-size: 16px; color: #0B1F33;">
        ${buyerName}
      </p>
      <p style="margin: 0; font-size: 14px; color: #0B1F33;">
        WhatsApp: ${buyerPhone}
      </p>
    </div>
    `
    : "";

  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px;">$</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Voce vendeu um ingresso!
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Parabens ${sellerName}! Seu ingresso foi vendido.
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5;">
        ${ticketType}
      </p>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #2A4A6C; padding-top: 15px;">
        <div>
          <p style="margin: 0 0 5px; font-size: 12px; color: #8B9DB5;">Valor da venda</p>
          <p style="margin: 0; font-size: 18px; color: #FFFFFF;">${formatPrice(price)}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0 0 5px; font-size: 12px; color: #8B9DB5;">Voce recebera</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #16C784;">${formatPrice(sellerAmount)}</p>
        </div>
      </div>
    </div>
    ${contactSection}
    <p style="margin: 20px 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      <strong>Proximo passo:</strong> Entre em contato com o comprador para combinar a entrega do ingresso.
    </p>
    <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5; line-height: 1.6;">
      O pagamento sera liberado apos o comprador confirmar que entrou no evento (ou automaticamente em 24h apos o evento).
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Detalhes da Venda", `${APP_URL}/compra/${transactionId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Voce vendeu um ingresso - ${eventName}`,
    html,
  });
}

// 5. Pagamento liberado (vendedor)
export async function sendPaymentReleasedEmail(
  to: string,
  sellerName: string,
  eventName: string,
  sellerAmount: number,
  transactionId: string
) {
  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px;">✓</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Pagamento Liberado!
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${sellerName}, o comprador confirmou o recebimento do ingresso e seu pagamento foi liberado!
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #8B9DB5;">
        ${eventName}
      </p>
      <p style="margin: 0; font-size: 32px; font-weight: bold; color: #16C784;">
        ${formatPrice(sellerAmount)}
      </p>
      <p style="margin: 10px 0 0; font-size: 14px; color: #8B9DB5;">
        disponivel para saque
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      O valor ja esta disponivel na sua carteira. Voce pode sacar a qualquer momento via PIX.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ir para Carteira", `${APP_URL}/carteira`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Pagamento liberado - ${formatPrice(sellerAmount)}`,
    html,
  });
}

// 6. Disputa aberta
export async function sendDisputeOpenedEmail(
  to: string,
  userName: string,
  eventName: string,
  reason: string,
  disputeId: string,
  isOpener: boolean
) {
  const title = isOpener ? "Disputa Registrada" : "Uma disputa foi aberta";
  const message = isOpener
    ? `Sua disputa foi registrada com sucesso. Nossa equipe ira analisar o caso e entrara em contato em ate 48 horas.`
    : `O comprador abriu uma disputa referente a transacao do ingresso abaixo. Nossa equipe ira analisar o caso.`;

  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background-color: #FF8A00; border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px;">!</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      ${title}
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${userName}, ${message}
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <p style="margin: 0; font-size: 14px; color: #FF8A00;">
        Motivo: ${reason}
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5; line-height: 1.6;">
      Voce pode enviar evidencias e mensagens pelo painel de disputa para ajudar na analise.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Disputa", `${APP_URL}/disputa/${disputeId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Disputa ${isOpener ? "registrada" : "aberta"} - ${eventName}`,
    html,
  });
}

// 7. Disputa resolvida
export async function sendDisputeResolvedEmail(
  to: string,
  userName: string,
  eventName: string,
  resolution: "buyer" | "seller",
  isWinner: boolean,
  amount: number,
  disputeId: string
) {
  const resultColor = isWinner ? "#16C784" : "#FF6B6B";
  const resultText = isWinner ? "a seu favor" : "para a outra parte";
  const resultIcon = isWinner ? "✓" : "✗";

  const actionText = isWinner
    ? resolution === "buyer"
      ? "O valor sera estornado para sua conta."
      : `O valor de ${formatPrice(amount)} foi liberado para sua carteira.`
    : "Se tiver duvidas sobre a decisao, entre em contato com nosso suporte.";

  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background-color: ${resultColor}; border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px; color: white;">${resultIcon}</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Disputa Resolvida
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${userName}, a disputa referente ao ingresso abaixo foi analisada e resolvida <strong style="color: ${resultColor};">${resultText}</strong>.
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <p style="margin: 0; font-size: 14px; color: ${resultColor};">
        Decisao: ${resolution === "buyer" ? "Comprador" : "Vendedor"}
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      ${actionText}
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Detalhes", `${APP_URL}/disputa/${disputeId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Disputa resolvida - ${eventName}`,
    html,
  });
}

// 8. Saque solicitado
export async function sendWithdrawalRequestedEmail(
  to: string,
  userName: string,
  amount: number,
  pixKey: string
) {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF;">
      Saque Solicitado
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${userName}, seu saque foi solicitado com sucesso!
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px; font-size: 14px; color: #8B9DB5;">Valor do saque</p>
      <p style="margin: 0 0 15px; font-size: 28px; font-weight: bold; color: #16C784;">
        ${formatPrice(amount)}
      </p>
      <p style="margin: 0 0 5px; font-size: 12px; color: #8B9DB5;">Chave PIX</p>
      <p style="margin: 0; font-size: 14px; color: #FFFFFF;">${pixKey}</p>
    </div>
    <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5; line-height: 1.6;">
      O saque sera processado em ate 24 horas uteis. Voce recebera um email quando o valor for transferido.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Carteira", `${APP_URL}/carteira`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Saque solicitado - ${formatPrice(amount)}`,
    html,
  });
}

// 9. Saque processado
export async function sendWithdrawalCompletedEmail(
  to: string,
  userName: string,
  amount: number,
  pixKey: string
) {
  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px;">✓</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Saque Realizado!
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${userName}, seu saque foi processado com sucesso!
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px; font-size: 14px; color: #8B9DB5;">Valor transferido</p>
      <p style="margin: 0 0 15px; font-size: 28px; font-weight: bold; color: #16C784;">
        ${formatPrice(amount)}
      </p>
      <p style="margin: 0 0 5px; font-size: 12px; color: #8B9DB5;">Enviado para</p>
      <p style="margin: 0; font-size: 14px; color: #FFFFFF;">${pixKey}</p>
    </div>
    <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5; line-height: 1.6;">
      O valor deve aparecer na sua conta em instantes. Obrigado por usar o Passback!
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Historico", `${APP_URL}/carteira`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Saque realizado - ${formatPrice(amount)}`,
    html,
  });
}

// 10. Nova oferta recebida (vendedor)
export async function sendNewOfferEmail(
  to: string,
  sellerName: string,
  eventName: string,
  originalPrice: number,
  offerPrice: number,
  buyerName: string,
  ticketId: string
) {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF;">
      Nova Oferta Recebida
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${sellerName}, voce recebeu uma oferta para seu ingresso!
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <div style="border-top: 1px solid #2A4A6C; padding-top: 15px; margin-top: 15px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #8B9DB5;">
          Seu preco: <span style="color: #FFFFFF;">${formatPrice(originalPrice)}</span>
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #8B9DB5;">
          Oferta de ${buyerName}: <span style="color: #16C784; font-weight: bold; font-size: 18px;">${formatPrice(offerPrice)}</span>
        </p>
      </div>
    </div>
    <p style="margin: 0 0 15px; font-size: 14px; color: #FF8A00; line-height: 1.6;">
      A oferta expira em 24 horas. Acesse o app para aceitar ou recusar.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Oferta", `${APP_URL}/ingressos/${ticketId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Nova oferta de ${formatPrice(offerPrice)} - ${eventName}`,
    html,
  });
}

// 11. Oferta aceita (comprador)
export async function sendOfferAcceptedEmail(
  to: string,
  buyerName: string,
  eventName: string,
  offerPrice: number,
  transactionId: string
) {
  const html = baseTemplate(`
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #16C784 0%, #2DFF88 100%); border-radius: 50%; line-height: 60px;">
        <span style="font-size: 30px;">✓</span>
      </div>
    </div>
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Oferta Aceita!
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${buyerName}, o vendedor aceitou sua oferta!
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16C784;">
        ${formatPrice(offerPrice)}
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 16px; color: #FF8A00; line-height: 1.6;">
      <strong>Importante:</strong> Complete o pagamento em ate 5 minutos para garantir seu ingresso!
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Pagar Agora", `${APP_URL}/compra/${transactionId}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Oferta aceita - ${eventName}`,
    html,
  });
}

// 12. Codigo de verificacao de email
export async function sendEmailVerificationCode(
  to: string,
  userName: string,
  code: string
) {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF; text-align: center;">
      Verificacao de Email
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6; text-align: center;">
      Ola ${userName}, use o codigo abaixo para verificar seu email:
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 36px; font-weight: bold; color: #16C784; letter-spacing: 8px; font-family: monospace;">
        ${code}
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 14px; color: #8B9DB5; line-height: 1.6; text-align: center;">
      Este codigo expira em 10 minutos.<br>
      Se voce nao solicitou esta verificacao, ignore este email.
    </p>
  `);

  return sendEmail({
    to,
    subject: `Codigo de verificacao: ${code}`,
    html,
  });
}

// 13. Oferta recusada (comprador)
export async function sendOfferRejectedEmail(
  to: string,
  buyerName: string,
  eventName: string,
  offerPrice: number,
  ticketId: string
) {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 20px; font-size: 24px; color: #FFFFFF;">
      Oferta Recusada
    </h2>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Ola ${buyerName}, infelizmente o vendedor recusou sua oferta de ${formatPrice(offerPrice)} para o ingresso abaixo.
    </p>
    <div style="background-color: #1A3A5C; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #FFFFFF;">
        ${eventName}
      </p>
    </div>
    <p style="margin: 0 0 15px; font-size: 16px; color: #B8C5D3; line-height: 1.6;">
      Voce ainda pode comprar o ingresso pelo preco original ou buscar outros ingressos disponiveis.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      ${buttonHtml("Ver Outros Ingressos", `${APP_URL}`)}
    </div>
  `);

  return sendEmail({
    to,
    subject: `Oferta recusada - ${eventName}`,
    html,
  });
}
