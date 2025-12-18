"use client";

import { useEffect, useState } from "react";
import { getWhatsAppLink } from "@/lib/config";

interface WhatsAppRedirectProps {
  phone: string;
  message: string;
  shouldRedirect: boolean;
}

export default function WhatsAppRedirect({
  phone,
  message,
  shouldRedirect,
}: WhatsAppRedirectProps) {
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (shouldRedirect && !redirected) {
      const cleanPhone = phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("55")
        ? cleanPhone
        : `55${cleanPhone}`;
      const whatsappUrl = getWhatsAppLink(formattedPhone, message);

      setRedirected(true);

      // Pequeno delay para garantir que a pagina carregou
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 1000);
    }
  }, [shouldRedirect, phone, message, redirected]);

  return null;
}
