"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  ticketId: string;
  transactionId: string | null;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  ticket: { id: string; eventName: string; imageUrl: string | null };
  messages: { content: string; createdAt: string; senderId: string }[];
  _count: { messages: number };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string };
}

export default function MensagensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadConversations();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/modules/chat");
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/modules/chat/${conversationId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await loadMessages(conv.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    setError("");

    try {
      const response = await fetch(`/api/modules/chat/${selectedConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar mensagem");
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setError("Erro ao enviar mensagem");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B1F33] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#16C784] border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentUserId = session?.user?.id || "";

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6">Mensagens</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
          {/* Lista de Conversas */}
          <div className="bg-[#0F2A44] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-medium text-white">Conversas</h2>
            </div>

            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500">Nenhuma conversa ainda</p>
                <p className="text-sm text-gray-600 mt-1">
                  As conversas aparecem quando você compra ou vende ingressos
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 overflow-y-auto max-h-[calc(100vh-240px)]">
                {conversations.map((conv) => {
                  const isBuyer = conv.buyer.id === currentUserId;
                  const otherUser = isBuyer ? conv.seller : conv.buyer;
                  const lastMessage = conv.messages[0];
                  const unreadCount = conv._count?.messages || 0;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16C784] to-[#2DFF88] flex items-center justify-center text-white font-medium">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-white truncate">{otherUser.name}</p>
                            {unreadCount > 0 && (
                              <span className="bg-[#16C784] text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {conv.ticket.eventName}
                          </p>
                          {lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Janela de Chat */}
          <div className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <div className="h-full bg-[#0F2A44] rounded-xl flex flex-col overflow-hidden">
                {/* Header do Chat */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16C784] to-[#2DFF88] flex items-center justify-center text-white font-medium">
                    {(selectedConversation.buyer.id === currentUserId
                      ? selectedConversation.seller
                      : selectedConversation.buyer
                    ).name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {selectedConversation.buyer.id === currentUserId
                        ? selectedConversation.seller.name
                        : selectedConversation.buyer.name}
                    </p>
                    <p className="text-sm text-gray-400">{selectedConversation.ticket.eventName}</p>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm mt-1">Envie uma mensagem para iniciar a conversa</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-[#16C784] text-white rounded-br-md"
                                : "bg-[#1A3A5C] text-white rounded-bl-md"
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Erro */}
                {error && (
                  <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#16C784]"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-4 py-3 bg-[#16C784] hover:bg-[#14b576] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full bg-[#0F2A44] rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-20 h-20 mx-auto text-gray-600 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-gray-500">Selecione uma conversa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
