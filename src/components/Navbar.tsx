"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = (session?.user as ExtendedUser)?.isAdmin;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1F33]/95 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-lg flex items-center justify-center shadow-lg shadow-[#16C784]/20 group-hover:shadow-[#16C784]/40 transition-shadow">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">Passback</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {!isAdmin && (
              <>
                <Link
                  href="/"
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Explorar
                </Link>
                <Link
                  href="/ingressos/novo"
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Vender
                </Link>
                {status === "authenticated" && (
                  <>
                    <Link
                      href="/meus-ingressos"
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Meus Ingressos
                    </Link>
                    <Link
                      href="/minhas-compras"
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Minhas Compras
                    </Link>
                    <Link
                      href="/favoritos"
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Favoritos
                    </Link>
                    <Link
                      href="/mensagens"
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Mensagens
                    </Link>
                    <Link
                      href="/ofertas"
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Ofertas
                    </Link>
                    <Link
                      href="/perfil"
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Meu Perfil
                    </Link>
                  </>
                )}
              </>
            )}
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="px-4 py-2 text-[#16C784] hover:text-[#2DFF88] hover:bg-[#16C784]/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Painel Admin
                </Link>
                <Link
                  href="/cupons"
                  className="px-4 py-2 text-[#FF8A00] hover:text-orange-300 hover:bg-[#FF8A00]/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Cupons
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 bg-[#1A3A5C] rounded-full animate-pulse"></div>
            ) : status === "authenticated" ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-full flex items-center justify-center shadow-lg shadow-[#16C784]/20">
                      <span className="text-white font-medium text-sm">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                {/* Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0F2A44] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{session.user?.name}</p>
                        {isAdmin && (
                          <span className="text-xs bg-[#16C784]/20 text-[#16C784] px-2 py-0.5 rounded-full">ADMIN</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs truncate">{session.user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {isAdmin ? (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Painel Admin
                          </Link>
                          <Link
                            href="/cupons"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-[#FF8A00] hover:text-orange-300 hover:bg-[#FF8A00]/10 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Cupons
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/meus-ingressos"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            Meus Ingressos
                          </Link>
                          <Link
                            href="/minhas-compras"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Minhas Compras
                          </Link>
                          <Link
                            href="/minhas-vendas"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Minhas Vendas
                          </Link>
                          <Link
                            href="/carteira"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Carteira
                          </Link>
                          <Link
                            href="/favoritos"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Favoritos
                          </Link>
                          <Link
                            href="/mensagens"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-[#16C784]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Mensagens
                          </Link>
                          <Link
                            href="/ofertas"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Ofertas
                          </Link>
                          <Link
                            href="/perfil"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Meu Perfil
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Logout - Mobile only */}
                    <div className="p-2 border-t border-white/10 sm:hidden">
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
                    </div>
                  </div>
                )}
                </div>

                {/* Logout Button - Visible */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="btn-gradient px-4 py-2 rounded-lg text-white font-medium"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
