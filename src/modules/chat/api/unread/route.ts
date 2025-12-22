// API Route: /api/modules/chat/unread
// Conta mensagens não lidas

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isChatEnabled } from "../../config";
import { countUnread } from "../../services";

// GET /api/modules/chat/unread
export async function GET() {
  if (!isChatEnabled()) {
    return NextResponse.json({ count: 0 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await countUnread(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[Chat] Erro ao contar não lidas:", error);
    return NextResponse.json({ count: 0 });
  }
}
