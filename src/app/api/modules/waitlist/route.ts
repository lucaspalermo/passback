import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isWaitlistEnabled } from "@/modules/waitlist";
import {
  joinWaitlist,
  leaveWaitlist,
  getUserWaitlist,
} from "@/modules/waitlist/services";

// GET - Lista de espera do usuário ou por evento
export async function GET(request: NextRequest) {
  try {
    if (!isWaitlistEnabled()) {
      return NextResponse.json(
        { error: "Módulo de lista de espera desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca lista do usuário
    const entries = await getUserWaitlist(session.user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Erro ao buscar lista de espera:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lista de espera" },
      { status: 500 }
    );
  }
}

// POST - Entrar na lista de espera
export async function POST(request: NextRequest) {
  try {
    if (!isWaitlistEnabled()) {
      return NextResponse.json(
        { error: "Módulo de lista de espera desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { eventName, eventDate, ticketType, maxPrice } = body;

    if (!eventName || !eventDate) {
      return NextResponse.json(
        { error: "Nome do evento e data são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await joinWaitlist({
      userId: session.user.id,
      eventName,
      eventDate: new Date(eventDate),
      ticketType,
      maxPrice,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ entry: result.entry });
  } catch (error) {
    console.error("Erro ao entrar na lista de espera:", error);
    return NextResponse.json(
      { error: "Erro ao entrar na lista de espera" },
      { status: 500 }
    );
  }
}

// DELETE - Sair da lista de espera
export async function DELETE(request: NextRequest) {
  try {
    if (!isWaitlistEnabled()) {
      return NextResponse.json(
        { error: "Módulo de lista de espera desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json(
        { error: "ID da entrada é obrigatório" },
        { status: 400 }
      );
    }

    const result = await leaveWaitlist(entryId, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao sair da lista de espera:", error);
    return NextResponse.json(
      { error: "Erro ao sair da lista de espera" },
      { status: 500 }
    );
  }
}
