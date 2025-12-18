const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function fixPassword() {
  console.log("\n=== ATUALIZANDO SENHA ===\n");

  try {
    const email = "l.simports@hotmail.com";
    const newPassword = "2262144Lu$";

    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar no banco
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log(`✓ Senha atualizada para: ${email}`);
    console.log(`✓ Nome: ${user.name}`);
    console.log(`\nAgora você pode fazer login com:`);
    console.log(`  Email: ${email}`);
    console.log(`  Senha: ${newPassword}\n`);

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPassword();
