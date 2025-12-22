// Exporta todos os serviços de identidade
export {
  getUserVerificationStatus,
  submitVerification,
  approveVerification,
  rejectVerification,
  listPendingVerifications,
  canUserSell,
  canUserBuy,
} from "./identity.service";
