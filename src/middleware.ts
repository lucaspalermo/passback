import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Módulo: Enhanced Registration
  // Redireciona /cadastro para /cadastro-completo quando ativo
  if (pathname === "/cadastro") {
    const enhancedRegistrationEnabled =
      process.env.NEXT_PUBLIC_MODULE_ENHANCED_REGISTRATION === "true";

    if (enhancedRegistrationEnabled) {
      return NextResponse.redirect(new URL("/cadastro-completo", request.url));
    }
  }

  return NextResponse.next();
}

// Configuração de quais paths o middleware deve processar
export const config = {
  matcher: [
    // Rotas de cadastro
    "/cadastro",
  ],
};
