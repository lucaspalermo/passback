# 📘 GUIA DO PROJETO PASSBACK

## 📁 Localização do Projeto
```
C:\Users\LEANDRO GAMER\Downloads\Nova pasta\passback
```

---

## 🚀 COMO INICIAR O PROJETO

### Passo 1: Abrir o Terminal
- Pressione `Win + R`, digite `cmd` e pressione Enter
- OU abra o PowerShell

### Passo 2: Navegar até a pasta do projeto
```bash
cd "C:\Users\LEANDRO GAMER\Downloads\Nova pasta\passback"
```

### Passo 3: Instalar dependências (apenas na primeira vez ou após atualizar)
```bash
npm install
```

### Passo 4: Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

### Passo 5: Acessar o site
Abra o navegador em: **http://localhost:3000**

---

## 🔐 CREDENCIAIS DE ACESSO

| Usuário | Email | Senha |
|---------|-------|-------|
| **Comprador** | comprador@teste.com | 123456 |
| **Vendedor** | vendedor@teste.com | 123456 |
| **Admin** | admin@passback.com | 123456 |

---

## 📂 ESTRUTURA DO PROJETO

```
passback/
├── prisma/              # Banco de dados (schema e migrations)
│   ├── schema.prisma    # Definição das tabelas
│   └── dev.db           # Banco SQLite (dados)
├── public/              # Arquivos públicos (imagens, uploads)
│   └── uploads/         # Imagens de flyers/evidências
├── src/
│   ├── app/             # Páginas do site
│   │   ├── page.tsx                 # Home
│   │   ├── (auth)/                  # Login e Cadastro
│   │   ├── admin/                   # Painel Admin
│   │   ├── ingressos/               # Criar e ver ingressos
│   │   ├── compra/                  # Página de compra
│   │   ├── disputa/                 # Página de disputa
│   │   ├── meus-ingressos/          # Ingressos à venda
│   │   ├── minhas-compras/          # Compras realizadas
│   │   ├── minhas-vendas/           # Vendas realizadas
│   │   ├── perfil/                  # Perfil do usuário
│   │   └── api/                     # APIs do backend
│   ├── components/      # Componentes reutilizáveis
│   └── lib/             # Configurações e utilitários
├── package.json         # Dependências do projeto
└── .env                 # Variáveis de ambiente
```

---

## 🛠️ COMANDOS ÚTEIS

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```

### Parar o servidor
Pressione `Ctrl + C` no terminal

### Resetar banco de dados (limpar tudo e recriar)
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Ver dados do banco no navegador
```bash
npx prisma studio
```
Abre em: http://localhost:5555

### Criar build de produção
```bash
npm run build
```

---

## ✏️ COMO EDITAR O CÓDIGO

### Recomendação: Use o VS Code
1. Baixe em: https://code.visualstudio.com/
2. Abra a pasta do projeto: File > Open Folder
3. Extensões recomendadas:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - Prisma

### Arquivos importantes para editar:

| O que mudar | Arquivo |
|-------------|---------|
| Home/Landing page | `src/app/page.tsx` |
| Navbar | `src/components/Navbar.tsx` |
| Cores e estilos | `src/app/globals.css` |
| Banco de dados | `prisma/schema.prisma` |
| Configurações WhatsApp | `src/lib/config.ts` |

---

## 🎨 CORES DO PROJETO

| Elemento | Cor Hex | Uso |
|----------|---------|-----|
| Fundo | `#0B1F33` | Background principal |
| Cards | `#0F2A44` | Cards e modais |
| Inputs | `#1A3A5C` | Campos de formulário |
| Verde CTA | `#16C784` | Botões principais |
| Verde Accent | `#2DFF88` | Destaques |
| Laranja | `#FF8A00` | Alertas e urgência |

---

## 🔄 COMO SALVAR ALTERAÇÕES COM GIT

### Ver o que foi modificado
```bash
git status
```

### Salvar todas as alterações
```bash
git add .
git commit -m "Descrição do que você mudou"
```

### Ver histórico de alterações
```bash
git log --oneline
```

### Voltar para uma versão anterior (CUIDADO!)
```bash
git checkout [código-do-commit]
```

---

## 🌐 COMO COLOCAR ONLINE (DEPLOY)

### Opção 1: Vercel (Gratuito e Fácil)
1. Crie conta em https://vercel.com
2. Conecte com GitHub
3. Importe o projeto
4. Configure variáveis de ambiente
5. Deploy automático!

### Opção 2: Railway (Banco PostgreSQL)
1. Crie conta em https://railway.app
2. Crie um banco PostgreSQL
3. Configure DATABASE_URL
4. Deploy via GitHub

### Variáveis de ambiente necessárias:
```env
DATABASE_URL=...
NEXTAUTH_SECRET=sua-chave-secreta
NEXTAUTH_URL=https://seu-dominio.com
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
```

---

## ❓ PROBLEMAS COMUNS

### "Port 3000 is already in use"
```bash
# Windows - Matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID [NUMERO] /F
```

### "Prisma client not found"
```bash
npx prisma generate
```

### "Database error"
```bash
npx prisma db push
```

### Página não atualiza
- Pressione `Ctrl + Shift + R` para limpar cache
- Ou reinicie o servidor com `npm run dev`

---

## 📞 SUPORTE

Se precisar de ajuda:
1. Abra o Claude Code novamente
2. Navegue até a pasta do projeto
3. Descreva o problema

---

*Projeto Passback - Plataforma de Revenda de Ingressos com Escrow*
*Versão 1.0 - Dezembro 2024*
