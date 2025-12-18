const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPurchaseFlow() {
  console.log("\n========================================");
  console.log("   TESTE DO FLUXO DE COMPRA COMPLETO");
  console.log("========================================\n");

  try {
    // 1. Buscar usuarios de teste
    console.log("PASSO 1: Buscando usuarios de teste...");
    const buyer = await prisma.user.findUnique({
      where: { email: "comprador@teste.com" },
    });
    const seller = await prisma.user.findUnique({
      where: { email: "vendedor@teste.com" },
    });

    if (!buyer || !seller) {
      throw new Error("Usuarios de teste nao encontrados!");
    }
    console.log(`  ✓ Comprador: ${buyer.name} (${buyer.email})`);
    console.log(`  ✓ Vendedor: ${seller.name} (${seller.email})`);
    console.log(`  ✓ Telefone vendedor: ${seller.phone || "Nao informado"}`);

    // 2. Criar um ingresso de teste
    console.log("\nPASSO 2: Criando ingresso de teste...");
    const ticket = await prisma.ticket.create({
      data: {
        eventName: "Show Teste - Fluxo Completo",
        eventDate: new Date("2026-03-15T20:00:00"),
        eventLocation: "Arena Teste, Sao Paulo",
        ticketType: "Pista Premium",
        price: 250.0,
        originalPrice: 350.0,
        description: "Ingresso de teste para validar fluxo de compra",
        status: "available",
        sellerId: seller.id,
      },
    });
    console.log(`  ✓ Ingresso criado: ${ticket.eventName}`);
    console.log(`  ✓ ID: ${ticket.id}`);
    console.log(`  ✓ Preco: R$ ${ticket.price.toFixed(2)}`);
    console.log(`  ✓ Status: ${ticket.status}`);

    // 3. Iniciar a compra (criar transacao)
    console.log("\nPASSO 3: Iniciando compra (criando transacao)...");
    const platformFee = ticket.price * 0.1; // 10%
    const sellerAmount = ticket.price - platformFee;

    const transaction = await prisma.transaction.create({
      data: {
        ticketId: ticket.id,
        buyerId: buyer.id,
        sellerId: seller.id,
        amount: ticket.price,
        platformFee: platformFee,
        sellerAmount: sellerAmount,
        status: "pending",
      },
    });

    // Atualizar status do ingresso para reservado
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "reserved" },
    });

    console.log(`  ✓ Transacao criada: ${transaction.id}`);
    console.log(`  ✓ Valor total: R$ ${transaction.amount.toFixed(2)}`);
    console.log(`  ✓ Taxa Passback (10%): R$ ${transaction.platformFee.toFixed(2)}`);
    console.log(`  ✓ Vendedor recebe: R$ ${transaction.sellerAmount.toFixed(2)}`);
    console.log(`  ✓ Status: ${transaction.status}`);

    // 4. Simular pagamento confirmado (webhook Mercado Pago)
    console.log("\nPASSO 4: Simulando pagamento confirmado...");
    const paidTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "paid",
        mercadoPagoId: `MP-TEST-${Date.now()}`,
      },
    });

    // Atualizar status do ingresso para vendido
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "sold" },
    });

    console.log(`  ✓ Pagamento confirmado!`);
    console.log(`  ✓ Mercado Pago ID: ${paidTransaction.mercadoPagoId}`);
    console.log(`  ✓ Status transacao: ${paidTransaction.status}`);
    console.log(`  ✓ WhatsApp do vendedor LIBERADO: ${seller.phone || "11999999999"}`);

    // 5. Verificar que o comprador pode ver o contato do vendedor
    console.log("\nPASSO 5: Verificando acesso ao WhatsApp...");
    const verifyTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        seller: {
          select: { name: true, phone: true },
        },
      },
    });

    if (verifyTransaction?.status === "paid") {
      console.log(`  ✓ Contato do vendedor disponivel!`);
      console.log(`  ✓ Nome: ${verifyTransaction.seller.name}`);
      console.log(`  ✓ WhatsApp: ${verifyTransaction.seller.phone || "11999999999"}`);
      console.log(`  ✓ Link: https://wa.me/55${(verifyTransaction.seller.phone || "11999999999").replace(/\D/g, "")}`);
    }

    // 6. Comprador confirma que entrou no evento
    console.log("\nPASSO 6: Comprador confirma entrada no evento...");
    const confirmedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
      },
    });
    console.log(`  ✓ Entrada confirmada pelo comprador!`);
    console.log(`  ✓ Status: ${confirmedTransaction.status}`);
    console.log(`  ✓ Confirmado em: ${confirmedTransaction.confirmedAt?.toLocaleString("pt-BR")}`);

    // 7. Sistema libera o pagamento ao vendedor
    console.log("\nPASSO 7: Liberando pagamento ao vendedor...");
    const releasedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "released",
        releasedAt: new Date(),
      },
    });

    // Atualizar status do ingresso para completo
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "completed" },
    });

    console.log(`  ✓ Pagamento LIBERADO!`);
    console.log(`  ✓ Vendedor recebeu: R$ ${releasedTransaction.sellerAmount.toFixed(2)}`);
    console.log(`  ✓ Passback recebeu: R$ ${releasedTransaction.platformFee.toFixed(2)}`);
    console.log(`  ✓ Liberado em: ${releasedTransaction.releasedAt?.toLocaleString("pt-BR")}`);

    // 8. Resumo final
    console.log("\n========================================");
    console.log("         RESUMO DA TRANSACAO");
    console.log("========================================");

    const finalTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        ticket: true,
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true, phone: true, pixKey: true } },
      },
    });

    console.log(`\n  Evento: ${finalTransaction?.ticket.eventName}`);
    console.log(`  Tipo: ${finalTransaction?.ticket.ticketType}`);
    console.log(`  Data: ${new Date(finalTransaction?.ticket.eventDate || "").toLocaleDateString("pt-BR")}`);
    console.log(`\n  Comprador: ${finalTransaction?.buyer.name}`);
    console.log(`  Vendedor: ${finalTransaction?.seller.name}`);
    console.log(`  PIX do vendedor: ${finalTransaction?.seller.pixKey || "Nao informado"}`);
    console.log(`\n  Valor pago: R$ ${finalTransaction?.amount.toFixed(2)}`);
    console.log(`  Taxa Passback: R$ ${finalTransaction?.platformFee.toFixed(2)}`);
    console.log(`  Vendedor recebeu: R$ ${finalTransaction?.sellerAmount.toFixed(2)}`);
    console.log(`\n  Status final: ${finalTransaction?.status.toUpperCase()}`);
    console.log(`  Ingresso status: ${finalTransaction?.ticket.status.toUpperCase()}`);

    console.log("\n========================================");
    console.log("   ✅ FLUXO DE COMPRA COMPLETO!");
    console.log("========================================\n");

    // URLs para testar no navegador
    console.log("URLs para testar no navegador:");
    console.log(`  - Pagina do ingresso: http://localhost:3000/ingressos/${ticket.id}`);
    console.log(`  - Pagina da compra: http://localhost:3000/compra/${transaction.id}`);
    console.log(`  - Minhas compras: http://localhost:3000/minhas-compras`);
    console.log(`  - Minhas vendas: http://localhost:3000/minhas-vendas`);
    console.log("");

    return { ticket, transaction: finalTransaction };
  } catch (error) {
    console.error("\n❌ ERRO:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPurchaseFlow();
