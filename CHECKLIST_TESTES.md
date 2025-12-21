# Checklist de Testes - Passback

## Como Testar

Para cada item, marque:
- [ ] Nao testado
- [x] Funcionando
- [!] Com erro (descrever)

---

## 1. Autenticacao

### 1.1 Cadastro de Usuario
- [ ] Acessar /register
- [ ] Preencher nome, email, senha
- [ ] Clicar em cadastrar
- [ ] Verificar se redireciona para login
- [ ] Verificar se usuario foi criado no banco

### 1.2 Login
- [ ] Acessar /login
- [ ] Fazer login com comprador@teste.com / 123456
- [ ] Verificar se redireciona para home
- [ ] Verificar se nome aparece no navbar

### 1.3 Logout
- [ ] Clicar no botao de logout
- [ ] Verificar se redireciona para /login
- [ ] Verificar se sessao foi encerrada

### 1.4 Login Admin
- [ ] Fazer login com admin@passback.com / 123456
- [ ] Verificar se botao "Admin" aparece no navbar
- [ ] Acessar /admin

---

## 2. Ingressos

### 2.1 Listar Ingressos (Home)
- [ ] Acessar /
- [ ] Verificar se ingressos aparecem
- [ ] Verificar se cards mostram: nome, data, local, preco

### 2.2 Criar Ingresso (Vendedor)
- [ ] Fazer login como vendedor
- [ ] Acessar /vender ou clicar em "Vender Ingresso"
- [ ] Preencher: nome do evento, data, local, tipo, preco
- [ ] Fazer upload de imagem (opcional)
- [ ] Clicar em publicar
- [ ] Verificar se ingresso aparece na home

### 2.3 Ver Detalhes do Ingresso
- [ ] Clicar em um ingresso na home
- [ ] Verificar se abre /ingressos/[id]
- [ ] Verificar se mostra: nome, data, local, preco, vendedor
- [ ] Verificar se botao "Comprar" aparece

### 2.4 Minhas Vendas
- [ ] Acessar /minhas-vendas
- [ ] Verificar se lista ingressos do vendedor logado

---

## 3. Compra (Fluxo Principal)

### 3.1 Iniciar Compra
- [ ] Fazer login como comprador
- [ ] Acessar um ingresso disponivel
- [ ] Clicar em "Comprar"
- [ ] Verificar se abre checkout do Mercado Pago

### 3.2 Pagamento (Mercado Pago)
- [ ] Checkout do MP abre corretamente
- [ ] Opcoes de pagamento aparecem (cartao, PIX, boleto)
- [ ] Botao de pagar esta ativo (nao cinza)
- [ ] Pagamento e processado

### 3.3 Apos Pagamento
- [ ] Redireciona para /compra/[transactionId]
- [ ] Status mostra "Pago"
- [ ] WhatsApp do vendedor aparece
- [ ] Botao de confirmar recebimento aparece

### 3.4 Minhas Compras
- [ ] Acessar /minhas-compras
- [ ] Verificar se lista compras do usuario

---

## 4. Confirmacao e Liberacao

### 4.1 Confirmar Recebimento
- [ ] Acessar compra com status "Pago"
- [ ] Clicar em "Confirmar Recebimento"
- [ ] Status muda para "Confirmado" ou "Liberado"

### 4.2 Liberacao Automatica
- [ ] Apos 48h do evento, status muda para "Liberado"

---

## 5. Disputas

### 5.1 Abrir Disputa
- [ ] Acessar compra com status "Pago"
- [ ] Clicar em "Abrir Disputa"
- [ ] Preencher motivo
- [ ] Verificar se disputa foi criada

### 5.2 Enviar Evidencia
- [ ] Acessar disputa aberta
- [ ] Fazer upload de evidencia (print, foto)
- [ ] Verificar se evidencia aparece

### 5.3 Admin Resolver Disputa
- [ ] Login como admin
- [ ] Acessar /admin/disputas
- [ ] Ver disputa aberta
- [ ] Resolver a favor do comprador ou vendedor

---

## 6. Painel Admin

### 6.1 Dashboard
- [ ] Acessar /admin
- [ ] Verificar estatisticas: usuarios, ingressos, transacoes

### 6.2 Gerenciar Usuarios
- [ ] Acessar /admin/usuarios
- [ ] Listar usuarios
- [ ] Ver detalhes de usuario

### 6.3 Gerenciar Ingressos
- [ ] Acessar /admin/ingressos
- [ ] Listar todos os ingressos
- [ ] Filtrar por status

### 6.4 Gerenciar Disputas
- [ ] Acessar /admin/disputas
- [ ] Listar disputas
- [ ] Resolver disputa

---

## 7. Outros

### 7.1 Responsividade
- [ ] Site funciona no celular
- [ ] Menus funcionam no mobile

### 7.2 Performance
- [ ] Paginas carregam rapido
- [ ] Sem erros no console do navegador

---

## Erros Encontrados

| Funcionalidade | Erro | Status |
|----------------|------|--------|
| Exemplo | Descricao do erro | Pendente/Resolvido |

---

## Observacoes

(Adicione aqui qualquer observacao importante)
