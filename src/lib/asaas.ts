// Integração com API Asaas para pagamentos PIX e Cartão de Crédito

const ASAAS_API_URL = process.env.ASAAS_ENVIRONMENT === "production"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
  status: string;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  description?: string;
}

interface AsaasPixQrCode {
  encodedImage: string; // Base64 da imagem
  payload: string; // Código copia e cola
  expirationDate: string;
}

interface CreateCustomerParams {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

interface CreatePaymentParams {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
  billingType: "PIX" | "CREDIT_CARD";
  dueDate?: string;
  // Para cartão de crédito
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ASAAS_API_URL}${endpoint}`;

  // Debug: log da requisição
  console.log(`[Asaas] ${options.method || "GET"} ${url}`);
  console.log(`[Asaas] API Key presente: ${ASAAS_API_KEY ? "Sim (" + ASAAS_API_KEY.substring(0, 20) + "...)" : "Não"}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
      "User-Agent": "Passback/1.0",
      ...options.headers,
    },
  });

  // Pega o texto da resposta primeiro
  const text = await response.text();

  // Debug: log da resposta
  console.log(`[Asaas] Status: ${response.status}`);
  console.log(`[Asaas] Resposta: ${text.substring(0, 500)}`);

  // Tenta parsear o JSON
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("[Asaas] Erro ao parsear JSON:", text);
    throw new Error("Resposta inválida da API Asaas");
  }

  if (!response.ok) {
    console.error("[Asaas] Erro:", data);
    throw new Error(data.errors?.[0]?.description || `Erro na API Asaas: ${response.status}`);
  }

  return data as T;
}

/**
 * Busca cliente existente por CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
  try {
    const cleanCpf = cpfCnpj.replace(/\D/g, "");
    const data = await asaasRequest<{ data: AsaasCustomer[] }>(
      `/customers?cpfCnpj=${cleanCpf}`
    );
    return data.data?.[0] || null;
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return null;
  }
}

/**
 * Cria um novo cliente no Asaas
 */
export async function createCustomer(params: CreateCustomerParams): Promise<AsaasCustomer> {
  const cleanCpf = params.cpfCnpj.replace(/\D/g, "");

  return asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      cpfCnpj: cleanCpf,
      phone: params.phone?.replace(/\D/g, ""),
      notificationDisabled: false,
    }),
  });
}

/**
 * Busca ou cria um cliente no Asaas
 */
export async function getOrCreateCustomer(params: CreateCustomerParams): Promise<AsaasCustomer> {
  // Primeiro tenta buscar pelo CPF/CNPJ
  const existing = await findCustomerByCpfCnpj(params.cpfCnpj);
  if (existing) {
    return existing;
  }

  // Se não existe, cria novo
  return createCustomer(params);
}

/**
 * Cria uma cobrança no Asaas
 */
export async function createPayment(params: CreatePaymentParams): Promise<AsaasPayment> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Data de vencimento: hoje + 1 dia para PIX (expira em 24h)
  const dueDate = params.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const body: Record<string, unknown> = {
    customer: params.customerId,
    billingType: params.billingType,
    value: params.value,
    dueDate,
    description: params.description,
    externalReference: params.externalReference,
    callback: {
      successUrl: `${baseUrl}/compra/${params.externalReference}?status=success`,
      autoRedirect: true,
    },
  };

  // Para cartão de crédito, adiciona dados do cartão
  if (params.billingType === "CREDIT_CARD" && params.creditCard) {
    body.creditCard = params.creditCard;
    body.creditCardHolderInfo = params.creditCardHolderInfo;
  }

  return asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Obtém o QR Code PIX de uma cobrança
 */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasRequest<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

/**
 * Consulta uma cobrança pelo ID
 */
export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>(`/payments/${paymentId}`);
}

/**
 * Consulta uma cobrança pela referência externa (transactionId)
 */
export async function getPaymentByExternalReference(externalReference: string): Promise<AsaasPayment | null> {
  try {
    const data = await asaasRequest<{ data: AsaasPayment[] }>(
      `/payments?externalReference=${externalReference}`
    );
    return data.data?.[0] || null;
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error);
    return null;
  }
}

/**
 * Estorna uma cobrança (reembolso)
 */
export async function refundPayment(paymentId: string, value?: number): Promise<{ id: string; status: string }> {
  const body = value ? { value } : {};

  return asaasRequest(`/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Cria um link de pagamento (checkout Asaas)
 */
export async function createPaymentLink(params: {
  name: string;
  description: string;
  value: number;
  billingType: "PIX" | "CREDIT_CARD" | "UNDEFINED"; // UNDEFINED permite ambos
  externalReference: string;
}): Promise<{ id: string; url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return asaasRequest("/paymentLinks", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      value: params.value,
      billingType: params.billingType,
      chargeType: "DETACHED", // Cobrança avulsa
      dueDateLimitDays: 1,
      subscriptionCycle: null,
      maxInstallmentCount: 1,
      externalReference: params.externalReference,
      notificationEnabled: true,
      callback: {
        successUrl: `${baseUrl}/compra/${params.externalReference}?status=success`,
        autoRedirect: true,
      },
    }),
  });
}

// Tipos exportados para uso em outros arquivos
export type {
  AsaasCustomer,
  AsaasPayment,
  AsaasPixQrCode,
  CreateCustomerParams,
  CreatePaymentParams,
};
