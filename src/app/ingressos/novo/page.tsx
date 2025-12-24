"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

const formItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 as const, delayChildren: 0.1 as const }
  }
};

export default function NovoIngressoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    ticketType: "",
    price: "",
    originalPrice: "",
    description: "",
    imageUrl: "",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B1F33]">
        <Navbar />
        <div className="pt-20 pb-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-[#0F2A44] rounded-xl w-1/2"></div>
              <div className="h-[600px] bg-[#0F2A44] rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  // Handlers para upload de imagem
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Formato invalido. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande. Maximo 5MB.");
      return;
    }

    setError("");
    setImageFile(file);

    // Preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", imageFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      return data.url;
    } catch (err) {
      console.error("Erro no upload:", err);
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Upload da imagem primeiro (se houver)
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: formData.eventName,
          eventDate: formData.eventDate,
          eventLocation: formData.eventLocation,
          ticketType: formData.ticketType,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice
            ? parseFloat(formData.originalPrice)
            : undefined,
          description: formData.description || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar ingresso");
        return;
      }

      router.push(`/ingressos/${data.ticket.id}`);
    } catch {
      setError("Erro ao criar ingresso");
    } finally {
      setLoading(false);
    }
  };

  const ticketTypes = [
    "Pista",
    "Pista Premium",
    "Arquibancada",
    "Camarote",
    "VIP",
    "Meia-entrada",
    "Inteira",
    "Outro",
  ];

  return (
    <motion.div
      className="min-h-screen bg-[#0B1F33]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div whileHover={{ x: -3 }}>
              <Link
                href="/meus-ingressos"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Link>
            </motion.div>
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Vender Ingresso
            </motion.h1>
            <motion.p
              className="text-gray-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Preencha as informacoes do ingresso que deseja vender
            </motion.p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            className="bg-[#0F2A44] rounded-2xl border border-white/5 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2 overflow-hidden"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-300">
                  Nome do Evento <span className="text-[#16C784]">*</span>
                </label>
                <input
                  id="eventName"
                  type="text"
                  placeholder="Ex: Show do Coldplay"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  required
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300">
                    Data e Hora <span className="text-[#16C784]">*</span>
                  </label>
                  <input
                    id="eventDate"
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ticketType" className="block text-sm font-medium text-gray-300">
                    Tipo do Ingresso <span className="text-[#16C784]">*</span>
                  </label>
                  <select
                    id="ticketType"
                    value={formData.ticketType}
                    onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                    required
                    className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="" className="bg-[#1A3A5C]">Selecione o tipo</option>
                    {ticketTypes.map((type) => (
                      <option key={type} value={type} className="bg-[#1A3A5C]">{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-300">
                  Local do Evento <span className="text-[#16C784]">*</span>
                </label>
                <input
                  id="eventLocation"
                  type="text"
                  placeholder="Ex: Allianz Parque, Sao Paulo - SP"
                  value={formData.eventLocation}
                  onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                  required
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300">
                    Preco de Venda (R$) <span className="text-[#16C784]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500">R$</span>
                    </div>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="150,00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-300">
                    Preco Original (R$)
                    <span className="text-gray-500 font-normal ml-1">(opcional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500">R$</span>
                    </div>
                    <input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="200,00"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Exibe o desconto para compradores</p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                  Descricao
                  <span className="text-gray-500 font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Informacoes adicionais sobre o ingresso..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-[#1A3A5C] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16C784]/50 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Upload de Imagem/Flyer */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Imagem do Evento / Flyer
                  <span className="text-gray-500 font-normal ml-1">(opcional)</span>
                </label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview do flyer"
                      className="w-full h-48 object-cover rounded-xl border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded-full text-xs text-white">
                      {imageFile?.name}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-[#16C784] bg-[#16C784]/10"
                        : "border-white/20 hover:border-[#16C784]/50 hover:bg-[#1A3A5C]/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        dragActive ? "bg-[#16C784]/20" : "bg-[#1A3A5C]"
                      }`}>
                        <svg className={`w-7 h-7 ${dragActive ? "text-[#16C784]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-medium ${dragActive ? "text-[#16C784]" : "text-gray-300"}`}>
                          {dragActive ? "Solte a imagem aqui" : "Arraste uma imagem ou clique para selecionar"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, WebP ou GIF - Maximo 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Adicione o flyer ou uma imagem do evento para atrair mais compradores
                </p>
              </div>

              {/* How it works */}
              <motion.div
                className="bg-[#2DFF88]/10 border border-[#2DFF88]/20 p-5 rounded-xl"
                variants={formItemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-medium text-[#2DFF88] mb-3 flex items-center gap-2">
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </motion.svg>
                  Como funciona
                </h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  {[
                    { num: "1", text: "Voce anuncia o ingresso" },
                    { num: "2", text: "Um comprador paga pela plataforma" },
                    { num: "3", text: "O dinheiro fica retido (escrow)" },
                    { num: "4", text: "Voce envia o ingresso via WhatsApp" },
                    { num: "5", text: "O comprador confirma que entrou no evento" },
                  ].map((item, i) => (
                    <motion.li
                      key={item.num}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#2DFF88]/20 text-[#2DFF88] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{item.num}</span>
                      {item.text}
                    </motion.li>
                  ))}
                  <motion.li
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#FF8A00]/20 text-[#FF8A00] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">6</span>
                    <span>Voce recebe <strong className="text-[#FF8A00]">90%</strong> do valor (taxa de 10%)</span>
                  </motion.li>
                </ul>
              </motion.div>

              <motion.div
                className="flex gap-4 pt-2"
                variants={formItemVariants}
              >
                <motion.button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-4 rounded-xl font-semibold text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-gradient py-4 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(22, 199, 132, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </motion.svg>
                      Publicando...
                    </span>
                  ) : (
                    "Publicar Ingresso"
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
