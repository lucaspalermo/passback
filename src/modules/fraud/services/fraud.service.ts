// Serviço de Detecção de Fraude

import prisma from "@/lib/prisma";
import { isFraudDetectionEnabled, FRAUD_CONFIG, RiskLevel } from "../index";
import type {
  RiskAnalysis,
  FraudAlert,
  FraudCheckResult,
  DeviceInfo,
} from "../types";

/**
 * Analisa risco de uma transação
 */
export async function analyzeTransactionRisk(
  transactionId: string,
  buyerId: string,
  amount: number,
  deviceInfo?: DeviceInfo
): Promise<RiskAnalysis> {
  if (!isFraudDetectionEnabled()) {
    return {
      id: "",
      entityType: "transaction",
      entityId: transactionId,
      riskScore: 0,
      riskLevel: "low",
      factors: [],
      alerts: [],
      recommendation: "approve",
      analyzedAt: new Date(),
    };
  }

  const factors: RiskAnalysis["factors"] = [];
  const alerts: FraudAlert[] = [];
  let totalScore = 0;

  // 1. Verificar velocidade de transações
  const recentTransactions = await prisma.transaction.count({
    where: {
      buyerId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // última hora
    },
  });

  if (recentTransactions >= FRAUD_CONFIG.maxTransactionsPerHour) {
    totalScore += 30;
    factors.push({
      type: "velocity",
      weight: 0.3,
      score: 30,
      details: `${recentTransactions} transações na última hora`,
    });
  }

  // 2. Verificar histórico de disputas
  const lostDisputes = await prisma.dispute.count({
    where: {
      userId: buyerId,
      status: "resolved_seller", // Perdeu a disputa
    },
  });

  if (lostDisputes >= FRAUD_CONFIG.maxLostDisputes) {
    totalScore += 25;
    factors.push({
      type: "disputes",
      weight: 0.25,
      score: 25,
      details: `${lostDisputes} disputas perdidas`,
    });
  }

  // 3. Verificar valor alto
  if (amount >= FRAUD_CONFIG.highValueThreshold) {
    totalScore += 15;
    factors.push({
      type: "high_value",
      weight: 0.15,
      score: 15,
      details: `Transação de alto valor: R$ ${amount}`,
    });
  }

  // 4. Verificar conta nova
  const user = await prisma.user.findUnique({
    where: { id: buyerId },
  });

  if (user) {
    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (accountAgeDays < 7) {
      totalScore += 20;
      factors.push({
        type: "new_account",
        weight: 0.2,
        score: 20,
        details: `Conta criada há ${accountAgeDays} dias`,
      });
    }
  }

  // 5. Verificar device fingerprint (se disponível)
  if (deviceInfo && FRAUD_CONFIG.checkDeviceFingerprint) {
    const suspiciousDevice = await prisma.fraudAlert.findFirst({
      where: {
        type: "blacklisted_device",
        status: { not: "dismissed" },
        evidence: {
          path: ["fingerprint"],
          equals: deviceInfo.fingerprint,
        },
      },
    });

    if (suspiciousDevice) {
      totalScore += 40;
      factors.push({
        type: "blacklisted_device",
        weight: 0.4,
        score: 40,
        details: "Dispositivo na lista negra",
      });
    }
  }

  // Determina nível de risco
  let riskLevel: RiskLevel = "low";
  let recommendation: "approve" | "review" | "block" = "approve";

  if (totalScore >= FRAUD_CONFIG.autoBlockThreshold) {
    riskLevel = "critical";
    recommendation = "block";
  } else if (totalScore >= FRAUD_CONFIG.manualReviewThreshold) {
    riskLevel = "high";
    recommendation = "review";
  } else if (totalScore >= 25) {
    riskLevel = "medium";
  }

  // Salva análise no banco
  const analysis = await prisma.fraudAnalysis.create({
    data: {
      entityType: "transaction",
      entityId: transactionId,
      riskScore: totalScore,
      riskLevel,
      factors: JSON.stringify(factors),
      recommendation,
    },
  });

  return {
    id: analysis.id,
    entityType: "transaction",
    entityId: transactionId,
    riskScore: totalScore,
    riskLevel,
    factors,
    alerts,
    recommendation,
    analyzedAt: analysis.createdAt,
  };
}

/**
 * Verifica se transação pode prosseguir
 */
export async function checkTransaction(
  buyerId: string,
  amount: number,
  deviceInfo?: DeviceInfo
): Promise<FraudCheckResult> {
  if (!isFraudDetectionEnabled()) {
    return {
      passed: true,
      riskScore: 0,
      riskLevel: "low",
      alerts: [],
    };
  }

  // Análise simplificada (sem transactionId ainda)
  const analysis = await analyzeTransactionRisk("pending", buyerId, amount, deviceInfo);

  return {
    passed: analysis.recommendation !== "block",
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    alerts: analysis.alerts,
    blockedReason: analysis.recommendation === "block"
      ? "Transação bloqueada por medidas de segurança"
      : undefined,
  };
}

/**
 * Registra atividade suspeita
 */
export async function logSuspiciousActivity(
  userId: string,
  activityType: string,
  details: string,
  ipAddress?: string,
  deviceFingerprint?: string
): Promise<void> {
  if (!isFraudDetectionEnabled()) {
    return;
  }

  try {
    await prisma.suspiciousActivity.create({
      data: {
        userId,
        activityType,
        details,
        ipAddress,
        deviceFingerprint,
      },
    });
  } catch (error) {
    console.error("[Fraud] Erro ao registrar atividade:", error);
  }
}

/**
 * Cria alerta de fraude
 */
export async function createFraudAlert(
  type: FraudAlert["type"],
  severity: RiskLevel,
  description: string,
  evidence: Record<string, unknown>,
  userId?: string,
  transactionId?: string
): Promise<FraudAlert | null> {
  if (!isFraudDetectionEnabled()) {
    return null;
  }

  try {
    const alert = await prisma.fraudAlert.create({
      data: {
        type,
        severity,
        description,
        evidence: evidence as object,
        userId,
        transactionId,
        status: "open",
      },
    });

    return alert as unknown as FraudAlert;
  } catch (error) {
    console.error("[Fraud] Erro ao criar alerta:", error);
    return null;
  }
}

/**
 * Lista alertas de fraude para admin
 */
export async function listFraudAlerts(
  status?: FraudAlert["status"]
): Promise<FraudAlert[]> {
  if (!isFraudDetectionEnabled()) {
    return [];
  }

  const alerts = await prisma.fraudAlert.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return alerts as unknown as FraudAlert[];
}

/**
 * Resolve alerta de fraude
 */
export async function resolveFraudAlert(
  alertId: string,
  adminId: string,
  action: "resolved" | "dismissed"
): Promise<boolean> {
  if (!isFraudDetectionEnabled()) {
    return false;
  }

  try {
    await prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        status: action,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });
    return true;
  } catch {
    return false;
  }
}
