import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Limpar dados de teste anteriores
  await prisma.disputeMessage.deleteMany({});
  await prisma.evidence.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.userReputation.deleteMany({});

  // Criar vendedor
  const vendedor = await prisma.user.upsert({
    where: { email: "vendedor@teste.com" },
    update: {
      phone: "11999999999",
    },
    create: {
      email: "vendedor@teste.com",
      name: "Carlos Vendedor",
      password: await bcrypt.hash("123456", 10),
      phone: "11999999999",
      verified: true,
    },
  });

  // Criar comprador
  const comprador = await prisma.user.upsert({
    where: { email: "comprador@teste.com" },
    update: {
      phone: "11988888888",
    },
    create: {
      email: "comprador@teste.com",
      name: "Maria Compradora",
      password: await bcrypt.hash("123456", 10),
      phone: "11988888888",
      verified: true,
    },
  });

  // Criar admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@passback.com" },
    update: { isAdmin: true },
    create: {
      email: "admin@passback.com",
      name: "Administrador",
      password: await bcrypt.hash("admin123", 10),
      phone: "11900000000",
      verified: true,
      isAdmin: true,
    },
  });

  // Criar reputacao inicial para os usuarios
  await prisma.userReputation.upsert({
    where: { userId: vendedor.id },
    update: {},
    create: {
      userId: vendedor.id,
      completedSales: 15,
      totalSales: 18,
      trustScore: 95,
    },
  });

  await prisma.userReputation.upsert({
    where: { userId: comprador.id },
    update: {},
    create: {
      userId: comprador.id,
      completedPurchases: 8,
      totalPurchases: 10,
      trustScore: 90,
    },
  });

  // Criar ingressos de exemplo (datas futuras - 2026)
  const eventos = [
    {
      eventName: "Show do Coldplay - Music of the Spheres",
      eventDate: new Date("2026-02-15T20:00:00"),
      eventLocation: "Allianz Parque, Sao Paulo - SP",
      ticketType: "Pista Premium",
      price: 450.0,
      originalPrice: 600.0,
      description: "Ingresso pista premium, setor A. Nao conseguirei ir por motivo de viagem.",
    },
    {
      eventName: "Lollapalooza Brasil 2026",
      eventDate: new Date("2026-03-28T12:00:00"),
      eventLocation: "Autodromo de Interlagos, Sao Paulo - SP",
      ticketType: "Lolla Lounge",
      price: 1200.0,
      originalPrice: 1500.0,
      description: "Ingresso Lolla Lounge para sexta-feira. Acesso a area VIP com open bar.",
    },
    {
      eventName: "Rock in Rio 2026 - Dia do Rock",
      eventDate: new Date("2026-09-19T14:00:00"),
      eventLocation: "Cidade do Rock, Rio de Janeiro - RJ",
      ticketType: "Pista",
      price: 595.0,
      originalPrice: 795.0,
      description: "Ingresso inteira para o dia do rock. Vendo por motivos pessoais.",
    },
    {
      eventName: "The Weeknd - After Hours Tour",
      eventDate: new Date("2026-04-10T21:00:00"),
      eventLocation: "Estadio do Morumbi, Sao Paulo - SP",
      ticketType: "Cadeira Superior",
      price: 280.0,
      originalPrice: 350.0,
      description: "Cadeira superior com otima visao do palco. Surgiu compromisso de ultima hora.",
    },
    {
      eventName: "Festival Primavera Sound 2026",
      eventDate: new Date("2026-11-08T14:00:00"),
      eventLocation: "Distrito Anhembi, Sao Paulo - SP",
      ticketType: "Passe 3 Dias",
      price: 890.0,
      originalPrice: 1100.0,
      description: "Passe completo para os 3 dias do festival. Transferencia de emprego nao permite ir.",
    },
    {
      eventName: "Brasil x Argentina - Eliminatorias Copa 2026",
      eventDate: new Date("2026-06-15T16:00:00"),
      eventLocation: "Maracana, Rio de Janeiro - RJ",
      ticketType: "Arquibancada Norte",
      price: 320.0,
      originalPrice: 400.0,
      description: "Setor Norte, fileira 15. Ingresso garantido, vendo por viagem marcada.",
    },
    {
      eventName: "Hamilton - O Musical",
      eventDate: new Date("2026-05-20T20:00:00"),
      eventLocation: "Teatro Renault, Sao Paulo - SP",
      ticketType: "Plateia VIP",
      price: 450.0,
      originalPrice: 550.0,
      description: "Melhor setor do teatro, fileira C. Presente que infelizmente nao poderei usar.",
    },
    {
      eventName: "Reveillon 2026 - Copacabana",
      eventDate: new Date("2025-12-31T22:00:00"),
      eventLocation: "Praia de Copacabana, Rio de Janeiro - RJ",
      ticketType: "Area VIP",
      price: 350.0,
      originalPrice: 500.0,
      description: "Area VIP com open bar e vista para os fogos. Vendo por viagem de ultima hora.",
    },
    {
      eventName: "Anitta - Funk Generation Tour",
      eventDate: new Date("2026-01-20T22:00:00"),
      eventLocation: "Pedreira Paulo Leminski, Curitiba - PR",
      ticketType: "Pista",
      price: 180.0,
      originalPrice: 250.0,
      description: "Ingresso pista para o show da Anitta em Curitiba. Mudei de cidade.",
    },
    {
      eventName: "Ed Sheeran - Mathematics Tour",
      eventDate: new Date("2026-01-15T20:00:00"),
      eventLocation: "Arena BRB Mane Garrincha, Brasilia - DF",
      ticketType: "Pista Premium",
      price: 520.0,
      originalPrice: 680.0,
      description: "Area premium com visao privilegiada. Comprei duplicado por engano.",
    },
  ];

  for (const evento of eventos) {
    await prisma.ticket.create({
      data: {
        ...evento,
        sellerId: vendedor.id,
        status: "available",
      },
    });
  }

  console.log(`${eventos.length} ingressos disponiveis criados!`);

  // ========================================
  // CRIAR CENARIOS DE TESTE
  // ========================================

  // Cenario 1: Transacao PAGA (aguardando confirmacao do comprador)
  const ingressoPago = await prisma.ticket.create({
    data: {
      eventName: "Show do Bruno Mars - World Tour",
      eventDate: new Date("2026-03-01T21:00:00"),
      eventLocation: "Allianz Parque, Sao Paulo - SP",
      ticketType: "Pista Premium",
      price: 650.0,
      originalPrice: 800.0,
      description: "Ingresso pista premium. Ja pago, aguardando confirmacao.",
      sellerId: vendedor.id,
      status: "sold",
    },
  });

  const transacaoPaga = await prisma.transaction.create({
    data: {
      ticketId: ingressoPago.id,
      buyerId: comprador.id,
      sellerId: vendedor.id,
      amount: 650.0,
      platformFee: 65.0,
      sellerAmount: 585.0,
      status: "paid",
      paidAt: new Date(),
    },
  });

  console.log(`Transacao PAGA criada: ${transacaoPaga.id}`);

  // Cenario 2: Transacao com DISPUTA ABERTA (para admin resolver)
  const ingressoDisputa = await prisma.ticket.create({
    data: {
      eventName: "Festival Sunset 2026",
      eventDate: new Date("2026-02-20T16:00:00"),
      eventLocation: "Praia de Ipanema, Rio de Janeiro - RJ",
      ticketType: "Area VIP",
      price: 400.0,
      originalPrice: 500.0,
      description: "Ingresso VIP para o festival. Em disputa.",
      sellerId: vendedor.id,
      status: "sold",
    },
  });

  const transacaoDisputa = await prisma.transaction.create({
    data: {
      ticketId: ingressoDisputa.id,
      buyerId: comprador.id,
      sellerId: vendedor.id,
      amount: 400.0,
      platformFee: 40.0,
      sellerAmount: 360.0,
      status: "disputed",
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atras
    },
  });

  const disputa = await prisma.dispute.create({
    data: {
      reason: "ingresso_invalido",
      description: "O QR Code do ingresso nao funcionou na entrada do evento. Tentei 3 vezes e o sistema sempre dava erro. O vendedor disse que o ingresso era valido mas claramente nao era.",
      status: "open",
      transactionId: transacaoDisputa.id,
      userId: comprador.id,
    },
  });

  // Adicionar mensagens na disputa
  await prisma.disputeMessage.createMany({
    data: [
      {
        message: "O ingresso que comprei nao funcionou na entrada. Perdi o show!",
        sender: "buyer",
        senderId: comprador.id,
        disputeId: disputa.id,
      },
      {
        message: "O ingresso estava valido quando enviei. Deve ter sido problema do sistema do evento.",
        sender: "seller",
        senderId: vendedor.id,
        disputeId: disputa.id,
      },
    ],
  });

  // Adicionar evidencia
  await prisma.evidence.create({
    data: {
      type: "screenshot",
      description: "Print da tela do celular mostrando erro no QR Code",
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      uploadedBy: "buyer",
      disputeId: disputa.id,
    },
  });

  console.log(`Disputa ABERTA criada: ${disputa.id}`);

  // Cenario 3: Transacao CONFIRMADA (comprador confirmou entrada) - evento passado OK
  const ingressoConfirmado = await prisma.ticket.create({
    data: {
      eventName: "Show do Maroon 5",
      eventDate: new Date("2025-12-10T20:00:00"),
      eventLocation: "Arena Fonte Nova, Salvador - BA",
      ticketType: "Cadeira Inferior",
      price: 350.0,
      originalPrice: 450.0,
      description: "Transacao concluida com sucesso.",
      sellerId: vendedor.id,
      status: "completed",
    },
  });

  await prisma.transaction.create({
    data: {
      ticketId: ingressoConfirmado.id,
      buyerId: comprador.id,
      sellerId: vendedor.id,
      amount: 350.0,
      platformFee: 35.0,
      sellerAmount: 315.0,
      status: "released",
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      releasedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Transacao CONFIRMADA criada");

  console.log("");
  console.log("========================================");
  console.log("   DADOS DE TESTE CRIADOS COM SUCESSO");
  console.log("========================================");
  console.log("");
  console.log("USUARIOS:");
  console.log("  Vendedor:  vendedor@teste.com / 123456");
  console.log("  Comprador: comprador@teste.com / 123456");
  console.log("  Admin:     admin@passback.com / admin123");
  console.log("");
  console.log("CENARIOS PRONTOS:");
  console.log(`  1. ${eventos.length} ingressos DISPONIVEIS para compra`);
  console.log(`  2. Transacao PAGA (ID: ${transacaoPaga.id})`);
  console.log("     -> Acesse /compra/" + transacaoPaga.id + " como comprador");
  console.log(`  3. Disputa ABERTA para resolver (ID: ${disputa.id})`);
  console.log("     -> Acesse /admin/disputas como admin");
  console.log("  4. Transacao ja CONFIRMADA e liberada");
  console.log("");
  console.log("FLUXO DE TESTE:");
  console.log("  1. Login como comprador -> comprar ingresso");
  console.log("  2. Simular pagamento: /api/test/simulate-payment?transactionId=ID");
  console.log("  3. WhatsApp abre automaticamente");
  console.log("  4. Confirmar entrada OU abrir disputa");
  console.log("  5. Login como admin -> resolver disputa");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
