// API Route para registro aprimorado
// Será copiado para: /api/modules/enhanced-registration

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  isEnhancedRegistrationEnabled,
  validateCPF,
  validatePhone,
  ENHANCED_REGISTRATION_CONFIG,
} from "../index";

// Schema de validação com campos obrigatórios
const enhancedRegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().min(10, "WhatsApp é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
});

export async function POST(request: NextRequest) {
  // Verifica se módulo está habilitado
  if (!isEnhancedRegistrationEnabled()) {
    return NextResponse.json(
      { error: "Módulo de registro aprimorado desabilitado" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const validation = enhancedRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, cpf } = validation.data;

    // Validações adicionais
    if (ENHANCED_REGISTRATION_CONFIG.requireWhatsApp && !validatePhone(phone)) {
      return NextResponse.json(
        { error: "WhatsApp inválido. Use o formato (XX) XXXXX-XXXX" },
        { status: 400 }
      );
    }

    if (ENHANCED_REGISTRATION_CONFIG.validateCPF && !validateCPF(cpf)) {
      return NextResponse.json(
        { error: "CPF inválido" },
        { status: 400 }
      );
    }

    // Limpa CPF para armazenar apenas números
    const cleanCPF = cpf.replace(/[^\d]/g, "");
    const cleanPhone = phone.replace(/[^\d]/g, "");

    // Verifica email existente
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      );
    }

    // Verifica CPF existente
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
