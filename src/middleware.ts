import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy (ajustado para Next.js)
  if (!pathname.startsWith("/api/")) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.asaas.com https://sandbox.asaas.com https://*.upstash.io",
        "frame-ancestors 'none'",
      ].join("; ")
    );
  }

  // Modulo: Enhanced Registration
  // Redireciona /cadastro para /cadastro-completo quando ativo
  if (pathname === "/cadastro") {
    const enhancedRegistrationEnabled =
      process.env.NEXT_PUBLIC_MODULE_ENHANCED_REGISTRATION === "true";

    if (enhancedRegistrationEnabled) {
      return NextResponse.redirect(new URL("/cadastro-completo", request.url));
    }
  }

  return response;
}

// Configuracao de quais paths o middleware deve processar
export const config = {
  matcher: [
    // Todas as paginas (exceto static files)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
