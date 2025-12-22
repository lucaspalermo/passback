"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  pixKey: string | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  proofUrl: string | null;
  notes: string | null;
  user: User;
}

interface Stats {
  pending: { _count: { id: number }; _sum: { amount: number | null } };
  processing: { _count: { id: number }; _sum: { amount: number | null } };
  completed: { _count: { id: number }; _sum: { amount: number | null } };
  rejected: { _count: { id: number }; _sum: { amount: number | null } };
}

export default function AdminSaquesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadWithdrawals();
    }
  }, [session, filter]);

  const loadWithdrawals = async () => {
    try {
      const response = await fetch(`/api/admin/withdrawals?status=${filter}`);
      const data = await response.json();

      if (response.ok) {
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar saques:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "process" | "complete" | "reject") => {
    if (!selectedWithdrawal) return;

    if (action === "reject" && !rejectionReason) {
      alert("Informe o motivo da rejeicao");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: actionNotes,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setSelectedWithdrawal(null);
        setActionNotes("");
        setRejectionReason("");
        loadWithdrawals();
      } else {
        alert(data.error || "Erro ao processar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      processing: "bg-blue-500/20 text-blue-400",
      completed: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      completed: "Concluido",
      rejected: "Rejeitado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado!");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Gerenciar Saques</h1>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-[#0F2A44] hover:bg-[#1A3A5C] text-white rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>

        {/* Estatisticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0F2A44] rounded-xl p-4">
              <p className="text-sm text-yellow-400">Pendentes</p>
              <p className="text-2xl font-bold text-white">{stats.pending._count?.id || 0}</p>
              <p className="text-sm text-gray-400">
                {formatCurrency(stats.pending._sum?.amount || 0)}
              </p>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4">
              <p className="text-sm text-blue-400">Processando</p>
              <p className="text-2xl font-bold text-white">{stats.processing._count?.id || 0}</p>
              <p className="text-sm text-gray-400">
                {formatCurrency(stats.processing._sum?.amount || 0)}
              </p>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4">
              <p className="text-sm text-green-400">Concluidos</p>
              <p className="text-2xl font-bold text-white">{stats.completed._count?.id || 0}</p>
              <p className="text-sm text-gray-400">
                {formatCurrency(stats.completed._sum?.amount || 0)}
              </p>
            </div>
            <div className="bg-[#0F2A44] rounded-xl p-4">
              <p className="text-sm text-red-400">Rejeitados</p>
              <p className="text-2xl font-bold text-white">{stats.rejected._count?.id || 0}</p>
              <p className="text-sm text-gray-400">
                {formatCurrency(stats.rejected._sum?.amount || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {["pending", "processing", "completed", "rejected", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === f
                  ? "bg-[#16C784] text-white"
                  : "bg-[#0F2A44] text-gray-300 hover:bg-[#1A3A5C]"
              }`}
            >
              {f === "pending" && "Pendentes"}
              {f === "processing" && "Processando"}
              {f === "completed" && "Concluidos"}
              {f === "rejected" && "Rejeitados"}
              {f === "all" && "Todos"}
            </button>
          ))}
        </div>

        {/* Lista de Saques */}
        <div className="bg-[#0F2A44] rounded-xl overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum saque encontrado
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedWithdrawal(w)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(w.amount)}
                        </p>
                        {getStatusBadge(w.status)}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {w.user.name} ({w.user.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        PIX ({w.pixKeyType}): {w.pixKey}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Solicitado: {formatDate(w.requestedAt)}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F2A44] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Detalhes do Saque</h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Valor */}
              <div className="text-center p-4 bg-[#1A3A5C] rounded-lg">
                <p className="text-3xl font-bold text-green-400">
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
                <div className="mt-2">{getStatusBadge(selectedWithdrawal.status)}</div>
              </div>

              {/* Dados do Usuario */}
              <div className="bg-[#1A3A5C] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Vendedor</h4>
                <p className="text-white">{selectedWithdrawal.user.name}</p>
                <p className="text-sm text-gray-400">{selectedWithdrawal.user.email}</p>
                {selectedWithdrawal.user.phone && (
                  <p className="text-sm text-gray-400">{selectedWithdrawal.user.phone}</p>
                )}
                {selectedWithdrawal.user.cpf && (
                  <p className="text-sm text-gray-400">CPF: {selectedWithdrawal.user.cpf}</p>
                )}
              </div>

              {/* Chave PIX */}
              <div className="bg-[#1A3A5C] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Chave PIX</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{selectedWithdrawal.pixKeyType}</p>
                    <p className="text-white font-mono">{selectedWithdrawal.pixKey}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedWithdrawal.pixKey)}
                    className="px-3 py-1 bg-[#16C784] text-white text-sm rounded-lg hover:bg-[#14b576]"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Datas */}
              <div className="bg-[#1A3A5C] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Timeline</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    Solicitado: <span className="text-white">{formatDate(selectedWithdrawal.requestedAt)}</span>
                  </p>
                  {selectedWithdrawal.processedAt && (
                    <p className="text-gray-400">
                      Processado: <span className="text-white">{formatDate(selectedWithdrawal.processedAt)}</span>
                    </p>
                  )}
                  {selectedWithdrawal.completedAt && (
                    <p className="text-gray-400">
                      Concluido: <span className="text-white">{formatDate(selectedWithdrawal.completedAt)}</span>
                    </p>
                  )}
                  {selectedWithdrawal.rejectedAt && (
                    <p className="text-gray-400">
                      Rejeitado: <span className="text-white">{formatDate(selectedWithdrawal.rejectedAt)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Motivo da rejeicao */}
              {selectedWithdrawal.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-400 mb-1">Motivo da Rejeicao</h4>
                  <p className="text-white">{selectedWithdrawal.rejectionReason}</p>
                </div>
              )}

              {/* Acoes */}
              {(selectedWithdrawal.status === "pending" || selectedWithdrawal.status === "processing") && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Observacoes (opcional)</label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="w-full bg-[#1A3A5C] border border-white/10 rounded-lg px-4 py-2 text-white resize-none"
                      rows={2}
                    />
                  </div>

                  {selectedWithdrawal.status === "pending" && (
                    <button
                      onClick={() => handleAction("process")}
                      disabled={processing}
                      className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
                    >
                      {processing ? "Processando..." : "Marcar como Processando"}
                    </button>
                  )}

                  {selectedWithdrawal.status === "processing" && (
                    <button
                      onClick={() => handleAction("complete")}
                      disabled={processing}
                      className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium"
                    >
                      {processing ? "Processando..." : "Confirmar Deposito Realizado"}
                    </button>
                  )}

                  <div className="border-t border-white/10 pt-3">
                    <div className="mb-2">
                      <label className="block text-sm text-gray-400 mb-1">Motivo da rejeicao</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ex: Chave PIX invalida"
                        className="w-full bg-[#1A3A5C] border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <button
                      onClick={() => handleAction("reject")}
                      disabled={processing}
                      className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium"
                    >
                      {processing ? "Processando..." : "Rejeitar Saque"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
