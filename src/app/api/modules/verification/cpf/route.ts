import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { authLimiter, checkRateLimit, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

// Valida formato do CPF
function isValidCpfFormat(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) return false;

  // Verifica se todos os digitos sao iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // Valida digitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;

  return true;
}

// Consulta CPF na API externa
async function consultCpf(cpf: string): Promise<{ valid: boolean; name?: string; error?: string }> {
  const cleanCpf = cpf.replace(/\D/g, "");

  try {
    // Usando Brasil API (gratuita)
    const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cleanCpf}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (response.status === 404) {
      return { valid: false, error: "CPF nao encontrado na base da Receita Federal" };
    }

    if (!response.ok) {
      // Se a API falhar, valida apenas o formato
      console.log("[CPF] API indisponivel, validando apenas formato");
      return { valid: true, name: undefined };
    }

    const data = await response.json();

    if (data.nome) {
      return { valid: true, name: data.nome };
    }

    return { valid: true };
  } catch (error) {
    console.error("[CPF] Erro na consulta:", error);
    // Em caso de erro, aceita CPF com formato valido
    return { valid: true, name: undefined };
  }
}

// POST - Validar e salvar CPF
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // Rate limiting (5 por minuto)
  const identifier = getIdentifier(request, session.user.id);
  const rateLimit = await checkRateLimit(authLimiter(), identifier);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  try {
    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json({ error: "CPF obrigatorio" }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    // Valida formato
    if (!isValidCpfFormat(cleanCpf)) {
      return NextResponse.json({ error: "CPF invalido" }, { status: 400 });
    }

    // Verifica se CPF ja esta em uso por outro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        cpf: cleanCpf,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este CPF ja esta cadastrado em outra conta" },
        { status: 400 }
      );
    }

    // Consulta API externa
    const result = await consultCpf(cleanCpf);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || "CPF invalido" }, { status: 400 });
    }

    // Atualiza usuario
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        cpf: cleanCpf,
        cpfVerified: true,
        cpfValidatedName: result.name || null,
      },
      select: {
        id: true,
        cpf: true,
        cpfVerified: true,
        cpfValidatedName: true,
      },
    });

    return NextResponse.json({
      message: "CPF validado com sucesso",
      cpfVerified: true,
      validatedName: result.name,
      user,
    });
  } catch (error) {
    console.error("Erro ao validar CPF:", error);
    return NextResponse.json({ error: "Erro ao validar CPF" }, { status: 500 });
  }
}

// GET - Status da verificacao de CPF
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        cpf: true,
        cpfVerified: true,
        cpfValidatedName: true,
      },
    });

    return NextResponse.json({
      hasCpf: !!user?.cpf,
      cpfVerified: user?.cpfVerified || false,
      validatedName: user?.cpfValidatedName,
      maskedCpf: user?.cpf ? `***.***.***-${user.cpf.slice(-2)}` : null,
    });
  } catch (error) {
    console.error("Erro ao buscar status CPF:", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}
