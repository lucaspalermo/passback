// Template base para emails
// Layout consistente com a identidade visual do Passback

export function baseEmailTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passback</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#0B1F33;max-height:0;overflow:hidden;">${preheader}</span>` : ""}
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0B1F33;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #0F2A44;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      font-size: 28px;
      font-weight: 700;
      color: #16C784;
      margin: 0;
    }
    .content {
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #16C784;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      margin: 24px 0;
    }
    .button:hover {
      background-color: #14b576;
    }
    .highlight {
      background-color: #1A3A5C;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .highlight-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .highlight-row:last-child {
      border-bottom: none;
    }
    .highlight-label {
      color: #9CA3AF;
      font-size: 14px;
    }
    .highlight-value {
      color: #ffffff;
      font-weight: 500;
    }
    .amount {
      color: #16C784;
      font-size: 24px;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      color: #6B7280;
      font-size: 12px;
      margin-top: 32px;
    }
    .footer a {
      color: #16C784;
      text-decoration: none;
    }
    .warning {
      background-color: rgba(255, 138, 0, 0.1);
      border: 1px solid rgba(255, 138, 0, 0.2);
      border-radius: 12px;
      padding: 16px;
      color: #FF8A00;
      font-size: 14px;
      margin: 20px 0;
    }
    .success {
      background-color: rgba(22, 199, 132, 0.1);
      border: 1px solid rgba(22, 199, 132, 0.2);
      border-radius: 12px;
      padding: 16px;
      color: #16C784;
      font-size: 14px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>Passback</h1>
    </div>
    <div class="card">
      <div class="content">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>Este email foi enviado por Passback - Revenda segura de ingressos</p>
      <p>
        <a href="\${process.env.NEXT_PUBLIC_APP_URL}">Acessar plataforma</a> |
        <a href="\${process.env.NEXT_PUBLIC_APP_URL}/ajuda">Central de ajuda</a>
      </p>
      <p style="margin-top: 16px;">
        Voce recebeu este email porque tem uma conta no Passback.<br>
        Se nao reconhece esta atividade, entre em contato conosco.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
