"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertTriangle,
  Shield,
  User,
  CreditCard,
  Ticket,
  Eye,
  Check,
  X,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FraudAlert {
  id: string;
  type: string;
  severity: string;
  userId: string | null;
  transactionId: string | null;
  ticketId: string | null;
  description: string;
  evidence: Record<string, unknown>;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

const statusLabels: Record<string, string> = {
  open: "Aberto",
  investigating: "Investigando",
  resolved: "Resolvido",
  dismissed: "Descartado",
};

const typeIcons: Record<string, React.ReactNode> = {
  multiple_accounts: <User className="h-4 w-4" />,
  suspicious_pattern: <Search className="h-4 w-4" />,
  high_value_transaction: <CreditCard className="h-4 w-4" />,
  duplicate_ticket: <Ticket className="h-4 w-4" />,
};

export default function FraudAlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("open");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchAlerts();
    }
  }, [session, filterStatus, filterSeverity]);

  async function fetchAlerts() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: filterStatus });
      if (filterSeverity !== "all") {
        params.set("severity", filterSeverity);
      }

      const response = await fetch(`/api/modules/fraud?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(alertId: string, newStatus: string) {
    try {
      setResolving(true);
      const response = await fetch(`/api/modules/fraud/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution }),
      });

      if (response.ok) {
        setSelectedAlert(null);
        setResolution("");
        fetchAlerts();
      }
    } catch (error) {
      console.error("Erro ao resolver alerta:", error);
    } finally {
      setResolving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1F33]">
        <Loader2 className="h-8 w-8 animate-spin text-[#16C784]" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B1F33] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#16C784]" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Detecção de Fraude
              </h1>
              <p className="mt-1 text-gray-400">
                Monitore e investigue atividades suspeitas
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] border-[#1A3A5C] bg-[#0F2A44] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#1A3A5C] bg-[#0F2A44]">
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[140px] border-[#1A3A5C] bg-[#0F2A44] text-white">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent className="border-[#1A3A5C] bg-[#0F2A44]">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {alerts.length === 0 ? (
          <Card className="border-[#1A3A5C] bg-[#0F2A44]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="mb-4 h-12 w-12 text-[#16C784]" />
              <h3 className="text-lg font-medium text-white">
                Nenhum alerta encontrado
              </h3>
              <p className="mt-1 text-gray-400">
                Não há alertas de fraude com os filtros selecionados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className="border-[#1A3A5C] bg-[#0F2A44] transition-colors hover:border-[#2A4A6C]"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {typeIcons[alert.type] || (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </span>
                        <h3 className="font-semibold text-white">
                          {alert.description}
                        </h3>
                        <Badge className={severityColors[alert.severity]}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>
                          {format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                        {alert.userId && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Usuário: {alert.userId.slice(0, 8)}...
                          </span>
                        )}
                        {alert.transactionId && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Transação: {alert.transactionId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {alert.status === "open" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-yellow-400 hover:bg-yellow-500/10"
                            onClick={() =>
                              handleResolve(alert.id, "investigating")
                            }
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:bg-green-500/10"
                            onClick={() => {
                              setSelectedAlert(alert);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => handleResolve(alert.id, "dismissed")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalhes */}
        <Dialog
          open={!!selectedAlert}
          onOpenChange={() => {
            setSelectedAlert(null);
            setResolution("");
          }}
        >
          <DialogContent className="border-[#1A3A5C] bg-[#0F2A44] text-white">
            <DialogHeader>
              <DialogTitle>Detalhes do Alerta</DialogTitle>
            </DialogHeader>

            {selectedAlert && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Descrição</label>
                  <p className="text-white">{selectedAlert.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Severidade</label>
                    <Badge className={severityColors[selectedAlert.severity]}>
                      {selectedAlert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <p className="text-white">
                      {statusLabels[selectedAlert.status]}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Evidências</label>
                  <pre className="mt-1 overflow-auto rounded-lg bg-[#1A3A5C] p-3 text-xs text-gray-300">
                    {JSON.stringify(selectedAlert.evidence, null, 2)}
                  </pre>
                </div>

                {selectedAlert.status !== "resolved" &&
                  selectedAlert.status !== "dismissed" && (
                    <div>
                      <label className="text-sm text-gray-400">
                        Resolução (opcional)
                      </label>
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Descreva a ação tomada..."
                        className="mt-1 border-[#1A3A5C] bg-[#1A3A5C] text-white"
                      />
                    </div>
                  )}
              </div>
            )}

            <DialogFooter>
              {selectedAlert &&
                selectedAlert.status !== "resolved" &&
                selectedAlert.status !== "dismissed" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleResolve(selectedAlert.id, "dismissed")
                      }
                      disabled={resolving}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      Descartar
                    </Button>
                    <Button
                      onClick={() => handleResolve(selectedAlert.id, "resolved")}
                      disabled={resolving}
                      className="bg-[#16C784] hover:bg-[#14b876]"
                    >
                      {resolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Resolver"
                      )}
                    </Button>
                  </>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
