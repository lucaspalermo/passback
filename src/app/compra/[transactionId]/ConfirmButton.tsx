"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmButtonProps {
  transactionId: string;
}

export default function ConfirmButton({ transactionId }: ConfirmButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao confirmar");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro ao confirmar transacao");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full py-6 text-lg bg-green-600 hover:bg-green-700">
          Confirmar Entrada no Evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar entrada no evento</DialogTitle>
          <DialogDescription>
            Ao confirmar, voce atesta que conseguiu entrar no evento com o
            ingresso recebido. O pagamento sera liberado ao vendedor.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atencao:</strong> Esta acao e irreversivel. Apenas confirme
            se voce realmente conseguiu entrar no evento.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Confirmando..." : "Sim, consegui entrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
