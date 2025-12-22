# Módulos do Passback

Sistema modular para extensão de funcionalidades do Passback. Todos os módulos são isolados, desacopláveis e controlados por feature flags.

## Módulos Disponíveis

### Alta Prioridade

| Módulo | Diretório | Feature Flag | Descrição |
|--------|-----------|--------------|-----------|
| **Notificações** | `/notifications` | `FEATURE_NOTIFICATIONS_ENABLED` | Emails automáticos (Resend/SendGrid) |
| **Chat** | `/chat` | `FEATURE_CHAT_ENABLED` | Mensagens entre comprador e vendedor |
| **Verificação** | `/identity` | `FEATURE_IDENTITY_ENABLED` | Selfie com documento |

### Média Prioridade

| Módulo | Diretório | Feature Flag | Descrição |
|--------|-----------|--------------|-----------|
| **Avaliações** | `/reviews` | `FEATURE_REVIEWS_ENABLED` | Reviews pós-transação |
| **Cupons** | `/coupons` | `FEATURE_COUPONS_ENABLED` | Descontos promocionais |
| **Favoritos** | `/favorites` | `FEATURE_FAVORITES_ENABLED` | Salvar ingressos e alertas |

### Diferencial Competitivo

| Módulo | Diretório | Feature Flag | Descrição |
|--------|-----------|--------------|-----------|
| **QR de Entrada** | `/entry-qr` | `FEATURE_ENTRY_QR_ENABLED` | QR Code para validar no evento |
| **Transferência** | `/transfer` | `FEATURE_TRANSFER_ENABLED` | Transferir ingresso comprado |

## Arquitetura

Cada módulo segue a estrutura:

```
src/modules/[nome]/
├── index.ts              # Exportações públicas + config
├── types.ts              # Tipos TypeScript
├── config.ts             # Feature flags (opcional)
├── README.md             # Documentação
├── schema.prisma.txt     # Schema para adicionar
├── api/                  # API routes isoladas
│   └── route.ts
├── services/             # Lógica de negócio
│   └── [nome].service.ts
├── components/           # Componentes React
│   └── [Componente].tsx
└── hooks/                # React hooks
    └── use[Nome].ts
```

## Ativação de Módulo

### 1. Ativar Feature Flag

```bash
# .env
FEATURE_[NOME]_ENABLED=true
```

### 2. Adicionar Schema Prisma (se necessário)

Copie o conteúdo de `schema.prisma.txt` do módulo para `prisma/schema.prisma`.

```bash
npx prisma db push
npx prisma generate
```

### 3. Usar no Código

```typescript
// Backend
import { servicoDoModulo } from "@/modules/[nome]";

// Frontend
import { ComponenteDoModulo } from "@/modules/[nome]";
```

## Princípios

1. **Isolamento**: Módulos não modificam código existente
2. **Feature Flags**: Tudo controlado por variáveis de ambiente
3. **Desacoplamento**: Comunicação via eventos/API interna
4. **Reversibilidade**: Desativar = remover feature flag
5. **Tipagem**: TypeScript em todo o código

## Desativação

Para desativar qualquer módulo:

```bash
FEATURE_[NOME]_ENABLED=false
```

O código existente continua funcionando normalmente.

## Dependências entre Módulos

| Módulo | Depende de |
|--------|------------|
| Chat | Notificações (opcional, para alertas de nova mensagem) |
| Transfer | Notificações (opcional, para enviar convite) |
| Entry QR | - |

## API Routes

Todos os módulos expõem APIs em `/api/modules/[nome]/`:

```
/api/modules/notifications
/api/modules/chat/conversations
/api/modules/chat/messages
/api/modules/identity
/api/modules/identity/admin
/api/modules/reviews
/api/modules/coupons
/api/modules/favorites
/api/modules/entry-qr
/api/modules/transfer
```
