import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Status completo de verificacao do usuario
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
        phone: true,
        cpf: true,
        emailVerified: true,
        cpfVerified: true,
        cpfValidatedName: true,
        phoneVerified: true,
        isIdentityVerified: true,
        verified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Calcula nivel de verificacao
    let verificationLevel = 0;
    const verifications = {
      email: user.emailVerified || false,
      cpf: user.cpfVerified || false,
      phone: user.phoneVerified || false,
      identity: user.isIdentityVerified || false,
    };

    if (verifications.email) verificationLevel++;
    if (verifications.cpf) verificationLevel++;
    if (verifications.phone) verificationLevel++;
    if (verifications.identity) verificationLevel++;

    // Determina badge
    let badge: "none" | "basic" | "verified" | "trusted" = "none";
    if (verificationLevel >= 3) {
      badge = "trusted";
    } else if (verificationLevel >= 2) {
      badge = "verified";
    } else if (verificationLevel >= 1) {
      badge = "basic";
    }

    return NextResponse.json({
      verifications,
      verificationLevel,
      maxLevel: 4,
      badge,
      badges: {
        none: "Sem verificacao",
        basic: "Verificacao basica",
        verified: "Verificado",
        trusted: "Confiavel",
      },
      details: {
        email: {
          verified: verifications.email,
          value: user.email,
          masked: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        },
        cpf: {
          verified: verifications.cpf,
          hasCpf: !!user.cpf,
          validatedName: user.cpfValidatedName,
          masked: user.cpf ? `***.***.***-${user.cpf.slice(-2)}` : null,
        },
        phone: {
          verified: verifications.phone,
          hasPhone: !!user.phone,
          masked: user.phone
            ? `(**) *****-${user.phone.slice(-4)}`
            : null,
        },
        identity: {
          verified: verifications.identity,
        },
      },
      tips: {
        email: !verifications.email
          ? "Verifique seu email para aumentar sua confiabilidade"
          : null,
        cpf: !verifications.cpf
          ? "Valide seu CPF para poder vender ingressos"
          : null,
        phone: !verifications.phone
          ? "Adicione seu telefone para facilitar o contato"
          : null,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar status de verificacao:", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}
