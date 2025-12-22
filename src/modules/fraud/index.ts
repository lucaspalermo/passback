// Módulo: Fraud Detection (Detecção de Fraude)
// Sistema automático de detecção de fraudes

// Feature flag
export function isFraudDetectionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_FRAUD === "true";
}

// Configurações do módulo
export const FRAUD_CONFIG = {
  // Score mínimo para bloquear automaticamente (0-100)
  autoBlockThreshold: 80,

  // Score mínimo para revisão manual (0-100)
  manualReviewThreshold: 50,

  // Máximo de transações por hora por usuário
  maxTransactionsPerHour: 5,

  // Máximo de disputas perdidas antes de flag
  maxLostDisputes: 2,

  // Valor mínimo para verificação extra
  highValueThreshold: 500,

  // Ativar verificação de IP
  checkIP: true,

  // Ativar verificação de device fingerprint
  checkDeviceFingerprint: true,

  // Dias para análise de padrões
  patternAnalysisDays: 30,
};

// Tipos de risco
export type RiskLevel = "low" | "medium" | "high" | "critical";

// Tipos de alerta de fraude
export type FraudAlertType =
  | "multiple_accounts"       // Múltiplas contas do mesmo dispositivo
  | "suspicious_pattern"      // Padrão suspeito de transações
  | "high_dispute_rate"       // Alta taxa de disputas
  | "velocity_abuse"          // Muitas transações em pouco tempo
  | "price_manipulation"      // Manipulação de preços
  | "fake_ticket"             // Suspeita de ingresso falso
  | "chargebacks"             // Histórico de chargebacks
  | "blacklisted_device";     // Dispositivo na lista negra

export * from "./types";
