# Manual Completo - Passback

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Autenticacao](#2-autenticacao)
3. [Ingressos](#3-ingressos)
4. [Compras](#4-compras)
5. [Disputas](#5-disputas)
6. [Painel Admin](#6-painel-admin)
7. [API Endpoints](#7-api-endpoints)
8. [Problemas Conhecidos](#8-problemas-conhecidos)
9. [Deploy e Manutencao](#9-deploy-e-manutencao)

---

## 1. Visao Geral

### O que e o Passback?

Passback e uma plataforma de revenda segura de ingressos. O sistema funciona com **escrow** (garantia), onde o pagamento fica retido ate o comprador confirmar que entrou no evento.

### Fluxo Principal

```
Vendedor cadastra ingresso
        ↓
Comprador visualiza e compra
        ↓
Pagamento via Mercado Pago (escrow)
        ↓
Vendedor envia ingresso via WhatsApp
        ↓
Comprador confirma recebimento
        ↓
Pagamento liberado ao vendedor
```

### Taxa da Plataforma

- **10%** sobre o valor do ingresso
- Cobrado do vendedor no momento da liberacao

---

## 2. Autenticacao

### 2.1 Cadastro de Usuario

**URL:** `/cadastro` ou `/register`

**Campos obrigatorios:**
- Nome (minimo 2 caracteres)
- Email (unico no sistema)
- Senha (minimo 6 caracteres)
- Telefone (opcional, usado para WhatsApp)

**Fluxo:**
1. Usuario preenche formulario
2. Sistema valida dados
3. Senha e criptografada com bcrypt
4. Usuario criado no banco
5. Redireciona para login

**Erros possiveis:**
- "Email ja cadastrado"
- "Nome deve ter pelo menos 2 caracteres"
- "Senha deve ter pelo menos 6 caracteres"

### 2.2 Login

**URL:** `/login`

**Campos:**
- Email
- Senha

**Fluxo:**
1. Usuario preenche email e senha
2. Sistema busca usuario pelo email
3. Compara senha com hash no banco
4. Cria sessao JWT (valida por 30 dias)
5. Redireciona para home ou admin (se for admin)

**Erros possiveis:**
- "Usuario nao encontrado"
- "Senha incorreta"

### 2.3 Logout

**Acao:** Clicar no botao de logout no navbar

**Fluxo:**
1. Sessao JWT e invalidada
2. Usuario redirecionado para `/login`

### 2.4 Usuarios de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Comprador | comprador@teste.com | 123456 |
| Vendedor | vendedor@teste.com | 123456 |
| Admin | admin@passback.com | 123456 |

---

## 3. Ingressos

### 3.1 Listar Ingressos (Home)

**URL:** `/`

**Exibe:**
- Cards de ingressos disponiveis
- Nome do evento, data, local, preco
- Badge de desconto (se aplicavel)
- Imagem/flyer do evento

**Ordenacao:** Por data de criacao (mais recentes primeiro)

### 3.2 Ver Detalhes do Ingresso

**URL:** `/ingressos/[id]`

**Exibe:**
- Informacoes completas do evento
- Preco e desconto
- Dados do vendedor
- Botao de compra (se disponivel)

**Status possiveis:**
- `available` - Disponivel para compra
- `reserved` - Reservado (compra em andamento)
- `sold` - Vendido
- `completed` - Transacao finalizada

### 3.3 Criar Ingresso (Vendedor)

**URL:** `/vender` ou `/ingressos/novo`

**Campos obrigatorios:**
- Nome do evento
- Data e hora do evento
- Local do evento
- Tipo do ingresso (ex: Pista, Camarote)
- Preco de venda

**Campos opcionais:**
- Preco original (para mostrar desconto)
- Descricao
- Imagem/flyer (upload)

**Validacoes:**
- Data do evento deve ser futura
- Preco deve ser positivo
- Imagem: max 10MB, formatos JPG/PNG/GIF/WEBP

### 3.4 Minhas Vendas

**URL:** `/minhas-vendas`

**Exibe:**
- Lista de ingressos cadastrados pelo usuario
- Status de cada ingresso
- Transacoes relacionadas

### 3.5 Editar/Excluir Ingresso

**Regras:**
- Apenas ingressos com status `available` podem ser editados/excluidos
- Ingressos com transacoes pendentes nao podem ser excluidos

---

## 4. Compras

### 4.1 Iniciar Compra

**Acao:** Clicar em "Comprar" na pagina do ingresso

**Fluxo:**
1. Sistema verifica se ingresso esta disponivel
2. Cria transacao com status `pending`
3. Reserva o ingresso (status `reserved`)
4. Gera link de pagamento no Mercado Pago
5. Redireciona para checkout do MP

**Tempo de expiracao:** 5 minutos para completar pagamento

### 4.2 Pagamento (Mercado Pago)

**Metodos aceitos:**
- Cartao de credito
- PIX
- Boleto bancario

**Apos pagamento aprovado:**
1. Webhook do MP notifica o sistema
2. Transacao muda para status `paid`
3. Ingresso muda para status `sold`
4. Comprador ve dados do vendedor (WhatsApp)

### 4.3 Contato com Vendedor

**Apos pagamento:**
- WhatsApp do vendedor fica visivel
- Botao para abrir conversa no WhatsApp
- Mensagem pre-formatada com dados da compra

### 4.4 Confirmar Recebimento

**URL:** `/compra/[transactionId]`

**Acao:** Clicar em "Confirmar Recebimento"

**Quando usar:** Apos entrar no evento com o ingresso

**Efeito:**
1. Transacao muda para status `released`
2. Pagamento e liberado ao vendedor
3. Ingresso muda para status `completed`

### 4.5 Minhas Compras

**URL:** `/minhas-compras`

**Exibe:**
- Lista de compras do usuario
- Status de cada transacao
- Acoes disponiveis (confirmar, disputar)

### 4.6 Status das Transacoes

| Status | Descricao | Acoes Disponiveis |
|--------|-----------|-------------------|
| `pending` | Aguardando pagamento | Pagar, Cancelar |
| `expired` | Tempo de pagamento expirou | Nenhuma |
| `paid` | Pago, aguardando entrega | Confirmar, Disputar |
| `confirmed` | Confirmado pelo comprador | Disputar |
| `released` | Pagamento liberado | Nenhuma |
| `disputed` | Em disputa | Aguardar resolucao |
| `refunded` | Reembolsado | Nenhuma |
| `cancelled` | Cancelado | Nenhuma |

---

## 5. Disputas

### 5.1 Abrir Disputa

**Quando:** Comprador nao recebeu ingresso ou ingresso era invalido

**Requisitos:**
- Transacao com status `paid` ou `confirmed`
- Dentro do prazo de 7 dias apos o evento

**Campos:**
- Motivo (obrigatorio)
- Descricao detalhada

**Efeito:**
- Transacao muda para status `disputed`
- Pagamento fica retido ate resolucao

### 5.2 Enviar Evidencias

**Tipos aceitos:**
- Screenshot
- Foto
- Documento

**Campos:**
- Tipo da evidencia
- Descricao
- Arquivo (upload)

### 5.3 Mensagens na Disputa

- Comprador e vendedor podem trocar mensagens
- Admin pode participar da conversa
- Historico fica salvo para analise

### 5.4 Resolucao (Admin)

**Decisoes possiveis:**
- **Favor do Comprador:** Reembolso total
- **Favor do Vendedor:** Pagamento liberado
- **Split:** Divisao do valor (manual)

**Efeitos no comprador/vendedor:**
- Atualiza score de reputacao
- Marca usuario como "suspeito" se perder 3+ disputas

---

## 6. Painel Admin

### 6.1 Dashboard

**URL:** `/admin`

**Estatisticas:**
- Total de usuarios
- Total de ingressos
- Total de transacoes
- Valor em disputas
- Transacoes finalizadas

### 6.2 Gerenciar Usuarios

**URL:** `/admin/usuarios`

**Exibe:**
- Lista de todos os usuarios
- Nome, email, telefone
- Status de verificacao
- Data de cadastro

**Acoes:**
- Ver detalhes
- Verificar/desverificar usuario

### 6.3 Gerenciar Ingressos

**URL:** `/admin/ingressos`

**Exibe:**
- Lista de todos os ingressos
- Filtros por status
- Dados do vendedor

**Acoes:**
- Ver detalhes
- Remover ingresso (se necessario)

### 6.4 Gerenciar Disputas

**URL:** `/admin/disputas`

**Exibe:**
- Lista de disputas abertas
- Detalhes da transacao
- Evidencias enviadas
- Mensagens

**Acoes:**
- Resolver disputa
- Enviar mensagem como admin

---

## 7. API Endpoints

### Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/register` | Cadastrar usuario |
| POST | `/api/auth/[...nextauth]` | Login (NextAuth) |
| GET | `/api/auth/session` | Obter sessao atual |

### Ingressos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/tickets` | Listar ingressos |
| POST | `/api/tickets` | Criar ingresso |
| GET | `/api/tickets/[id]` | Detalhes do ingresso |
| PUT | `/api/tickets/[id]` | Atualizar ingresso |
| DELETE | `/api/tickets/[id]` | Excluir ingresso |

### Transacoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/transactions` | Iniciar compra |
| POST | `/api/transactions/confirm` | Confirmar recebimento |
| POST | `/api/transactions/[id]/retry` | Gerar novo link de pagamento |
| POST | `/api/transactions/[id]/cancel` | Cancelar compra |

### Disputas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/disputes` | Listar disputas |
| POST | `/api/disputes` | Abrir disputa |
| POST | `/api/disputes/[id]/evidence` | Enviar evidencia |
| POST | `/api/disputes/[id]/message` | Enviar mensagem |
| POST | `/api/disputes/[id]/resolve` | Resolver disputa (admin) |

### Webhooks

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/webhooks/mercadopago` | Receber notificacoes de pagamento |

### Outros

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/upload` | Upload de arquivos |
| GET/PUT | `/api/profile` | Perfil do usuario |

---

## 8. Problemas Conhecidos

### 8.1 Corrigidos

| Problema | Causa | Solucao |
|----------|-------|---------|
| Erro "Unique constraint on ticketId" | Transacao existente nao tratada | Adicionado tratamento para todos os status |
| Dupla atualizacao no confirm | Duas chamadas separadas ao banco | Unificado em uma transacao atomica |

### 8.2 Pendentes

| Problema | Impacto | Prioridade |
|----------|---------|------------|
| Webhook sem autenticacao | Seguranca | Alta |
| Liberacao real no MP nao implementada | Vendedor nao recebe | Alta |
| Sem rate limiting | Abuso possivel | Media |
| Sem paginacao no admin | Performance | Media |
| Sem verificacao de email | Seguranca | Baixa |

### 8.3 Limitacoes do Mercado Pago

- Credenciais de producao precisam de conta verificada
- Botao de pagamento pode ficar desabilitado se conta nao estiver ativa
- Webhook precisa de URL publica (HTTPS)

---

## 9. Deploy e Manutencao

### 9.1 Deploy Automatico

```bash
curl -sL https://raw.githubusercontent.com/lucaspalermo/passback/master/deploy.sh | bash
```

### 9.2 Deploy Manual

```bash
cd /var/www/passback
git config --global --add safe.directory /var/www/passback
git fetch origin master
git reset --hard origin/master
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart passback
```

### 9.3 Atualizar Arquivo Especifico

```bash
curl -o CAMINHO/ARQUIVO https://raw.githubusercontent.com/lucaspalermo/passback/master/CAMINHO/ARQUIVO
npm run build
pm2 restart passback
```

### 9.4 Ver Logs

```bash
# Todos os logs
pm2 logs passback

# Apenas erros
pm2 logs passback --err --lines 50

# Tempo real
pm2 logs passback --follow
```

### 9.5 Limpar Transacoes Pendentes

```bash
cd /var/www/passback
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function limpar() {
  const deleted = await prisma.transaction.deleteMany({
    where: { status: { in: ['pending', 'expired'] } }
  });
  console.log('Transacoes deletadas:', deleted.count);
  const updated = await prisma.ticket.updateMany({
    where: { status: 'reserved' },
    data: { status: 'available' }
  });
  console.log('Ingressos liberados:', updated.count);
  await prisma.\$disconnect();
}
limpar();
"
```

### 9.6 Acessar Banco de Dados

```bash
cd /var/www/passback
npx prisma studio
```

Acesse no navegador: `http://IP_VPS:5555`

---

## Contato e Suporte

- **Repositorio:** https://github.com/lucaspalermo/passback
- **Dominio:** https://passback.com.br

---

*Documentacao gerada em 21/12/2024*
