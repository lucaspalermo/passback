"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TicketCard from "@/components/TicketCard";
import Navbar from "@/components/Navbar";

interface Ticket {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl?: string;
  seller?: {
    name: string;
  };
}

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets?status=available");
      if (response.ok) {
        const data = await response.json();
        // Garante que data é um array
        setTickets(Array.isArray(data) ? data : data.tickets || []);
      }
    } catch (error) {
      console.error("Erro ao buscar ingressos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = (tickets || []).filter(
    (ticket) =>
      ticket.eventName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.eventLocation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#16C784]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2DFF88]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#16C784]/10 border border-[#16C784]/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse"></span>
              <span className="text-[#16C784] text-sm font-medium">Plataforma Segura de Revenda</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Compre e venda ingressos com{" "}
              <span className="text-gradient">total segurança</span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Pagamento protegido com escrow. Seu dinheiro só é liberado após a confirmação da entrada no evento.
            </p>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar evento, show ou festival..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#0F2A44] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784] focus:border-transparent transition-all"
                />
              </div>
              <button className="btn-gradient px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-gray-400 text-sm">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#16C784]">10%</div>
                <div className="text-gray-400 text-sm">Taxa da plataforma</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24h</div>
                <div className="text-gray-400 text-sm">Suporte</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#0F2A44] border border-white/5 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 bg-[#16C784]/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#16C784]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Pagamento Protegido</h3>
              <p className="text-gray-400 text-sm">
                Seu dinheiro fica em custódia até você confirmar a entrada no evento.
              </p>
            </div>

            <div className="bg-[#0F2A44] border border-white/5 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 bg-[#2DFF88]/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#2DFF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Contato Direto</h3>
              <p className="text-gray-400 text-sm">
                Após o pagamento, você recebe o WhatsApp do vendedor para combinar a entrega.
              </p>
            </div>

            <div className="bg-[#0F2A44] border border-white/5 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 bg-[#FF8A00]/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#FF8A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Rápido e Fácil</h3>
              <p className="text-gray-400 text-sm">
                Compre ou venda seu ingresso em poucos minutos. Sem burocracia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tickets */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Ingressos Disponíveis</h2>
              <p className="text-gray-400 mt-1">
                {filteredTickets.length} {filteredTickets.length === 1 ? "ingresso encontrado" : "ingressos encontrados"}
              </p>
            </div>
            <Link
              href="/ingressos/novo"
              className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Vender Ingresso
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#0F2A44] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-[#1A3A5C]"></div>
                  <div className="p-5">
                    <div className="h-5 bg-[#1A3A5C] rounded mb-3"></div>
                    <div className="h-4 bg-[#1A3A5C] rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-[#1A3A5C] rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-[#0F2A44] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum ingresso encontrado</h3>
              <p className="text-gray-400 mb-6">
                {search
                  ? "Tente buscar por outro evento ou localização"
                  : "Seja o primeiro a anunciar um ingresso!"}
              </p>
              <Link
                href="/ingressos/novo"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Anunciar Ingresso
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} {...ticket} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-[#0F2A44] to-[#1A3A5C] border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Quer vender seu ingresso?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Anuncie gratuitamente e receba o pagamento de forma segura. Taxa de apenas 10% sobre a venda.
            </p>
            <Link
              href="/ingressos/novo"
              className="inline-flex items-center gap-2 btn-gradient px-8 py-4 rounded-xl text-white font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Começar a Vender
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-white font-semibold">Passback</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 Passback. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Termos
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
