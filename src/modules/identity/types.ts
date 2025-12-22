// Tipos do módulo de verificação de identidade

export type DocumentType = "rg" | "cnh" | "passport";

export type VerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

export interface IdentityVerification {
  id: string;
  userId: string;
  status: VerificationStatus;
  documentType: DocumentType;
  documentNumber?: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
  rejectionReason?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitVerificationParams {
  userId: string;
  documentType: DocumentType;
  documentNumber?: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
}

export interface VerificationResult {
  success: boolean;
  verification?: IdentityVerification;
  error?: string;
}

export interface UserVerificationStatus {
  isVerified: boolean;
  status: VerificationStatus | null;
  canSell: boolean;
  canBuy: boolean;
  verification?: IdentityVerification;
  message?: string;
}
