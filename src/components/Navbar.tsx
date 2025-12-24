"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = (session?.user as ExtendedUser)?.isAdmin;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 }
    })
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B1F33]/98 backdrop-blur-lg shadow-lg shadow-black/10"
          : "bg-[#0B1F33]/95 backdrop-blur-md"
      } border-b border-white/5`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
            <motion.div
              className="w-9 h-9 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-lg flex items-center justify-center shadow-lg shadow-[#16C784]/20"
              whileHover={{
                scale: 1.1,
                rotate: 5,
                boxShadow: "0 0 20px rgba(22, 199, 132, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="text-white font-bold text-lg">P</span>
            </motion.div>
            <motion.span
              className="text-white font-bold text-xl hidden sm:block"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Passback
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {!isAdmin && (
              <>
                {[
                  { href: "/", label: "Explorar" },
                  { href: "/ingressos/novo", label: "Vender" },
                ].map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative group"
                    >
                      {item.label}
                      <motion.span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#16C784] rounded-full group-hover:w-1/2"
                        transition={{ duration: 0.2 }}
                      />
                    </Link>
                  </motion.div>
                ))}
                {status === "authenticated" && (
                  <>
                    {[
                      { href: "/meus-ingressos", label: "Meus Ingressos" },
                      { href: "/minhas-compras", label: "Minhas Compras" },
                      { href: "/favoritos", label: "Favoritos", icon: (
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )},
                      { href: "/mensagens", label: "Mensagens", icon: (
                        <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )},
                      { href: "/ofertas", label: "Ofertas", icon: (
                        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      )},
                      { href: "/perfil", label: "Meu Perfil" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                  </>
                )}
              </>
            )}
            {isAdmin && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-[#16C784] hover:text-[#2DFF88] hover:bg-[#16C784]/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Painel Admin
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    href="/cupons"
                    className="px-4 py-2 text-[#FF8A00] hover:text-orange-300 hover:bg-[#FF8A00]/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Cupons
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <motion.div
                className="w-8 h-8 bg-[#1A3A5C] rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : status === "authenticated" ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <motion.button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-full flex items-center justify-center shadow-lg shadow-[#16C784]/20"
                      animate={isMenuOpen ? { scale: 1.1 } : { scale: 1 }}
                    >
                      <span className="text-white font-medium text-sm">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </motion.div>
                    <motion.svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: isMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </motion.button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-56 bg-[#0F2A44] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium text-sm">{session.user?.name}</p>
                            {isAdmin && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs bg-[#16C784]/20 text-[#16C784] px-2 py-0.5 rounded-full"
                              >
                                ADMIN
                              </motion.span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs truncate">{session.user?.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          {isAdmin ? (
                            <>
                              {[
                                { href: "/admin", label: "Painel Admin", icon: "shield" },
                                { href: "/cupons", label: "Cupons", icon: "tag", color: "text-[#FF8A00]" },
                              ].map((item, i) => (
                                <motion.div
                                  key={item.href}
                                  custom={i}
                                  variants={menuItemVariants}
                                  initial="hidden"
                                  animate="visible"
                                >
                                  <Link
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 ${item.color || "text-gray-300"} hover:text-white hover:bg-white/5 rounded-lg transition-colors`}
                                  >
                                    {item.label}
                                  </Link>
                                </motion.div>
                              ))}
                            </>
                          ) : (
                            <>
                              {[
                                { href: "/meus-ingressos", label: "Meus Ingressos" },
                                { href: "/minhas-compras", label: "Minhas Compras" },
                                { href: "/minhas-vendas", label: "Minhas Vendas" },
                                { href: "/carteira", label: "Carteira", color: "text-green-400" },
                                { href: "/favoritos", label: "Favoritos" },
                                { href: "/mensagens", label: "Mensagens" },
                                { href: "/ofertas", label: "Ofertas" },
                                { href: "/perfil", label: "Meu Perfil" },
                              ].map((item, i) => (
                                <motion.div
                                  key={item.href}
                                  custom={i}
                                  variants={menuItemVariants}
                                  initial="hidden"
                                  animate="visible"
                                >
                                  <Link
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 ${item.color || "text-gray-300"} hover:text-white hover:bg-white/5 rounded-lg transition-colors`}
                                  >
                                    {item.label}
                                  </Link>
                                </motion.div>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Logout */}
                        <motion.div
                          className="p-2 border-t border-white/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              signOut({ callbackUrl: "/login" });
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair da conta
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Logout Button - Desktop */}
                <motion.button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Sair</span>
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Entrar
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/cadastro"
                    className="btn-gradient px-4 py-2 rounded-lg text-white font-medium"
                  >
                    Cadastrar
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.path
                      key="close"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      exit={{ pathLength: 0 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <motion.path
                      key="menu"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      exit={{ pathLength: 0 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </AnimatePresence>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
