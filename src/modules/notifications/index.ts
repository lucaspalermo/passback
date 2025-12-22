// Módulo de Notificações - Exportações públicas
// Importar apenas deste arquivo para usar o módulo

// Configuração e flags
export { NOTIFICATIONS_CONFIG, isNotificationsEnabled, isEmailEnabled } from "./config";

// Tipos
export type {
  NotificationType,
  NotificationChannel,
  NotificationRecipient,
  NotificationPayload,
  NotificationResult,
  PaymentConfirmedData,
  TicketSoldData,
  DisputeOpenedData,
  DisputeResolvedData,
  WelcomeData,
} from "./types";

// Serviços (API de alto nível)
export {
  notifyPaymentConfirmed,
  notifyTicketSold,
  notifyDisputeOpened,
  notifyDisputeResolved,
  notifyWelcome,
  notifyPaymentReleased,
  sendEmail,
} from "./services";

// Templates (para customização avançada)
export {
  paymentConfirmedTemplate,
  ticketSoldTemplate,
  disputeOpenedTemplate,
  disputeResolvedTemplate,
  welcomeTemplate,
  formatCurrency,
  formatDate,
} from "./templates";
