// API Route: /api/modules/identity
// Verificação de identidade do usuário

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isIdentityEnabled } from "../config";
import { getUserVerificationStatus, submitVerification } from "../services";

// GET /api/modules/identity - Retorna status de verificação do usuário
export async function GET() {
  if (!isIdentityEnabled()) {
    return NextResponse.json({
      enabled: false,
      isVerified: true,
      canSell: true,
      canBuy: true,
    });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const status = await getUserVerificationStatus(session.user.id);
    return NextResponse.json({ enabled: true, ...status });
  } catch (error) {
    console.error("[Identity] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}

// POST /api/modules/identity - Submete documentos para verificação
export async function POST(request: NextRequest) {
  if (!isIdentityEnabled()) {
    return NextResponse.json(
      { error: "Módulo de verificação desabilitado" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { documentType, documentNumber, documentFrontUrl, documentBackUrl, selfieUrl } = body;

    if (!documentType || !documentFrontUrl || !selfieUrl) {
      return NextResponse.json(
        { error: "Tipo de documento, foto do documento e selfie são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await submitVerification({
      userId: session.user.id,
      documentType,
      documentNumber,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verification: result.verification,
      message: "Documentos enviados com sucesso! Aguarde a análise.",
    });
  } catch (error) {
    console.error("[Identity] Erro ao submeter:", error);
    return NextResponse.json(
      { error: "Erro ao processar verificação" },
      { status: 500 }
    );
  }
}
