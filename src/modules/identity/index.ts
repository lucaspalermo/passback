// Módulo de Verificação de Identidade - Exportações públicas

// Configuração e flags
export {
  IDENTITY_CONFIG,
  isIdentityEnabled,
  requiresSellerVerification,
  requiresPurchaseVerification,
} from "./config";

// Tipos
export type {
  DocumentType,
  VerificationStatus,
  IdentityVerification,
  UserVerificationStatus,
  SubmitVerificationParams,
  VerificationResult,
} from "./types";

// Serviços
export {
  getUserVerificationStatus,
  submitVerification,
  approveVerification,
  rejectVerification,
  listPendingVerifications,
  canUserSell,
  canUserBuy,
} from "./services";

// Componentes
export {
  VerificationStatus as VerificationStatusCard,
  VerificationForm,
  VerificationBadge,
} from "./components";

// Hook
export { useIdentity } from "./hooks/useIdentity";
