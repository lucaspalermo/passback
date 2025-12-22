# Módulo de Chat

Sistema de chat em tempo real entre comprador e vendedor, vinculado a transações.

## Ativação

### 1. Adicione no `.env`:

```bash
FEATURE_CHAT_ENABLED=true
CHAT_EMAIL_NOTIFICATIONS=false
```

### 2. Adicione ao schema Prisma:

Copie o conteúdo de `schema.prisma.txt` para seu `prisma/schema.prisma` e execute:

```bash
npx prisma db push
npx prisma generate
```

## Uso

### Componentes (Frontend)

```tsx
import {
  ChatWindow,
  ConversationList,
  ChatBadge,
} from "@/modules/chat";

// Lista de conversas
function MyConversations() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="flex">
      <div className="w-1/3">
        <ConversationList
          onSelect={setSelectedConversation}
          selectedId={selectedConversation?.id}
        />
      </div>
      <div className="w-2/3">
        {selectedConversation && (
          <ChatWindow
            conversationId={selectedConversation.id}
            currentUserId={currentUser.id}
            otherParticipant={selectedConversation.otherParticipant}
            ticketName={selectedConversation.ticketName}
            eventName={selectedConversation.eventName}
          />
        )}
      </div>
    </div>
  );
}

// Badge no menu
function Navbar() {
  return (
    <Link href="/mensagens" className="relative">
      <MessageIcon />
      <ChatBadge className="absolute -top-1 -right-1" />
    </Link>
  );
}
```

### Hook (Frontend)

```tsx
import { useChat } from "@/modules/chat";

function ChatComponent({ conversationId }) {
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
  } = useChat({ conversationId, pollingInterval: 3000 });

  const handleSend = async (content) => {
    await sendMessage(content);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Serviços (Backend)

```typescript
import {
  getOrCreateConversation,
  sendMessage,
  listConversations,
} from "@/modules/chat";

// Criar/obter conversa para uma transação
const conversation = await getOrCreateConversation({
  transactionId: "tx-123",
  buyerId: "user-1",
  sellerId: "user-2",
});

// Enviar mensagem
const result = await sendMessage({
  conversationId: conversation.id,
  senderId: "user-1",
  content: "Olá, ainda tem o ingresso?",
});

// Listar conversas do usuário
const conversations = await listConversations("user-1");
```

## API Endpoints

| Método | Endpoint                         | Descrição              |
| ------ | -------------------------------- | ---------------------- |
| GET    | /api/modules/chat/conversations  | Lista conversas        |
| POST   | /api/modules/chat/conversations  | Cria conversa          |
| GET    | /api/modules/chat/messages       | Lista mensagens        |
| POST   | /api/modules/chat/messages       | Envia mensagem         |
| GET    | /api/modules/chat/unread         | Conta não lidas        |

## Segurança Anti-Fraude

O módulo bloqueia automaticamente mensagens contendo:
- Números de telefone
- Menções a WhatsApp/Telegram
- Tentativas de pagamento fora da plataforma

## Estrutura

```
src/modules/chat/
├── index.ts              # Exportações públicas
├── config.ts             # Feature flag e configurações
├── types.ts              # Tipos TypeScript
├── schema.prisma.txt     # Schema para adicionar ao Prisma
├── README.md             # Documentação
├── api/
│   ├── conversations/route.ts
│   ├── messages/route.ts
│   └── unread/route.ts
├── components/
│   ├── ChatWindow.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── ConversationList.tsx
│   ├── ChatBadge.tsx
│   └── index.ts
├── hooks/
│   └── useChat.ts
└── services/
    ├── chat.service.ts
    └── index.ts
```

## Desativação

```bash
FEATURE_CHAT_ENABLED=false
```

O módulo retorna arrays vazios e componentes não renderizam.
