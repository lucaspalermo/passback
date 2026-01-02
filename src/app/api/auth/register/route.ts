import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";
import { authLimiter, checkRateLimit, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";
import { logAuthEvent, logSecurityEvent } from "@/lib/audit";

// Validação de CPF
function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[10])) return false;

  return true;
}

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF e obrigatorio").refine(validateCPF, "CPF invalido"),
  phone: z.string().min(10, "WhatsApp e obrigatorio").max(11, "WhatsApp invalido"),
  termsAccepted: z.boolean().refine((val) => val === true, "Voce precisa aceitar os termos"),
});

// Versao atual dos termos (atualizar quando mudar os termos)
const TERMS_VERSION = "2024-12-24";
const PRIVACY_VERSION = "2024-12-24";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getIdentifier(request);
    const rateLimit = await checkRateLimit(authLimiter(), identifier);
    if (!rateLimit.success) {
      logSecurityEvent("rate_limited", request, undefined, { route: "/api/auth/register" });
      return rateLimitResponse(rateLimit.reset);
    }

    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, cpf, phone } = validation.data;

    // Obtem o IP do cliente para registro do aceite
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // Verifica email duplicado
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este email ja esta cadastrado" },
        { status: 400 }
      );
    }

    // Verifica CPF duplicado
    const existingCPF = await prisma.user.findFirst({
      where: { cpf },
    });

    if (existingCPF) {
      return NextResponse.json(
        { error: "Este CPF ja esta cadastrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phone,
        // PIX será o CPF por padrão
        pixKey: cpf,
        // Registro do aceite dos termos (proteção jurídica)
        termsAcceptedAt: now,
        termsAcceptedVersion: TERMS_VERSION,
        termsAcceptedIp: clientIp,
        privacyAcceptedAt: now,
        privacyAcceptedVersion: PRIVACY_VERSION,
      },
    });

    // Envia email de boas-vindas (não bloqueia a resposta)
    sendWelcomeEmail(email, name).catch((err) => {
      console.error("[Email] Erro ao enviar boas-vindas:", err);
    });

    // Log de auditoria
    logAuthEvent("register", request, user.id, { email });

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
