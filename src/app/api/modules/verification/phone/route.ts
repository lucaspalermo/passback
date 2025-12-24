import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Valida formato do telefone brasileiro
function isValidPhoneFormat(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");

  // Telefone brasileiro: 10 ou 11 digitos
  // 10 digitos: fixo (XX) XXXX-XXXX
  // 11 digitos: celular (XX) 9XXXX-XXXX
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return false;
  }

  // Verifica DDD valido (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  // Se for celular (11 digitos), deve comecar com 9
  if (cleanPhone.length === 11 && cleanPhone[2] !== "9") {
    return false;
  }

  return true;
}

// Formata telefone para exibicao
function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

// POST - Valida e salva telefone
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Telefone obrigatorio" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    // Valida formato
    if (!isValidPhoneFormat(cleanPhone)) {
      return NextResponse.json(
        { error: "Formato de telefone invalido. Use: (XX) 9XXXX-XXXX" },
        { status: 400 }
      );
    }

    // Verifica se telefone ja esta em uso por outro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: cleanPhone,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este telefone ja esta cadastrado em outra conta" },
        { status: 400 }
      );
    }

    // Atualiza usuario
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: cleanPhone,
        phoneVerified: true, // Valida apenas formato
      },
      select: {
        id: true,
        phone: true,
        phoneVerified: true,
      },
    });

    return NextResponse.json({
      message: "Telefone validado com sucesso",
      phoneVerified: true,
      formattedPhone: formatPhone(cleanPhone),
      user,
    });
  } catch (error) {
    console.error("Erro ao validar telefone:", error);
    return NextResponse.json({ error: "Erro ao validar telefone" }, { status: 500 });
  }
}

// GET - Status da verificacao de telefone
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        phoneVerified: true,
      },
    });

    return NextResponse.json({
      hasPhone: !!user?.phone,
      phoneVerified: user?.phoneVerified || false,
      formattedPhone: user?.phone ? formatPhone(user.phone) : null,
    });
  } catch (error) {
    console.error("Erro ao buscar status telefone:", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}
