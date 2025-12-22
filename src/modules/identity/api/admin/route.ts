// API Route: /api/modules/identity/admin
// Gerenciamento de verificações (admin only)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isIdentityEnabled } from "../../config";
import {
  listPendingVerifications,
  approveVerification,
  rejectVerification,
} from "../../services";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

// GET /api/modules/identity/admin - Lista verificações pendentes
export async function GET() {
  if (!isIdentityEnabled()) {
    return NextResponse.json({ verifications: [] });
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedUser | undefined;
  if (!user?.id || !user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const verifications = await listPendingVerifications();
    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("[Identity Admin] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao listar verificações" },
      { status: 500 }
    );
  }
}

// POST /api/modules/identity/admin - Aprovar ou rejeitar
export async function POST(request: NextRequest) {
  if (!isIdentityEnabled()) {
    return NextResponse.json(
      { error: "Módulo desabilitado" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedUser | undefined;
  if (!user?.id || !user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { verificationId, action, reason } = await request.json();

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: "ID e ação são obrigatórios" },
        { status: 400 }
      );
    }

    let result;

    if (action === "approve") {
      result = await approveVerification(verificationId, user.id);
    } else if (action === "reject") {
      if (!reason) {
        return NextResponse.json(
          { error: "Motivo da rejeição é obrigatório" },
          { status: 400 }
        );
      }
      result = await rejectVerification(verificationId, user.id, reason);
    } else {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verification: result.verification,
    });
  } catch (error) {
    console.error("[Identity Admin] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar ação" },
      { status: 500 }
    );
  }
}
