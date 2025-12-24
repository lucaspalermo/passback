"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import TicketCard from "@/components/TicketCard";
import Navbar from "@/components/Navbar";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Float,
  GradientText,
  SkeletonCard,
  HoverScale,
  ScaleIn,
} from "@/components/ui/motion";

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
        {/* Animated Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <Float duration={8} y={30}>
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#16C784]/10 rounded-full blur-3xl"></div>
          </Float>
          <Float duration={10} y={40}>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2DFF88]/10 rounded-full blur-3xl"></div>
          </Float>
          <Float duration={12} y={20}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#16C784]/5 rounded-full blur-3xl"></div>
          </Float>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <FadeIn direction="down" delay={0.1}>
              <motion.div
                className="inline-flex items-center gap-2 bg-[#16C784]/10 border border-[#16C784]/20 rounded-full px-4 py-2 mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full bg-[#16C784]"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[#16C784] text-sm font-medium">Plataforma Segura de Revenda</span>
              </motion.div>
            </FadeIn>

            {/* Title */}
            <FadeIn direction="up" delay={0.2}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Compre e venda ingressos com{" "}
                <GradientText>total segurança</GradientText>
              </h1>
            </FadeIn>

            {/* Subtitle */}
            <FadeIn direction="up" delay={0.3}>
              <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Pagamento protegido com escrow. Seu dinheiro só é liberado após a confirmação da entrada no evento.
              </p>
            </FadeIn>

            {/* Search */}
            <FadeIn direction="up" delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <motion.div
                  className="relative flex-1"
                  whileFocus={{ scale: 1.02 }}
                >
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
                    className="w-full pl-12 pr-4 py-4 bg-[#0F2A44] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784] focus:border-transparent transition-all duration-300"
                  />
                </motion.div>
                <motion.button
                  className="btn-gradient px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Buscar
                </motion.button>
              </div>
            </FadeIn>

            {/* Stats */}
            <StaggerContainer className="flex flex-wrap justify-center gap-8 mt-12">
              <StaggerItem>
                <ScaleIn>
                  <div className="text-center">
                    <motion.div
                      className="text-3xl font-bold text-white"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      100%
                    </motion.div>
                    <div className="text-gray-400 text-sm">Seguro</div>
                  </div>
                </ScaleIn>
              </StaggerItem>
              <StaggerItem>
                <ScaleIn delay={0.1}>
                  <div className="text-center">
                    <motion.div
                      className="text-3xl font-bold text-[#16C784]"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                    >
                      10%
                    </motion.div>
                    <div className="text-gray-400 text-sm">Taxa da plataforma</div>
                  </div>
                </ScaleIn>
              </StaggerItem>
              <StaggerItem>
                <ScaleIn delay={0.2}>
                  <div className="text-center">
                    <motion.div
                      className="text-3xl font-bold text-white"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    >
                      24h
                    </motion.div>
                    <div className="text-gray-400 text-sm">Suporte</div>
                  </div>
                </ScaleIn>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            <StaggerItem>
              <HoverScale>
                <div className="bg-[#0F2A44] border border-white/5 rounded-2xl p-6 h-full">
                  <motion.div
                    className="w-12 h-12 bg-[#16C784]/10 rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-6 h-6 text-[#16C784]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">Pagamento Protegido</h3>
                  <p className="text-gray-400 text-sm">
                    Seu dinheiro fica em custódia até você confirmar a entrada no evento.
                  </p>
                </div>
              </HoverScale>
            </StaggerItem>

            <StaggerItem>
              <HoverScale>
                <div className="bg-[#0F2A44] border border-white/5 rounded-2xl p-6 h-full">
                  <motion.div
                    className="w-12 h-12 bg-[#2DFF88]/10 rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-6 h-6 text-[#2DFF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">Contato Direto</h3>
                  <p className="text-gray-400 text-sm">
                    Após o pagamento, você recebe o WhatsApp do vendedor para combinar a entrega.
                  </p>
                </div>
              </HoverScale>
            </StaggerItem>

            <StaggerItem>
              <HoverScale>
                <div className="bg-[#0F2A44] border border-white/5 rounded-2xl p-6 h-full">
                  <motion.div
                    className="w-12 h-12 bg-[#FF8A00]/10 rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-6 h-6 text-[#FF8A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">Rápido e Fácil</h3>
                  <p className="text-gray-400 text-sm">
                    Compre ou venda seu ingresso em poucos minutos. Sem burocracia.
                  </p>
                </div>
              </HoverScale>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Tickets */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Ingressos Disponíveis</h2>
                <motion.p
                  className="text-gray-400 mt-1"
                  key={filteredTickets.length}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredTickets.length} {filteredTickets.length === 1 ? "ingresso encontrado" : "ingressos encontrados"}
                </motion.p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/ingressos/novo"
                  className="btn-gradient px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Vender Ingresso
                </Link>
              </motion.div>
            </div>
          </FadeIn>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <FadeIn direction="up">
              <div className="text-center py-20">
                <motion.div
                  className="w-24 h-24 bg-[#0F2A44] rounded-full flex items-center justify-center mx-auto mb-6"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum ingresso encontrado</h3>
                <p className="text-gray-400 mb-6">
                  {search
                    ? "Tente buscar por outro evento ou localização"
                    : "Seja o primeiro a anunciar um ingresso!"}
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/ingressos/novo"
                    className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Anunciar Ingresso
                  </Link>
                </motion.div>
              </div>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTickets.map((ticket, index) => (
                <StaggerItem key={ticket.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HoverScale scale={1.03}>
                      <TicketCard {...ticket} />
                    </HoverScale>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <motion.div
              className="bg-gradient-to-r from-[#0F2A44] to-[#1A3A5C] border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#16C784]/5 via-[#2DFF88]/10 to-[#16C784]/5"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ backgroundSize: "200% 200%" }}
              />

              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                  Quer vender seu ingresso?
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Anuncie gratuitamente e receba o pagamento de forma segura. Taxa de apenas 10% sobre a venda.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Link
                    href="/ingressos/novo"
                    className="inline-flex items-center gap-2 btn-gradient px-8 py-4 rounded-xl text-white font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Começar a Vender
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="w-8 h-8 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-lg flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <span className="text-white font-bold text-sm">P</span>
                </motion.div>
                <span className="text-white font-semibold">Passback</span>
              </motion.div>
              <p className="text-gray-500 text-sm">
                © 2024 Passback. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-6">
                {["Termos", "Privacidade", "Suporte"].map((item) => (
                  <motion.div key={item} whileHover={{ y: -2 }}>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                      {item}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
}
