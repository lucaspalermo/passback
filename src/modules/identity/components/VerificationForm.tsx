"use client";

import { useState } from "react";
import { useIdentity } from "../hooks/useIdentity";
import type { DocumentType } from "../types";

interface VerificationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VerificationForm({ onSuccess, onCancel }: VerificationFormProps) {
  const { submitVerification, submitting, error } = useIdentity();

  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState<DocumentType>("rg");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  const documentTypes = [
    { value: "rg", label: "RG", hasBack: true },
    { value: "cnh", label: "CNH", hasBack: false },
    { value: "passport", label: "Passaporte", hasBack: false },
  ];

  const selectedDoc = documentTypes.find((d) => d.value === documentType);

  const handleSubmit = async () => {
    const success = await submitVerification({
      documentType,
      documentNumber: documentNumber || undefined,
      documentFrontUrl,
      documentBackUrl: selectedDoc?.hasBack ? documentBackUrl : undefined,
      selfieUrl,
    });

    if (success) {
      onSuccess?.();
    }
  };

  const canProceed = () => {
    if (step === 1) return !!documentType;
    if (step === 2) return !!documentFrontUrl && (!selectedDoc?.hasBack || !!documentBackUrl);
    if (step === 3) return !!selfieUrl;
    return false;
  };

  return (
    <div className="bg-[#0F2A44] rounded-xl p-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? "bg-[#16C784] text-white"
                  : s < step
                  ? "bg-[#16C784]/20 text-[#16C784]"
                  : "bg-[#1A3A5C] text-gray-500"
              }`}
            >
              {s < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && <div className={`flex-1 h-1 rounded ${s < step ? "bg-[#16C784]" : "bg-[#1A3A5C]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Document Type */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Escolha o documento</h3>
          <div className="space-y-3">
            {documentTypes.map((doc) => (
              <button
                key={doc.value}
                onClick={() => setDocumentType(doc.value as DocumentType)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  documentType === doc.value
                    ? "border-[#16C784] bg-[#16C784]/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <span className="font-medium text-white">{doc.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              Número do documento (opcional)
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ex: 12.345.678-9"
              className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50"
            />
          </div>
        </div>
      )}

      {/* Step 2: Document Photos */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Foto do documento</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Frente do documento
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#16C784]/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="doc-front"
                  onChange={(e) => {
                    // Simula upload - em produção, fazer upload real
                    const file = e.target.files?.[0];
                    if (file) {
                      setDocumentFrontUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                <label htmlFor="doc-front" className="cursor-pointer">
                  {documentFrontUrl ? (
                    <img src={documentFrontUrl} alt="Frente" className="max-h-40 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <svg className="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400">Clique para enviar</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {selectedDoc?.hasBack && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Verso do documento
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#16C784]/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="doc-back"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocumentBackUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <label htmlFor="doc-back" className="cursor-pointer">
                    {documentBackUrl ? (
                      <img src={documentBackUrl} alt="Verso" className="max-h-40 mx-auto rounded-lg" />
                    ) : (
                      <>
                        <svg className="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-400">Clique para enviar</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Selfie */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Selfie com documento</h3>
          <p className="text-sm text-gray-400 mb-4">
            Tire uma foto segurando o documento ao lado do rosto. Certifique-se que ambos estão visíveis.
          </p>

          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#16C784]/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="selfie"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelfieUrl(URL.createObjectURL(file));
                }
              }}
            />
            <label htmlFor="selfie" className="cursor-pointer">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Selfie" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-400">Clique para enviar selfie</p>
                </>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
          >
            Voltar
          </button>
        ) : onCancel ? (
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
        ) : null}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-[#16C784] hover:bg-[#14b576] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-[#16C784] hover:bg-[#14b576] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "Enviando..." : "Enviar documentos"}
          </button>
        )}
      </div>
    </div>
  );
}
