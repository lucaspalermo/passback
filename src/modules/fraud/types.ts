// Tipos do módulo Fraud Detection

import type { RiskLevel, FraudAlertType } from "./index";

// Análise de risco
export interface RiskAnalysis {
  id: string;
  entityType: "user" | "transaction" | "ticket";
  entityId: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  alerts: FraudAlert[];
  recommendation: "approve" | "review" | "block";
  analyzedAt: Date;
}

// Fator de risco individual
export interface RiskFactor {
  type: string;
  weight: number;
  score: number;
  details: string;
}

// Alerta de fraude
export interface FraudAlert {
  id: string;
  type: FraudAlertType;
  severity: RiskLevel;
  userId?: string;
  transactionId?: string;
  ticketId?: string;
  description: string;
  evidence: Record<string, unknown>;
  status: "open" | "investigating" | "resolved" | "dismissed";
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

// Histórico de atividade suspeita
export interface SuspiciousActivity {
  id: string;
  userId: string;
  activityType: string;
  details: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  createdAt: Date;
}

// Configuração de regra de fraude
export interface FraudRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JSON com condições
  riskScore: number;
  isActive: boolean;
  createdAt: Date;
}

// Resultado da verificação
export interface FraudCheckResult {
  passed: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  alerts: FraudAlert[];
  blockedReason?: string;
}

// Device fingerprint
export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
}
