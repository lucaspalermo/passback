"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Trash2, Bell, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WaitlistEntry {
  id: string;
  eventName: string;
  eventDate: string;
  ticketType: string | null;
  maxPrice: number | null;
  status: string;
  position: number;
  notifiedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  waiting: "Aguardando",
  notified: "Notificado",
  accepted: "Aceito",
  purchased: "Comprado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  waiting: "bg-yellow-500/10 text-yellow-500",
  notified: "bg-blue-500/10 text-blue-500",
  accepted: "bg-green-500/10 text-green-500",
  purchased: "bg-emerald-500/10 text-emerald-500",
  expired: "bg-gray-500/10 text-gray-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export default function WaitlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchWaitlist();
    }
  }, [session]);

  async function fetchWaitlist() {
    try {
      setLoading(true);
      const response = await fetch("/api/modules/waitlist");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Erro ao buscar lista de espera:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(entryId: string) {
    try {
      setRemoving(entryId);
      const response = await fetch(`/api/modules/waitlist?entryId=${entryId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch (error) {
      console.error("Erro ao remover da lista:", error);
    } finally {
      setRemoving(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1F33]">
        <Loader2 className="h-8 w-8 animate-spin text-[#16C784]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F33] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Lista de Espera</h1>
          <p className="mt-1 text-gray-400">
            Acompanhe suas posições na fila para ingressos
          </p>
        </div>

        {entries.length === 0 ? (
          <Card className="border-[#1A3A5C] bg-[#0F2A44]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="mb-4 h-12 w-12 text-gray-500" />
              <h3 className="text-lg font-medium text-white">
                Nenhuma entrada na lista de espera
              </h3>
              <p className="mt-1 text-center text-gray-400">
                Quando um ingresso que você quer não estiver disponível, você
                pode entrar na lista de espera para ser notificado.
              </p>
              <Button
                className="mt-4 bg-[#16C784] hover:bg-[#14b876]"
                onClick={() => router.push("/ingressos")}
              >
                Buscar Ingressos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="border-[#1A3A5C] bg-[#0F2A44]"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {entry.eventName}
                        </h3>
                        <Badge className={statusColors[entry.status]}>
                          {statusLabels[entry.status]}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(entry.eventDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                        {entry.ticketType && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {entry.ticketType}
                          </div>
                        )}
                        {entry.maxPrice && (
                          <div>
                            Preço máx:{" "}
                            <span className="text-[#16C784]">
                              R$ {entry.maxPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="rounded-lg bg-[#1A3A5C] px-3 py-1">
                          <span className="text-sm text-gray-400">
                            Posição na fila:
                          </span>{" "}
                          <span className="font-bold text-[#16C784]">
                            #{entry.position}
                          </span>
                        </div>

                        {entry.notifiedAt && (
                          <div className="flex items-center gap-1 text-sm text-blue-400">
                            <Bell className="h-4 w-4" />
                            Notificado em{" "}
                            {format(
                              new Date(entry.notifiedAt),
                              "dd/MM HH:mm",
                              { locale: ptBR }
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {entry.status === "waiting" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => handleRemove(entry.id)}
                        disabled={removing === entry.id}
                      >
                        {removing === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
