"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface VerificationStatus {
  verifications: {
    email: boolean;
    cpf: boolean;
    phone: boolean;
    identity: boolean;
  };
  verificationLevel: number;
  maxLevel: number;
  badge: "none" | "basic" | "verified" | "trusted";
  details: {
    email: { verified: boolean; masked: string };
    cpf: { verified: boolean; hasCpf: boolean; validatedName: string | null; masked: string | null };
    phone: { verified: boolean; hasPhone: boolean; masked: string | null };
    identity: { verified: boolean };
  };
}

export default function VerificacaoPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"email" | "cpf" | "phone" | null>(null);

  // Email verification state
  const [emailCode, setEmailCode] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // CPF verification state
  const [cpf, setCpf] = useState("");
  const [cpfVerifying, setCpfVerifying] = useState(false);

  // Phone verification state
  const [phone, setPhone] = useState("");
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (session?.user) {
      loadStatus();
    }
  }, [session]);

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/modules/verification/status");
      const data = await response.json();
      if (response.ok) {
        setVerificationStatus(data);
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async () => {
    setEmailSending(true);
    setError("");
    try {
      const response = await fetch("/api/modules/verification/email", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }
      setEmailSent(true);
      setSuccess("Codigo enviado para seu email!");
    } catch {
      setError("Erro ao enviar codigo");
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailCode = async () => {
    if (emailCode.length !== 6) {
      setError("Digite o codigo de 6 digitos");
      return;
    }
    setEmailVerifying(true);
    setError("");
    try {
      const response = await fetch("/api/modules/verification/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }
      setSuccess("Email verificado com sucesso!");
      setActiveTab(null);
      loadStatus();
    } catch {
      setError("Erro ao verificar codigo");
    } finally {
      setEmailVerifying(false);
    }
  };

  const verifyCpf = async () => {
    if (cpf.replace(/\D/g, "").length !== 11) {
      setError("CPF deve ter 11 digitos");
      return;
    }
    setCpfVerifying(true);
    setError("");
    try {
      const response = await fetch("/api/modules/verification/cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.validatedName ? `CPF validado! Nome: ${data.validatedName}` : "CPF validado!");
      setActiveTab(null);
      loadStatus();
    } catch {
      setError("Erro ao validar CPF");
    } finally {
      setCpfVerifying(false);
    }
  };

  const verifyPhone = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setError("Telefone invalido");
      return;
    }
    setPhoneVerifying(true);
    setError("");
    try {
      const response = await fetch("/api/modules/verification/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }
      setSuccess("Telefone validado!");
      setActiveTab(null);
      loadStatus();
    } catch {
      setError("Erro ao validar telefone");
    } finally {
      setPhoneVerifying(false);
    }
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "trusted": return "bg-[#16C784] text-white";
      case "verified": return "bg-blue-500 text-white";
      case "basic": return "bg-yellow-500 text-black";
      default: return "bg-gray-500 text-white";
    }
  };

  const getBadgeLabel = (badge: string) => {
    switch (badge) {
      case "trusted": return "Confiavel";
      case "verified": return "Verificado";
      case "basic": return "Basico";
      default: return "Nao verificado";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Verificacao de Conta</h1>
        <p className="text-gray-400 mb-8">
          Verifique seus dados para aumentar sua confiabilidade na plataforma
        </p>

        {/* Badge atual */}
        {verificationStatus && (
          <div className="bg-[#0F2A44] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Seu nivel de verificacao</p>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(verificationStatus.badge)}`}>
                    {getBadgeLabel(verificationStatus.badge)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {verificationStatus.verificationLevel}/{verificationStatus.maxLevel} verificacoes
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-[#1A3A5C] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#16C784]">
                  {Math.round((verificationStatus.verificationLevel / verificationStatus.maxLevel) * 100)}%
                </span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-4 h-2 bg-[#1A3A5C] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#16C784] to-[#2DFF88] transition-all duration-500"
                style={{ width: `${(verificationStatus.verificationLevel / verificationStatus.maxLevel) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
            {success}
          </div>
        )}

        {/* Cards de verificacao */}
        <div className="space-y-4">
          {/* Email */}
          <div className="bg-[#0F2A44] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  verificationStatus?.verifications.email ? "bg-[#16C784]/20" : "bg-[#1A3A5C]"
                }`}>
                  <svg className={`w-6 h-6 ${verificationStatus?.verifications.email ? "text-[#16C784]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">Email</p>
                  <p className="text-sm text-gray-400">{verificationStatus?.details.email.masked}</p>
                </div>
              </div>
              {verificationStatus?.verifications.email ? (
                <span className="px-3 py-1 bg-[#16C784]/20 text-[#16C784] rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verificado
                </span>
              ) : (
                <button
                  onClick={() => { setActiveTab(activeTab === "email" ? null : "email"); setError(""); setSuccess(""); }}
                  className="px-4 py-2 bg-[#16C784] hover:bg-[#14b576] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Verificar
                </button>
              )}
            </div>

            {activeTab === "email" && (
              <div className="mt-4 pt-4 border-t border-white/10">
                {!emailSent ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Enviaremos um codigo de 6 digitos para seu email.
                    </p>
                    <button
                      onClick={sendEmailCode}
                      disabled={emailSending}
                      className="w-full py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                    >
                      {emailSending ? "Enviando..." : "Enviar codigo"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Digite o codigo enviado para seu email:
                    </p>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={sendEmailCode}
                        disabled={emailSending}
                        className="flex-1 py-3 bg-[#1A3A5C] hover:bg-[#1A3A5C]/80 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                      >
                        Reenviar
                      </button>
                      <button
                        onClick={verifyEmailCode}
                        disabled={emailVerifying || emailCode.length !== 6}
                        className="flex-1 py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                      >
                        {emailVerifying ? "Verificando..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CPF */}
          <div className="bg-[#0F2A44] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  verificationStatus?.verifications.cpf ? "bg-[#16C784]/20" : "bg-[#1A3A5C]"
                }`}>
                  <svg className={`w-6 h-6 ${verificationStatus?.verifications.cpf ? "text-[#16C784]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">CPF</p>
                  <p className="text-sm text-gray-400">
                    {verificationStatus?.details.cpf.verified
                      ? verificationStatus.details.cpf.masked
                      : "Nao verificado"}
                  </p>
                  {verificationStatus?.details.cpf.validatedName && (
                    <p className="text-xs text-[#16C784]">
                      {verificationStatus.details.cpf.validatedName}
                    </p>
                  )}
                </div>
              </div>
              {verificationStatus?.verifications.cpf ? (
                <span className="px-3 py-1 bg-[#16C784]/20 text-[#16C784] rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verificado
                </span>
              ) : (
                <button
                  onClick={() => { setActiveTab(activeTab === "cpf" ? null : "cpf"); setError(""); setSuccess(""); }}
                  className="px-4 py-2 bg-[#16C784] hover:bg-[#14b576] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Verificar
                </button>
              )}
            </div>

            {activeTab === "cpf" && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                <p className="text-sm text-gray-400">
                  Digite seu CPF para validacao:
                </p>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  maxLength={14}
                />
                <button
                  onClick={verifyCpf}
                  disabled={cpfVerifying || cpf.replace(/\D/g, "").length !== 11}
                  className="w-full py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {cpfVerifying ? "Validando..." : "Validar CPF"}
                </button>
              </div>
            )}
          </div>

          {/* Telefone */}
          <div className="bg-[#0F2A44] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  verificationStatus?.verifications.phone ? "bg-[#16C784]/20" : "bg-[#1A3A5C]"
                }`}>
                  <svg className={`w-6 h-6 ${verificationStatus?.verifications.phone ? "text-[#16C784]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">Telefone</p>
                  <p className="text-sm text-gray-400">
                    {verificationStatus?.details.phone.verified
                      ? verificationStatus.details.phone.masked
                      : "Nao verificado"}
                  </p>
                </div>
              </div>
              {verificationStatus?.verifications.phone ? (
                <span className="px-3 py-1 bg-[#16C784]/20 text-[#16C784] rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verificado
                </span>
              ) : (
                <button
                  onClick={() => { setActiveTab(activeTab === "phone" ? null : "phone"); setError(""); setSuccess(""); }}
                  className="px-4 py-2 bg-[#16C784] hover:bg-[#14b576] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Verificar
                </button>
              )}
            </div>

            {activeTab === "phone" && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                <p className="text-sm text-gray-400">
                  Digite seu telefone com DDD:
                </p>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 90000-0000"
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  maxLength={15}
                />
                <button
                  onClick={verifyPhone}
                  disabled={phoneVerifying || phone.replace(/\D/g, "").length < 10}
                  className="w-full py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {phoneVerifying ? "Validando..." : "Validar Telefone"}
                </button>
              </div>
            )}
          </div>

          {/* Identidade (documento) - opcional */}
          <div className="bg-[#0F2A44] rounded-xl p-6 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1A3A5C] flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">Documento com foto</p>
                  <p className="text-sm text-gray-400">Em breve</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">
                Opcional
              </span>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="mt-8 bg-[#0F2A44] rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Beneficios da verificacao
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Mais confianca</p>
                <p className="text-sm text-gray-400">
                  Usuarios verificados transmitem mais seguranca
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Mais vendas</p>
                <p className="text-sm text-gray-400">
                  Compradores preferem vendedores verificados
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Protecao</p>
                <p className="text-sm text-gray-400">
                  Disputas sao analisadas com mais contexto
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16C784]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Selo exclusivo</p>
                <p className="text-sm text-gray-400">
                  Badge de verificado no seu perfil
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
