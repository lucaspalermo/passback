import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Inicializa Redis apenas se as credenciais estiverem configuradas
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// Rate limiters para diferentes cenarios
// Formato: { requests, window } = X requests por janela de tempo

// Limite geral para APIs - 100 requests por minuto
export const generalLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:general",
  });
};

// Limite para login/registro - 5 tentativas por minuto
export const authLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "ratelimit:auth",
  });
};

// Limite para criacao de transacoes - 10 por minuto
export const transactionLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:transaction",
  });
};

// Limite para envio de mensagens - 30 por minuto
export const messageLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "ratelimit:message",
  });
};

// Limite estrito para acoes sensiveis - 3 por minuto
export const strictLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "ratelimit:strict",
  });
};

// Funcao helper para verificar rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Se Redis nao estiver configurado, permite todas as requests
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("[RateLimit] Erro:", error);
    // Em caso de erro, permite a request para nao bloquear usuarios
    return { success: true };
  }
}

// Funcao para obter identificador do request (IP ou userId)
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Tenta obter IP do header (para proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback para um identificador generico
  return "ip:unknown";
}

// Response helper para rate limit excedido
export function rateLimitResponse(reset?: number) {
  const retryAfter = reset ? Math.ceil((reset - Date.now()) / 1000) : 60;

  return new Response(
    JSON.stringify({
      error: "Muitas requisicoes. Tente novamente em alguns segundos.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
