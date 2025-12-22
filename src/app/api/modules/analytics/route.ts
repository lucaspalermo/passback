import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAnalyticsEnabled, AnalyticsPeriod } from "@/modules/analytics";
import { getSellerDashboard } from "@/modules/analytics/services";

// GET - Dashboard de analytics
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled()) {
      return NextResponse.json(
        { error: "Módulo de analytics desabilitado" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "30d";
    const period = periodParam as AnalyticsPeriod;

    // Dashboard do vendedor
    const dashboard = await getSellerDashboard(session.user.id, { period });

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dashboard" },
      { status: 500 }
    );
  }
}
