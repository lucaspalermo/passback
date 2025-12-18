import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isAdmin) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    include: {
      tickets: { select: { id: true } },
      purchases: { select: { id: true, status: true } },
      sales: { select: { id: true, status: true } },
      reputation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao painel
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-[#16C784]/10 text-[#16C784] text-xs font-medium">ADMIN</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Usuarios</h1>
          <p className="text-gray-400 mt-1">{users.length} usuarios cadastrados</p>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {users.map((u) => {
            const completedPurchases = u.purchases.filter((p) => p.status === "released").length;
            const completedSales = u.sales.filter((s) => s.status === "released").length;

            return (
              <div
                key={u.id}
                className="bg-[#0F2A44] rounded-xl border border-white/5 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#16C784] to-[#2DFF88] flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{u.name}</p>
                        {u.isAdmin && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#16C784]/10 text-[#16C784]">
                            ADMIN
                          </span>
                        )}
                        {u.reputation?.isSuspicious && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#FF8A00]/10 text-[#FF8A00]">
                            SUSPEITO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{u.email}</p>
                      {u.phone && (
                        <p className="text-xs text-gray-500">{u.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4">
                    <div className="text-center px-4">
                      <p className="text-xs text-gray-500">Ingressos</p>
                      <p className="text-lg font-bold text-[#FF8A00]">{u.tickets.length}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-gray-500">Compras</p>
                      <p className="text-lg font-bold text-blue-400">{completedPurchases}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-gray-500">Vendas</p>
                      <p className="text-lg font-bold text-[#16C784]">{completedSales}</p>
                    </div>
                    {u.reputation && (
                      <div className="text-center px-4">
                        <p className="text-xs text-gray-500">Trust Score</p>
                        <p className={`text-lg font-bold ${u.reputation.trustScore < 70 ? "text-red-400" : "text-[#16C784]"}`}>
                          {u.reputation.trustScore}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extra Info */}
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {u.cpf && (
                    <div>
                      <p className="text-gray-500 text-xs">CPF</p>
                      <p className="text-gray-300">{u.cpf}</p>
                    </div>
                  )}
                  {u.pixKey && (
                    <div>
                      <p className="text-gray-500 text-xs">Chave PIX</p>
                      <p className="text-[#16C784]">{u.pixKey}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-xs">Cadastrado em</p>
                    <p className="text-gray-300">{formatDate(u.createdAt)}</p>
                  </div>
                  {u.reputation && (
                    <div>
                      <p className="text-gray-500 text-xs">Disputas</p>
                      <p className="text-gray-300">
                        Abertas: {u.reputation.disputesOpened} | Perdidas: {u.reputation.disputesLost}
                      </p>
                    </div>
                  )}
                </div>

                {/* User ID */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-600">ID: {u.id}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
