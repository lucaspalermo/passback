"use client";

import { useEffect, useRef } from "react";
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
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (shouldRedirect && !redirectedRef.current) {
      redirectedRef.current = true;

      const cleanPhone = phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("55")
        ? cleanPhone
        : `55${cleanPhone}`;
      const whatsappUrl = getWhatsAppLink(formattedPhone, message);

      // Pequeno delay para garantir que a pagina carregou
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 1000);
    }
  }, [shouldRedirect, phone, message]);

  return null;
}
