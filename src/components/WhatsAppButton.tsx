"use client";

import { Button } from "@/components/ui/button";
import { getWhatsAppLink } from "@/lib/config";

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
}

export default function WhatsAppButton({ phone, message }: WhatsAppButtonProps) {
  // Remove caracteres nao numericos do telefone
  const cleanPhone = phone.replace(/\D/g, "");

  // Adiciona codigo do Brasil se nao tiver
  const formattedPhone = cleanPhone.startsWith("55")
    ? cleanPhone
    : `55${cleanPhone}`;

  const whatsappUrl = getWhatsAppLink(formattedPhone, message);

  return (
    <Button
      asChild
      className="bg-green-600 hover:bg-green-700"
    >
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        Abrir WhatsApp
      </a>
    </Button>
  );
}
