// Sistema de Logs de Auditoria
// Registra eventos importantes de segurança

type AuditEventType =
  | "auth.login"
  | "auth.login_failed"
  | "auth.register"
  | "auth.logout"
  | "transaction.created"
  | "transaction.paid"
  | "transaction.confirmed"
  | "transaction.cancelled"
  | "dispute.opened"
  | "dispute.resolved"
  | "withdrawal.requested"
  | "withdrawal.completed"
  | "security.rate_limited"
  | "security.suspicious_activity"
  | "admin.action";

interface AuditLogData {
  event: AuditEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success?: boolean;
}

// Formata log para console com cores
function formatLog(data: AuditLogData): string {
  const timestamp = new Date().toISOString();
  const status = data.success !== false ? "✓" : "✗";
  const userId = data.userId || "anonymous";
  const ip = data.ip || "unknown";

  let message = `[AUDIT] ${timestamp} | ${status} ${data.event} | user=${userId} | ip=${ip}`;

  if (data.details) {
    const detailsStr = Object.entries(data.details)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
    message += ` | ${detailsStr}`;
  }

  return message;
}

// Log de auditoria principal
export function auditLog(data: AuditLogData): void {
  const formattedLog = formatLog(data);

  // Log para console (aparece nos logs do servidor)
  if (data.success === false) {
    console.warn(formattedLog);
  } else {
    console.log(formattedLog);
  }

  // Aqui voce pode adicionar integracoes futuras:
  // - Enviar para servico de logging (DataDog, LogTail, etc)
  // - Salvar em banco de dados
  // - Enviar para webhook
}

// Helper para extrair IP do request
export function extractRequestInfo(request: Request): {
  ip: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return { ip, userAgent };
}

// Logs de autenticacao
export function logAuthEvent(
  event: "login" | "login_failed" | "register" | "logout",
  request: Request,
  userId?: string,
  details?: Record<string, unknown>
): void {
  const { ip, userAgent } = extractRequestInfo(request);

  auditLog({
    event: `auth.${event}` as AuditEventType,
    userId,
    ip,
    userAgent,
    details,
    success: event !== "login_failed",
  });
}

// Logs de transacoes
export function logTransactionEvent(
  event: "created" | "paid" | "confirmed" | "cancelled",
  userId: string,
  transactionId: string,
  details?: Record<string, unknown>
): void {
  auditLog({
    event: `transaction.${event}` as AuditEventType,
    userId,
    details: { transactionId, ...details },
    success: true,
  });
}

// Logs de disputas
export function logDisputeEvent(
  event: "opened" | "resolved",
  userId: string,
  disputeId: string,
  details?: Record<string, unknown>
): void {
  auditLog({
    event: `dispute.${event}` as AuditEventType,
    userId,
    details: { disputeId, ...details },
    success: true,
  });
}

// Logs de saque
export function logWithdrawalEvent(
  event: "requested" | "completed",
  userId: string,
  withdrawalId: string,
  amount: number,
  details?: Record<string, unknown>
): void {
  auditLog({
    event: `withdrawal.${event}` as AuditEventType,
    userId,
    details: { withdrawalId, amount, ...details },
    success: true,
  });
}

// Logs de seguranca
export function logSecurityEvent(
  event: "rate_limited" | "suspicious_activity",
  request: Request,
  userId?: string,
  details?: Record<string, unknown>
): void {
  const { ip, userAgent } = extractRequestInfo(request);

  auditLog({
    event: `security.${event}` as AuditEventType,
    userId,
    ip,
    userAgent,
    details,
    success: false,
  });
}

// Logs de acoes admin
export function logAdminAction(
  userId: string,
  action: string,
  targetId?: string,
  details?: Record<string, unknown>
): void {
  auditLog({
    event: "admin.action",
    userId,
    details: { action, targetId, ...details },
    success: true,
  });
}
