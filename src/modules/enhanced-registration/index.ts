// Módulo: Enhanced Registration
// Registro aprimorado com campos obrigatórios (WhatsApp, CPF)

// Feature flag
export function isEnhancedRegistrationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_ENHANCED_REGISTRATION === "true";
}

// Configurações do módulo
export const ENHANCED_REGISTRATION_CONFIG = {
  requireWhatsApp: true,
  requireCPF: true,
  validateCPF: true, // Validação de CPF real
};

// Validação de CPF
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, "");

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Formatação de CPF
export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/[^\d]/g, "");
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Formatação de telefone
export function formatPhone(phone: string): string {
  phone = phone.replace(/[^\d]/g, "");
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

// Validação de telefone brasileiro
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d]/g, "");
  return cleaned.length === 10 || cleaned.length === 11;
}

// Tipos
export interface EnhancedRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string; // WhatsApp obrigatório
  cpf: string; // CPF obrigatório
}

export * from "./types";
