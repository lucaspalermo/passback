// API Route: /api/modules/enhanced-registration
// Registro com campos obrigatórios (WhatsApp, CPF)

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Feature flag
function isEnhancedRegistrationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_ENHANCED_REGISTRATION === "true";
}

// Validação de CPF
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Validação de telefone
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d]/g, "");
  return cleaned.length === 10 || cleaned.length === 11;
}

// Schema de validação
const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().min(10, "WhatsApp é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
});

export async function POST(request: NextRequest) {
  if (!isEnhancedRegistrationEnabled()) {
    return NextResponse.json(
      { error: "Módulo desabilitado" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, cpf } = validation.data;

    // Validações
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: "WhatsApp inválido. Use o formato (XX) XXXXX-XXXX" },
        { status: 400 }
      );
    }

    if (!validateCPF(cpf)) {
      return NextResponse.json(
        { error: "CPF inválido" },
        { status: 400 }
      );
    }

    const cleanCPF = cpf.replace(/[^\d]/g, "");
    const cleanPhone = phone.replace(/[^\d]/g, "");

    // Verifica duplicados
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      );
    }

    const existingCPF = await prisma.user.findFirst({
      where: { cpf: cleanCPF },
    });

    if (existingCPF) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: cleanPhone,
        cpf: cleanCPF,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Enhanced Registration] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
