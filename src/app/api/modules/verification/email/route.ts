import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmailVerificationCode } from "@/lib/email";

// Gera codigo de 6 digitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Envia codigo de verificacao
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email ja verificado" }, { status: 400 });
    }

    // Gera codigo e data de expiracao (10 minutos)
    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Salva no banco
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerificationCode: code,
        emailVerificationExpires: expires,
      },
    });

    // Envia email
    const result = await sendEmailVerificationCode(user.email, user.name, code);

    if (!result.success) {
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Codigo enviado para seu email",
      email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
      expiresIn: "10 minutos",
    });
  } catch (error) {
    console.error("Erro ao enviar codigo:", error);
    return NextResponse.json({ error: "Erro ao enviar codigo" }, { status: 500 });
  }
}

// PUT - Verifica codigo
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerified: true,
        emailVerificationCode: true,
        emailVerificationExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email ja verificado" }, { status: 400 });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return NextResponse.json(
        { error: "Nenhum codigo pendente. Solicite um novo." },
        { status: 400 }
      );
    }

    // Verifica expiracao
    if (new Date() > user.emailVerificationExpires) {
      return NextResponse.json(
        { error: "Codigo expirado. Solicite um novo." },
        { status: 400 }
      );
    }

    // Verifica codigo
    if (code !== user.emailVerificationCode) {
      return NextResponse.json({ error: "Codigo incorreto" }, { status: 400 });
    }

    // Marca como verificado
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.json({
      message: "Email verificado com sucesso!",
      emailVerified: true,
    });
  } catch (error) {
    console.error("Erro ao verificar codigo:", error);
    return NextResponse.json({ error: "Erro ao verificar codigo" }, { status: 500 });
  }
}

// GET - Status da verificacao de email
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        emailVerified: true,
        emailVerificationExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      emailVerified: user.emailVerified || false,
      hasPendingCode: user.emailVerificationExpires
        ? new Date() < user.emailVerificationExpires
        : false,
    });
  } catch (error) {
    console.error("Erro ao buscar status:", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}
