"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function CuponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    minAmount: "",
    maxUses: "",
    validDays: "30",
  });

  const user = session?.user as ExtendedUser | undefined;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (user && !user.isAdmin) {
      router.push("/");
    }
  }, [status, user, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadCoupons();
    }
  }, [user]);

  const loadCoupons = async () => {
    try {
      const response = await fetch("/api/modules/coupons");
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Erro ao carregar cupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(formData.validDays));

    try {
      const response = await fetch("/api/modules/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: parseFloat(formData.value),
          minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          validFrom,
          validUntil,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ code: "", type: "percentage", value: "", minAmount: "", maxUses: "", validDays: "30" });
        loadCoupons();
      }
    } catch (error) {
      console.error("Erro ao criar cupom:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B1F33] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Cupons de Desconto</h1>
            <p className="text-gray-400">Gerencie cupons promocionais</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#16C784] hover:bg-[#14b576] text-white font-medium rounded-xl transition-colors"
          >
            {showForm ? "Cancelar" : "Novo Cupom"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={createCoupon} className="bg-[#0F2A44] rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Código</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="DESCONTO10"
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Valor {formData.type === "percentage" ? "(%)" : "(R$)"}
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="10"
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Valor Mínimo (opcional)</label>
                <input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="100"
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Máx. Usos (opcional)</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="100"
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Válido por (dias)</label>
                <input
                  type="number"
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-3 bg-[#16C784] hover:bg-[#14b576] text-white font-medium rounded-xl transition-colors"
            >
              Criar Cupom
            </button>
          </form>
        )}

        {coupons.length === 0 ? (
          <div className="bg-[#0F2A44] rounded-xl p-12 text-center">
            <p className="text-gray-400">Nenhum cupom criado ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-[#0F2A44] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-mono font-bold text-[#16C784]">{coupon.code}</p>
                    <p className="text-gray-400">
                      {coupon.type === "percentage" ? `${coupon.value}% de desconto` : `R$ ${coupon.value} de desconto`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      Usos: {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}
                    </p>
                    <p className={`text-sm ${coupon.isActive ? "text-green-400" : "text-red-400"}`}>
                      {coupon.isActive ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
