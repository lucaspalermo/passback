# Módulo de Verificação de Identidade

Sistema de verificação de identidade com selfie e documento para aumentar a segurança da plataforma.

## Ativação

### 1. Adicione no `.env`:

```bash
FEATURE_IDENTITY_ENABLED=true
IDENTITY_REQUIRE_FOR_SELLING=true
IDENTITY_REQUIRE_ABOVE=500
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
  VerificationStatusCard,
  VerificationForm,
  VerificationBadge,
} from "@/modules/identity";

// Status de verificação no perfil
function ProfilePage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {showForm ? (
        <VerificationForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <VerificationStatusCard onStartVerification={() => setShowForm(true)} />
      )}
    </div>
  );
}

// Badge de verificado
function UserCard({ user }) {
  return (
    <div className="flex items-center gap-2">
      <span>{user.name}</span>
      <VerificationBadge size="sm" />
    </div>
  );
}
```

### Hook (Frontend)

```tsx
import { useIdentity } from "@/modules/identity";

function Component() {
  const { status, loading, submitVerification } = useIdentity();

  if (loading) return <Loading />;

  if (!status?.isVerified) {
    return <VerificationRequired />;
  }

  return <VerifiedContent />;
}
```

### Serviços (Backend)

```typescript
import {
  canUserSell,
  canUserBuy,
  getUserVerificationStatus,
} from "@/modules/identity";

// Em uma API de criação de ingresso
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Verifica se pode vender
  const canSell = await canUserSell(session.user.id);
  if (!canSell) {
    return NextResponse.json(
      { error: "Você precisa verificar sua identidade para vender" },
      { status: 403 }
    );
  }

  // ... resto da lógica
}

// Em uma API de compra
export async function POST(request: NextRequest) {
  const { amount } = await request.json();

  // Verifica se pode comprar (baseado no valor)
  const canBuy = await canUserBuy(session.user.id, amount);
  if (!canBuy) {
    return NextResponse.json(
      { error: "Verificação necessária para compras acima de R$ 500" },
      { status: 403 }
    );
  }

  // ... resto da lógica
}
```

## API Endpoints

| Método | Endpoint                    | Descrição                   |
| ------ | --------------------------- | --------------------------- |
| GET    | /api/modules/identity       | Status de verificação       |
| POST   | /api/modules/identity       | Submeter documentos         |
| GET    | /api/modules/identity/admin | Listar pendentes (admin)    |
| POST   | /api/modules/identity/admin | Aprovar/Rejeitar (admin)    |

## Fluxo de Verificação

1. Usuário seleciona tipo de documento (RG, CNH, Passaporte)
2. Usuário envia foto da frente do documento
3. Usuário envia foto do verso (se RG)
4. Usuário envia selfie segurando o documento
5. Documentos ficam com status "pending"
6. Admin analisa e aprova/rejeita
7. Usuário é notificado do resultado

## Configurações

| Variável                    | Descrição                              |
| --------------------------- | -------------------------------------- |
| FEATURE_IDENTITY_ENABLED    | Ativa/desativa o módulo                |
| IDENTITY_REQUIRE_FOR_SELLING| Exige verificação para criar ingressos |
| IDENTITY_REQUIRE_ABOVE      | Exige para compras acima de X reais    |
| IDENTITY_AUTO_VERIFY        | Verificação automática via API         |
| IDENTITY_PROVIDER           | Provider de verificação (futuro)       |

## Estrutura

```
src/modules/identity/
├── index.ts              # Exportações públicas
├── config.ts             # Feature flag e configurações
├── types.ts              # Tipos TypeScript
├── schema.prisma.txt     # Schema para adicionar ao Prisma
├── README.md             # Documentação
├── api/
│   ├── route.ts          # API do usuário
│   └── admin/route.ts    # API do admin
├── components/
│   ├── VerificationStatus.tsx
│   ├── VerificationForm.tsx
│   ├── VerificationBadge.tsx
│   └── index.ts
├── hooks/
│   └── useIdentity.ts
└── services/
    ├── identity.service.ts
    └── index.ts
```

## Desativação

```bash
FEATURE_IDENTITY_ENABLED=false
```

Quando desabilitado, todos os usuários são considerados verificados.
