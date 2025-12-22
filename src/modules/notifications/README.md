# Módulo de Notificações

Sistema de notificações isolado para o Passback. Suporta email (Resend, SendGrid) com templates profissionais.

## Ativação

Adicione no `.env`:

```bash
# Ativar módulo
FEATURE_NOTIFICATIONS_ENABLED=true
NOTIFICATIONS_EMAIL_ENABLED=true
NOTIFICATIONS_EMAIL_PROVIDER=resend  # ou sendgrid, console

# Resend (recomendado)
RESEND_API_KEY=re_xxxxx

# Ou SendGrid
SENDGRID_API_KEY=SG.xxxxx

# Configurações de email
NOTIFICATIONS_EMAIL_FROM="Passback <noreply@passback.com.br>"
NOTIFICATIONS_EMAIL_REPLY_TO="suporte@passback.com.br"
```

## Uso

### Via Serviço (Backend)

```typescript
import {
  notifyPaymentConfirmed,
  notifyTicketSold,
  notifyWelcome,
} from "@/modules/notifications";

// Notificar pagamento confirmado
await notifyPaymentConfirmed(
  { id: "user-id", name: "João", email: "joao@email.com" },
  {
    transactionId: "tx-123",
    ticketName: "Pista",
    eventName: "Rock in Rio",
    amount: 250.0,
    paymentMethod: "pix",
  }
);

// Notificar venda
await notifyTicketSold(
  { id: "seller-id", name: "Maria", email: "maria@email.com" },
  {
    transactionId: "tx-123",
    ticketName: "Pista",
    eventName: "Rock in Rio",
    amount: 250.0,
    sellerAmount: 225.0,
    buyerName: "João",
  }
);
```

### Via Eventos (Desacoplado)

```typescript
import { emit, registerNotificationHandlers } from "@/modules/notifications/events";

// Registrar handlers (fazer uma vez na inicialização)
registerNotificationHandlers();

// Emitir evento de qualquer lugar
await emit("payment:confirmed", {
  buyer: { id: "user-id", name: "João", email: "joao@email.com" },
  data: {
    transactionId: "tx-123",
    ticketName: "Pista",
    eventName: "Rock in Rio",
    amount: 250.0,
    paymentMethod: "pix",
  },
});
```

### Via API (HTTP)

```bash
POST /api/modules/notifications
Content-Type: application/json

{
  "type": "payment_confirmed",
  "recipient": {
    "id": "user-id",
    "name": "João",
    "email": "joao@email.com"
  },
  "data": {
    "transactionId": "tx-123",
    "ticketName": "Pista",
    "eventName": "Rock in Rio",
    "amount": 250.0,
    "paymentMethod": "pix"
  }
}
```

### Via Hook (Frontend)

```tsx
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";

function Component() {
  const { send, loading, error } = useNotifications();

  const handleNotify = async () => {
    await send({
      type: "welcome",
      recipient: { id: "1", name: "João", email: "joao@email.com" },
    });
  };
}
```

## Tipos de Notificação

| Tipo               | Descrição                           |
| ------------------ | ----------------------------------- |
| payment_confirmed  | Pagamento confirmado (para buyer)   |
| ticket_sold        | Ingresso vendido (para seller)      |
| dispute_opened     | Disputa aberta (ambas as partes)    |
| dispute_resolved   | Disputa resolvida (ambas as partes) |
| welcome            | Boas-vindas (novo usuário)          |
| payment_released   | Pagamento liberado (para seller)    |

## Estrutura

```
src/modules/notifications/
├── index.ts              # Exportações públicas
├── config.ts             # Feature flag e configurações
├── types.ts              # Tipos TypeScript
├── README.md             # Documentação
├── api/
│   └── route.ts          # API route isolada
├── events/
│   └── index.ts          # Sistema de eventos pub/sub
├── hooks/
│   └── useNotifications.ts
├── services/
│   ├── email.service.ts  # Envio de emails
│   ├── notification.service.ts
│   └── index.ts
└── templates/
    ├── base.ts           # Template base HTML
    ├── payment-confirmed.ts
    ├── ticket-sold.ts
    ├── dispute-opened.ts
    ├── dispute-resolved.ts
    ├── welcome.ts
    └── index.ts
```

## Desativação

Para desativar completamente, remova ou defina como false:

```bash
FEATURE_NOTIFICATIONS_ENABLED=false
```

O código existente não será afetado - as funções retornam silenciosamente.
