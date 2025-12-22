// Módulo de Chat - Exportações públicas
// Importar apenas deste arquivo para usar o módulo

// Configuração e flags
export { CHAT_CONFIG, isChatEnabled, containsBlockedContent } from "./config";

// Tipos
export type {
  ChatMessage,
  ChatConversation,
  ChatParticipant,
  ChatAttachment,
  ConversationListItem,
  SendMessageParams,
  CreateConversationParams,
} from "./types";

// Serviços
export {
  getOrCreateConversation,
  getConversation,
  listConversations,
  getMessages,
  sendMessage,
  markAsRead,
  countUnread,
  closeConversation,
} from "./services";

// Componentes
export {
  ChatWindow,
  ChatMessage as ChatMessageComponent,
  ChatInput,
  ConversationList,
  ChatBadge,
} from "./components";

// Hook
export { useChat } from "./hooks/useChat";
