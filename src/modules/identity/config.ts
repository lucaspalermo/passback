// Configuração do módulo de verificação de identidade
// Feature flag e configurações isoladas

export const IDENTITY_CONFIG = {
  // Feature flag - ativar/desativar módulo
  enabled: process.env.FEATURE_IDENTITY_ENABLED === "true",

  // Exigir verificação para vender
  requireForSelling: process.env.IDENTITY_REQUIRE_FOR_SELLING === "true",

  // Exigir verificação para compras acima de X reais
  requireForPurchasesAbove: parseInt(process.env.IDENTITY_REQUIRE_ABOVE || "0"),

  // Tipos de documento aceitos
  acceptedDocuments: ["rg", "cnh", "passport"],

  // Tamanho máximo de arquivo (5MB)
  maxFileSize: 5 * 1024 * 1024,

  // Tipos de arquivo aceitos
  acceptedFileTypes: ["image/jpeg", "image/png", "image/webp"],

  // Verificação automática via API (futuramente)
  autoVerification: {
    enabled: process.env.IDENTITY_AUTO_VERIFY === "true",
    provider: process.env.IDENTITY_PROVIDER || "manual", // manual, serpro, bigdata
  },

  // Validade da verificação (dias)
  verificationValidityDays: 365,
};

// Verifica se o módulo está habilitado
export function isIdentityEnabled(): boolean {
  return IDENTITY_CONFIG.enabled;
}

// Verifica se vendedor precisa de verificação
export function requiresSellerVerification(): boolean {
  return IDENTITY_CONFIG.enabled && IDENTITY_CONFIG.requireForSelling;
}

// Verifica se compra precisa de verificação (baseado no valor)
export function requiresPurchaseVerification(amount: number): boolean {
  if (!IDENTITY_CONFIG.enabled) return false;
  if (IDENTITY_CONFIG.requireForPurchasesAbove <= 0) return false;
  return amount >= IDENTITY_CONFIG.requireForPurchasesAbove;
}
