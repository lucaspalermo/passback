"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface EvidenceUploadProps {
  disputeId: string;
}

const typeOptions = [
  { value: "screenshot", label: "Print de Tela" },
  { value: "photo", label: "Foto" },
  { value: "document", label: "Documento" },
  { value: "video", label: "Video" },
  { value: "chat", label: "Conversa/Chat" },
];

export default function EvidenceUpload({ disputeId }: EvidenceUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [type, setType] = useState("screenshot");
  const [description, setDescription] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Maximo: 10MB");
      return;
    }

    setSelectedFile(file);
    setError("");
    setSuccess("");

    // Cria preview para imagens
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setPreview("video");
    } else {
      setPreview("document");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Selecione um arquivo");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Faz upload do arquivo
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Erro ao fazer upload");
      }

      // 2. Registra a evidencia na disputa
      const evidenceRes = await fetch(`/api/disputes/${disputeId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description,
          url: uploadData.url,
        }),
      });

      const evidenceData = await evidenceRes.json();

      if (!evidenceRes.ok) {
        throw new Error(evidenceData.error || "Erro ao registrar evidencia");
      }

      setSuccess("Evidencia enviada com sucesso!");
      setSelectedFile(null);
      setPreview(null);
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar evidencia");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Enviar Evidencia
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Tipo de evidencia */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Tipo de Evidencia</label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A3A5C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#16C784]/50 appearance-none cursor-pointer"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Area de upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Arquivo</label>

          {!selectedFile ? (
            <label className="block">
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-[#16C784]/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,application/pdf"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#1A3A5C] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-1">Clique para selecionar ou arraste o arquivo</p>
                <p className="text-xs text-gray-500">JPG, PNG, GIF, WEBP, PDF, MP4 ou WEBM - Max 10MB</p>
              </div>
            </label>
          ) : (
            <div className="bg-[#1A3A5C] rounded-xl p-4">
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {preview && preview !== "video" && preview !== "document" ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-white/10"
                    />
                  ) : preview === "video" ? (
                    <div className="w-20 h-20 bg-[#0F2A44] rounded-lg border border-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#16C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-[#0F2A44] rounded-lg border border-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#2DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Descricao */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Descricao (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que esta evidencia mostra..."
            rows={3}
            className="w-full px-4 py-3 bg-[#1A3A5C] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#16C784]/50 resize-none"
          />
        </div>

        {/* Mensagens */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Botao */}
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className="w-full py-3 px-4 btn-gradient text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Enviar Evidencia
            </>
          )}
        </button>

        {/* Dica */}
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Envie prints de conversa, fotos do ingresso, comprovantes ou qualquer outra evidencia que ajude a comprovar seu caso.
          </p>
        </div>
      </div>
    </div>
  );
}
