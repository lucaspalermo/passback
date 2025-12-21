# Deploy VPS - Passback

## Informacoes do Servidor

- **VPS**: Hostinger
- **Dominio**: https://passback.com.br
- **Caminho**: /var/www/passback
- **Processo**: PM2 (passback)
- **Banco**: Neon PostgreSQL (Sao Paulo)

## Credenciais de Teste

| Usuario | Email | Senha |
|---------|-------|-------|
| Comprador | comprador@teste.com | 123456 |
| Vendedor | vendedor@teste.com | 123456 |
| Admin | admin@passback.com | 123456 |

---

## Comandos de Deploy

### Deploy Completo (comando unico)

```bash
curl -sL https://raw.githubusercontent.com/lucaspalermo/passback/master/deploy.sh | bash
```

### Deploy Manual (passo a passo)

```bash
# 1. Acessar pasta do projeto
cd /var/www/passback

# 2. Configurar git como seguro
git config --global --add safe.directory /var/www/passback

# 3. Baixar alteracoes
git fetch origin master
git reset --hard origin/master

# 4. Instalar dependencias
npm install

# 5. Gerar cliente Prisma
npx prisma generate

# 6. Sincronizar banco
npx prisma db push

# 7. Build da aplicacao
npm run build

# 8. Reiniciar servidor
pm2 restart passback
```

### Atualizar arquivo especifico

```bash
curl -o CAMINHO/ARQUIVO https://raw.githubusercontent.com/lucaspalermo/passback/master/CAMINHO/ARQUIVO
npm run build
pm2 restart passback
```

---

## Comandos Uteis

### Logs

```bash
# Ver todos os logs
pm2 logs passback

# Ver apenas erros
pm2 logs passback --err --lines 50

# Ver logs em tempo real
pm2 logs passback --follow
```

### PM2

```bash
# Status do processo
pm2 status

# Reiniciar
pm2 restart passback

# Parar
pm2 stop passback

# Iniciar
pm2 start ecosystem.config.js
```

### Banco de Dados

```bash
# Abrir Prisma Studio (interface visual)
npx prisma studio

# Sincronizar schema
npx prisma db push

# Resetar banco (CUIDADO - apaga tudo)
npx prisma db push --force-reset
```

---

## Variaveis de Ambiente (.env)

```env
# Neon Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="https://passback.com.br"

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-..."

# App
NEXT_PUBLIC_APP_URL="https://passback.com.br"
```

---

## Resolucao de Problemas

### Erro: "dubious ownership in repository"

```bash
git config --global --add safe.directory /var/www/passback
```

### Erro: "Unique constraint failed on ticketId"

Significa que ja existe uma transacao para o ingresso. Opcoes:
1. Deletar transacao antiga no banco
2. Usar ingresso diferente para teste

```bash
# Via Prisma Studio
npx prisma studio
# Deletar transacao na tabela Transaction
```

### Codigo nao atualiza apos git pull

```bash
# Forcar download do arquivo especifico
curl -o src/app/api/transactions/route.ts https://raw.githubusercontent.com/lucaspalermo/passback/master/src/app/api/transactions/route.ts
npm run build
pm2 restart passback
```

### Erro 500 no site

```bash
pm2 logs passback --err --lines 30
```

---

## Estrutura de Arquivos Importantes

```
/var/www/passback/
├── .env                    # Variaveis de ambiente
├── ecosystem.config.js     # Configuracao PM2
├── prisma/
│   └── schema.prisma       # Schema do banco
├── src/
│   ├── app/
│   │   ├── api/            # Rotas da API
│   │   ├── admin/          # Painel admin
│   │   ├── ingressos/      # Pagina do ingresso
│   │   └── compra/         # Pagina de compra
│   ├── components/         # Componentes React
│   └── lib/
│       ├── auth.ts         # Configuracao NextAuth
│       ├── prisma.ts       # Cliente Prisma
│       └── mercadopago.ts  # Integracao MP
└── .next/                  # Build (gerado)
```
