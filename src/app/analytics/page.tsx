"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Eye,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
} from "lucide-react";

interface DashboardData {
  summary: {
    totalSales?: number;
    totalPurchases?: number;
    totalRevenue?: number;
    totalSpent?: number;
    totalViews?: number;
    conversionRate?: number;
    activeListings?: number;
    pendingTransactions?: number;
  };
  charts?: {
    salesByDay?: Array<{ date: string; count: number; revenue: number }>;
    viewsByDay?: Array<{ date: string; count: number }>;
    topEvents?: Array<{ name: string; count: number }>;
  };
  insights?: string[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardType, setDashboardType] = useState("seller");
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboard();
    }
  }, [session, dashboardType, period]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/modules/analytics?type=${dashboardType}&period=${period}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result.dashboard);
      }
    } catch (error) {
      console.error("Erro ao buscar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1F33]">
        <Loader2 className="h-8 w-8 animate-spin text-[#16C784]" />
      </div>
    );
  }

  const isAdmin = session?.user?.isAdmin;

  return (
    <div className="min-h-screen bg-[#0B1F33] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="mt-1 text-gray-400">
              Acompanhe suas estatísticas e performance
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] border-[#1A3A5C] bg-[#0F2A44] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#1A3A5C] bg-[#0F2A44]">
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs
          value={dashboardType}
          onValueChange={setDashboardType}
          className="space-y-6"
        >
          <TabsList className="bg-[#0F2A44]">
            <TabsTrigger value="seller">Vendedor</TabsTrigger>
            <TabsTrigger value="buyer">Comprador</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#16C784]" />
            </div>
          ) : (
            <>
              <TabsContent value="seller" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total de Vendas"
                    value={data?.summary?.totalSales || 0}
                    icon={<ShoppingCart className="h-5 w-5" />}
                  />
                  <StatCard
                    title="Receita Total"
                    value={`R$ ${(data?.summary?.totalRevenue || 0).toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    highlight
                  />
                  <StatCard
                    title="Visualizações"
                    value={data?.summary?.totalViews || 0}
                    icon={<Eye className="h-5 w-5" />}
                  />
                  <StatCard
                    title="Taxa de Conversão"
                    value={`${(data?.summary?.conversionRate || 0).toFixed(1)}%`}
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="border-[#1A3A5C] bg-[#0F2A44]">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Ingressos Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-gray-500" />
                        <p className="mt-2 text-2xl font-bold text-white">
                          {data?.summary?.activeListings || 0}
                        </p>
                        <p className="text-gray-400">ingressos à venda</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-[#1A3A5C] bg-[#0F2A44]">
                    <CardHeader>
                      <CardTitle className="text-white">Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.insights && data.insights.length > 0 ? (
                        <ul className="space-y-2">
                          {data.insights.map((insight, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-gray-300"
                            >
                              <TrendingUp className="mt-0.5 h-4 w-4 text-[#16C784]" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-center text-gray-400 py-4">
                          Venda mais para receber insights personalizados
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="buyer" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total de Compras"
                    value={data?.summary?.totalPurchases || 0}
                    icon={<ShoppingCart className="h-5 w-5" />}
                  />
                  <StatCard
                    title="Total Gasto"
                    value={`R$ ${(data?.summary?.totalSpent || 0).toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    highlight
                  />
                  <StatCard
                    title="Eventos Visitados"
                    value={data?.charts?.topEvents?.length || 0}
                    icon={<Eye className="h-5 w-5" />}
                  />
                  <StatCard
                    title="Pendentes"
                    value={data?.summary?.pendingTransactions || 0}
                    icon={<AlertTriangle className="h-5 w-5" />}
                  />
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Total Transações"
                      value={
                        (data?.summary?.totalSales || 0) +
                        (data?.summary?.totalPurchases || 0)
                      }
                      icon={<ShoppingCart className="h-5 w-5" />}
                    />
                    <StatCard
                      title="Volume Total"
                      value={`R$ ${(data?.summary?.totalRevenue || 0).toFixed(2)}`}
                      icon={<DollarSign className="h-5 w-5" />}
                      highlight
                    />
                    <StatCard
                      title="Usuários Ativos"
                      value={0}
                      icon={<Users className="h-5 w-5" />}
                    />
                    <StatCard
                      title="Alertas"
                      value={0}
                      icon={<AlertTriangle className="h-5 w-5" />}
                    />
                  </div>
                </TabsContent>
              )}
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className="border-[#1A3A5C] bg-[#0F2A44]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{title}</span>
          <span className="text-gray-500">{icon}</span>
        </div>
        <p
          className={`mt-2 text-2xl font-bold ${
            highlight ? "text-[#16C784]" : "text-white"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
