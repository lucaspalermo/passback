const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function testTicketWithImage() {
  console.log("\n========================================");
  console.log("  TESTE: Criar Ingresso com Imagem");
  console.log("========================================\n");

  try {
    // 1. Buscar vendedor
    console.log("PASSO 1: Buscando vendedor...");
    const seller = await prisma.user.findUnique({
      where: { email: "vendedor@teste.com" },
    });

    if (!seller) {
      throw new Error("Vendedor nao encontrado!");
    }
    console.log(`  ✓ Vendedor: ${seller.name}`);

    // 2. Criar uma imagem de teste (placeholder)
    console.log("\nPASSO 2: Preparando imagem de teste...");

    // Criar diretorio de uploads se nao existir
    const uploadsDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("  ✓ Diretorio de uploads criado");
    }

    // Criar uma imagem SVG simples como placeholder
    const svgContent = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#16C784;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2DFF88;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" font-weight="bold">🎵 FESTIVAL DE VERAO 2026</text>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Arena Beira-Mar • 15 de Janeiro</text>
      <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">Artistas: Anitta • Ludmilla • Ivete Sangalo</text>
    </svg>`;

    const imageName = `festival-verao-${Date.now()}.svg`;
    const imagePath = path.join(uploadsDir, imageName);
    fs.writeFileSync(imagePath, svgContent);
    console.log(`  ✓ Imagem criada: ${imageName}`);

    const imageUrl = `/uploads/${imageName}`;

    // 3. Criar o ingresso com imagem
    console.log("\nPASSO 3: Criando ingresso com imagem...");
    const ticket = await prisma.ticket.create({
      data: {
        eventName: "Festival de Verao 2026",
        eventDate: new Date("2026-01-15T16:00:00"),
        eventLocation: "Arena Beira-Mar, Fortaleza - CE",
        ticketType: "Pista Premium",
        price: 350.0,
        originalPrice: 450.0,
        description: "Ingresso Pista Premium com acesso a area VIP. Inclui 2 drinks. Lineup: Anitta, Ludmilla, Ivete Sangalo e mais!",
        imageUrl: imageUrl,
        status: "available",
        sellerId: seller.id,
      },
    });

    console.log(`  ✓ Ingresso criado com sucesso!`);
    console.log(`  ✓ ID: ${ticket.id}`);
    console.log(`  ✓ Evento: ${ticket.eventName}`);
    console.log(`  ✓ Preco: R$ ${ticket.price.toFixed(2)}`);
    console.log(`  ✓ Imagem: ${ticket.imageUrl}`);

    // 4. Verificar no banco
    console.log("\nPASSO 4: Verificando no banco de dados...");
    const savedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: { seller: { select: { name: true } } },
    });

    console.log(`  ✓ Ingresso salvo corretamente`);
    console.log(`  ✓ imageUrl no banco: ${savedTicket?.imageUrl || "VAZIO"}`);

    // 5. Listar todos os ingressos disponiveis com imagem
    console.log("\nPASSO 5: Listando ingressos com imagem...");
    const ticketsWithImage = await prisma.ticket.findMany({
      where: {
        imageUrl: { not: null },
        status: "available",
      },
      select: {
        id: true,
        eventName: true,
        imageUrl: true,
        price: true,
      },
    });

    console.log(`  ✓ Total de ingressos com imagem: ${ticketsWithImage.length}`);
    ticketsWithImage.forEach((t, i) => {
      console.log(`    ${i + 1}. ${t.eventName} - ${t.imageUrl}`);
    });

    // Resultado
    console.log("\n========================================");
    console.log("  ✅ TESTE CONCLUIDO COM SUCESSO!");
    console.log("========================================");
    console.log("\nURLs para testar no navegador:");
    console.log(`  - Home: http://localhost:3000`);
    console.log(`  - Ingresso: http://localhost:3000/ingressos/${ticket.id}`);
    console.log(`  - Imagem: http://localhost:3000${imageUrl}`);
    console.log("");

    return ticket;
  } catch (error) {
    console.error("\n❌ ERRO:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testTicketWithImage();
