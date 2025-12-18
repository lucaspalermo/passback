const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Templates de flyers de festas
const flyerTemplates = [
  {
    name: "Neon Party",
    gradient: ["#FF00FF", "#00FFFF"],
    emoji: "🎉",
    subtitle: "A Maior Festa Neon do Brasil",
    dj: "DJ Snake • Alok • KVSH"
  },
  {
    name: "Baile Funk",
    gradient: ["#FF4500", "#FFD700"],
    emoji: "🔥",
    subtitle: "O Baile Mais Quente do Rio",
    dj: "MC Kevinho • Anitta • Dennis DJ"
  },
  {
    name: "Techno Underground",
    gradient: ["#1a1a2e", "#16213e"],
    emoji: "🖤",
    subtitle: "Uma Noite de Techno Puro",
    dj: "Charlotte de Witte • Amelie Lens"
  },
  {
    name: "Sunset Beach Party",
    gradient: ["#FF6B6B", "#FFE66D"],
    emoji: "🌅",
    subtitle: "Festa na Praia ao Por do Sol",
    dj: "Vintage Culture • Cat Dealers"
  },
  {
    name: "Sertanejo Premium",
    gradient: ["#8B4513", "#DAA520"],
    emoji: "🤠",
    subtitle: "Os Maiores Hits do Sertanejo",
    dj: "Gusttavo Lima • Jorge & Mateus"
  },
  {
    name: "Rock in Rio",
    gradient: ["#DC143C", "#000000"],
    emoji: "🎸",
    subtitle: "O Maior Festival de Rock",
    dj: "Iron Maiden • Guns N Roses"
  },
  {
    name: "Carnaval 2026",
    gradient: ["#FFD700", "#FF1493"],
    emoji: "🎭",
    subtitle: "O Bloco Mais Animado",
    dj: "Ivete Sangalo • Claudia Leitte"
  },
  {
    name: "Réveillon VIP",
    gradient: ["#C0C0C0", "#FFD700"],
    emoji: "✨",
    subtitle: "Virada de Ano Exclusiva",
    dj: "Open Bar • Show Pirotécnico"
  }
];

function createFlyerSVG(template, eventName) {
  const [color1, color2] = template.gradient;

  return `<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Overlay pattern -->
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.3)"/>

  <!-- Decorative circles -->
  <circle cx="100" cy="100" r="150" fill="rgba(255,255,255,0.05)"/>
  <circle cx="700" cy="400" r="200" fill="rgba(255,255,255,0.05)"/>
  <circle cx="400" cy="50" r="100" fill="rgba(255,255,255,0.03)"/>

  <!-- Emoji -->
  <text x="50%" y="25%" font-size="80" text-anchor="middle" filter="url(#glow)">${template.emoji}</text>

  <!-- Event Name -->
  <text x="50%" y="45%" font-family="Arial Black, sans-serif" font-size="52" fill="white" text-anchor="middle" font-weight="900" filter="url(#glow)">${eventName.toUpperCase()}</text>

  <!-- Subtitle -->
  <text x="50%" y="58%" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.9)" text-anchor="middle">${template.subtitle}</text>

  <!-- Line-up -->
  <text x="50%" y="72%" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)" text-anchor="middle">LINE-UP: ${template.dj}</text>

  <!-- Bottom bar -->
  <rect x="0" y="460" width="800" height="40" fill="rgba(0,0,0,0.5)"/>
  <text x="50%" y="488%" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">INGRESSOS LIMITADOS • CLASSIFICAÇÃO 18+</text>
</svg>`;
}

async function createTestFlyers() {
  console.log("\n========================================");
  console.log("  CRIANDO FLYERS DE TESTE PARA INGRESSOS");
  console.log("========================================\n");

  try {
    // Criar diretório de uploads
    const uploadsDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Buscar todos os ingressos disponíveis
    const tickets = await prisma.ticket.findMany({
      where: { status: "available" },
      orderBy: { createdAt: "asc" }
    });

    console.log(`Encontrados ${tickets.length} ingressos para atualizar\n`);

    let updated = 0;
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const template = flyerTemplates[i % flyerTemplates.length];

      // Criar SVG do flyer
      const svgContent = createFlyerSVG(template, ticket.eventName);

      // Salvar arquivo
      const fileName = `flyer-${ticket.id.slice(-8)}-${Date.now()}.svg`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, svgContent);

      // Atualizar ingresso no banco
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { imageUrl: `/uploads/${fileName}` }
      });

      console.log(`✓ ${ticket.eventName}`);
      console.log(`  Template: ${template.name}`);
      console.log(`  Arquivo: ${fileName}\n`);
      updated++;
    }

    console.log("========================================");
    console.log(`  ✅ ${updated} FLYERS CRIADOS!`);
    console.log("========================================\n");

    // Listar resultado
    const updatedTickets = await prisma.ticket.findMany({
      where: {
        status: "available",
        imageUrl: { not: null }
      },
      select: {
        id: true,
        eventName: true,
        imageUrl: true
      }
    });

    console.log("Ingressos com flyer:");
    updatedTickets.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.eventName}`);
      console.log(`     http://localhost:3000/ingressos/${t.id}`);
    });

    console.log("\n🌐 Acesse http://localhost:3000 para ver os cards com imagens!\n");

  } catch (error) {
    console.error("❌ ERRO:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestFlyers();
