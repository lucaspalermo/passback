import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#0B1F33]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0F2A44] via-[#16C784]/20 to-[#0B1F33]">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#16C784]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-[#2DFF88]/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-xl flex items-center justify-center shadow-lg shadow-[#16C784]/30">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <span className="text-white font-bold text-3xl">Passback</span>
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#16C784]/10 border border-[#16C784]/20 rounded-full px-4 py-2 mb-6 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse"></span>
            <span className="text-[#16C784] text-sm font-medium">Plataforma Segura</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Revenda de ingressos com{" "}
            <span className="text-gradient">segurança total</span>
          </h1>
          <p className="text-gray-400 text-lg mb-12 max-w-md">
            Pagamento protegido por escrow. Seu dinheiro só é liberado após confirmação.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#16C784]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#16C784]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-gray-300">Pagamento protegido em custódia</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#2DFF88]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2DFF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-gray-300">Contato direto via WhatsApp</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FF8A00]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF8A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-gray-300">Compra rápida e sem burocracia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#16C784] to-[#2DFF88] rounded-lg flex items-center justify-center shadow-lg shadow-[#16C784]/30">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-white font-bold text-2xl">Passback</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
