"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Verification {
  id: string;
  status: "pending" | "approved" | "rejected";
  documentType: string;
  rejectionReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export default function VerificacaoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "rg",
    documentUrl: "",
    selfieUrl: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadVerification();
    }
  }, [session]);

  const loadVerification = async () => {
    try {
      const response = await fetch("/api/modules/verification");
      const data = await response.json();
      setVerification(data.verification);
    } catch (error) {
      console.error("Erro ao carregar verificação:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/modules/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar verificação");
        return;
      }

      setVerification(data.verification);
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao enviar verificação:", error);
      setError("Erro ao enviar verificação");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!verification) return null;

    const statusConfig = {
      pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        label: "Em análise",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      approved: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        label: "Verificado",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        label: "Rejeitado",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    };

    const config = statusConfig[verification.status];

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text}`}>
        {config.icon}
        <span className="font-medium">{config.label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Verificação de Identidade</h1>
        <p className="text-gray-400 mb-8">
          Verifique sua identidade para aumentar a confiança na plataforma
        </p>

        {showForm ? (
          <div className="bg-[#0F2A44] rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-6">
              Enviar documentos
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de documento</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="rg">RG</option>
                  <option value="cnh">CNH</option>
                  <option value="passport">Passaporte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">URL da foto do documento</label>
                <input
                  type="url"
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Faça upload da imagem em um serviço como Imgur e cole a URL aqui
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">URL da selfie com documento</label>
                <input
                  type="url"
                  value={formData.selfieUrl}
                  onChange={(e) => setFormData({ ...formData, selfieUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tire uma selfie segurando o documento ao lado do rosto
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 bg-[#1A3A5C] hover:bg-[#1A3A5C]/80 text-white font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {submitting ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status atual */}
            <div className="bg-[#0F2A44] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Status da verificação</h3>
                {getStatusBadge()}
              </div>

              {!verification && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-[#1A3A5C] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-4">Você ainda não verificou sua identidade</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-[#16C784] hover:bg-[#14b576] text-white font-medium rounded-xl transition-colors"
                  >
                    Iniciar verificação
                  </button>
                </div>
              )}

              {verification?.status === "pending" && (
                <div className="text-center py-4">
                  <p className="text-gray-400">
                    Sua verificação está sendo analisada. Isso pode levar até 24 horas.
                  </p>
                </div>
              )}

              {verification?.status === "approved" && (
                <div className="text-center py-4">
                  <p className="text-gray-400">
                    Sua identidade foi verificada em{" "}
                    {new Date(verification.verifiedAt!).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}

              {verification?.status === "rejected" && (
                <div className="py-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <p className="text-red-400 font-medium mb-1">Motivo da rejeição:</p>
                    <p className="text-gray-400">{verification.rejectionReason}</p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-6 py-3 bg-[#16C784] hover:bg-[#14b576] text-white font-medium rounded-xl transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>

            {/* Benefícios */}
            <div className="bg-[#0F2A44] rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Por que verificar?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Mais confiança</p>
                    <p className="text-sm text-gray-400">
                      Compradores preferem vendedores verificados
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Selo de verificado</p>
                    <p className="text-sm text-gray-400">
                      Seu perfil exibe um selo de identidade verificada
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Proteção contra fraudes</p>
                    <p className="text-sm text-gray-400">
                      Ajuda a manter a plataforma segura para todos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
