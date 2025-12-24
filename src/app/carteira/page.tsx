"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingAutoRelease: number;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  pixKey: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  rejectionReason: string | null;
}

interface PendingRelease {
  id: string;
  amount: number;
  eventName: string;
  hoursRemaining: number;
}

export default function CarteiraPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingReleases, setPendingReleases] = useState<PendingRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadWallet();
    }
  }, [session]);

  const loadWallet = async () => {
    try {
      const response = await fetch("/api/modules/wallet");
      const data = await response.json();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
      setWithdrawals(data.withdrawals || []);
      setPendingReleases(data.pendingReleases || []);
    } catch (error) {
      console.error("Erro ao carregar carteira:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/modules/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          pixKey,
          pixKeyType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao solicitar saque");
        return;
      }

      setSuccess("Saque solicitado com sucesso! Aguarde a confirmacao.");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setPixKey("");
      loadWallet();
    } catch {
      setError("Erro ao solicitar saque");
    } finally {
      setWithdrawing(false);
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33]">
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <motion.div
            className="w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#0B1F33]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-2xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Minha Carteira
          </motion.h1>

          {/* Mensagens */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 overflow-hidden"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards de Saldo */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Saldo Disponivel */}
            <motion.div
              className="bg-[#0F2A44] rounded-xl p-6 border border-white/5"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-400">Disponivel para saque</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(wallet?.availableBalance || 0)}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!wallet?.availableBalance || wallet.availableBalance < 5}
                className="w-full mt-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Solicitar Saque
              </motion.button>
            </motion.div>

            {/* Saldo Pendente */}
            <motion.div
              className="bg-[#0F2A44] rounded-xl p-6 border border-white/5"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-400">Pendente (aguardando liberacao)</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(wallet?.pendingBalance || 0)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Liberado apos confirmacao do comprador ou 24h
              </p>
            </motion.div>

            {/* Total Ganho */}
            <motion.div
              className="bg-[#0F2A44] rounded-xl p-6 border border-white/5"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.4 }}
                >
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-sm text-gray-400">Total ganho</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatCurrency(wallet?.totalEarned || 0)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Sacado: {formatCurrency(wallet?.totalWithdrawn || 0)}
              </p>
            </motion.div>
          </motion.div>

          {/* Vendas Aguardando Liberacao */}
          <AnimatePresence>
            {pendingReleases.length > 0 && (
              <motion.div
                className="bg-[#0F2A44] rounded-xl p-6 mb-8 border border-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-white mb-4">Aguardando Liberacao</h2>
                <div className="space-y-3">
                  {pendingReleases.map((release, index) => (
                    <motion.div
                      key={release.id}
                      className="flex items-center justify-between p-3 bg-[#1A3A5C] rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ x: 4 }}
                    >
                      <div>
                        <p className="text-white font-medium">{release.eventName}</p>
                        <p className="text-sm text-gray-400">
                          Libera em {Math.ceil(release.hoursRemaining)}h
                        </p>
                      </div>
                      <p className="text-yellow-400 font-semibold">
                        {formatCurrency(release.amount)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Historico de Saques */}
          <motion.div
            className="bg-[#0F2A44] rounded-xl p-6 mb-8 border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Historico de Saques</h2>
            {withdrawals.length === 0 ? (
              <motion.p
                className="text-gray-500 text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Nenhum saque realizado
              </motion.p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w, index) => (
                  <motion.div
                    key={w.id}
                    className="flex items-center justify-between p-3 bg-[#1A3A5C] rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ x: 4 }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{formatCurrency(w.amount)}</p>
                        {getStatusBadge(w.status)}
                      </div>
                      <p className="text-sm text-gray-400">
                        PIX: {w.pixKey}
                      </p>
                      <p className="text-xs text-gray-500">
                        Solicitado em {formatDate(w.requestedAt)}
                      </p>
                      {w.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1">
                          Motivo: {w.rejectionReason}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Movimentacoes */}
          <motion.div
            className="bg-[#0F2A44] rounded-xl p-6 border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Movimentacoes</h2>
            {transactions.length === 0 ? (
              <motion.p
                className="text-gray-500 text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Nenhuma movimentacao
              </motion.p>
            ) : (
              <div className="space-y-2">
                {transactions.map((t, index) => (
                  <motion.div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-[#1A3A5C] rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ x: 4 }}
                  >
                    <div>
                      <p className="text-white text-sm">{t.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(t.createdAt)}</p>
                    </div>
                    <p className={`font-semibold ${t.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {t.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(t.amount))}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal de Saque */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              className="bg-[#0F2A44] rounded-xl p-6 w-full max-w-md border border-white/10"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Solicitar Saque</h3>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm text-gray-400 mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    min="5"
                    max={wallet?.availableBalance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#1A3A5C] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponivel: {formatCurrency(wallet?.availableBalance || 0)} | Minimo: R$ 5,00
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm text-gray-400 mb-1">Tipo de Chave PIX</label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value)}
                    className="w-full bg-[#1A3A5C] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                  >
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatoria</option>
                  </select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm text-gray-400 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Digite sua chave PIX"
                    className="w-full bg-[#1A3A5C] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                    required
                  />
                </motion.div>

                <motion.div
                  className="flex gap-3 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={withdrawing}
                    className="flex-1 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {withdrawing ? "Processando..." : "Solicitar"}
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
