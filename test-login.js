const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function testLogin() {
  console.log("\n=== TESTE DE LOGIN ===\n");

  try {
    // Buscar usuários
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, password: true }
    });

    console.log(`Total de usuários: ${users.length}\n`);

    // Testar login para cada usuário
    const testPassword = "123456";

    for (const user of users) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`${user.email}: ${isValid ? "✓ Senha OK" : "✗ Senha ERRADA"}`);

      if (!isValid) {
        console.log("  Corrigindo senha...");
        const newHash = await bcrypt.hash(testPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
        });
        console.log("  ✓ Senha corrigida!");
      }
    }

    console.log("\n=== TESTE CONCLUÍDO ===\n");
    console.log("Tente fazer login novamente em http://localhost:3000/login");
    console.log("Email: vendedor@teste.com");
    console.log("Senha: 123456\n");

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
