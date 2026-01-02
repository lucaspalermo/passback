import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Politica de Privacidade | Passback",
  description: "Politica de Privacidade e tratamento de dados da plataforma Passback",
};

export default function PrivacidadePage() {
  const lastUpdated = "24 de dezembro de 2024";

  return (
    <div className="min-h-screen bg-[#0B1F33]">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-3xl font-bold text-white">Politica de Privacidade</h1>
            <p className="text-gray-400 mt-2">Ultima atualizacao: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-[#0F2A44] rounded-2xl border border-white/5 p-8 space-y-8">
            {/* Introducao */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Introducao</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>1.1.</strong> Esta Politica de Privacidade descreve como o Passback ("nos", "nosso",
                  "Plataforma") coleta, usa, armazena, compartilha e protege suas informacoes pessoais.
                </p>
                <p>
                  <strong>1.2.</strong> Ao utilizar nossa Plataforma, voce concorda com as praticas descritas
                  nesta Politica, em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei n. 13.709/2018)
                  e demais legislacoes aplicaveis.
                </p>
                <p>
                  <strong>1.3.</strong> Recomendamos a leitura atenta deste documento. Caso nao concorde com
                  nossas praticas, nao utilize a Plataforma.
                </p>
              </div>
            </section>

            {/* Dados Coletados */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Dados que Coletamos</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>2.1. Dados fornecidos diretamente por voce:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Dados de cadastro:</strong> Nome completo, email, telefone, senha (criptografada), CPF;</li>
                  <li><strong>Dados de perfil:</strong> Foto de perfil, chave PIX para recebimento;</li>
                  <li><strong>Dados de transacao:</strong> Historico de compras e vendas, valores, metodos de pagamento;</li>
                  <li><strong>Comunicacoes:</strong> Mensagens trocadas com outros usuarios e com nosso suporte;</li>
                  <li><strong>Evidencias:</strong> Fotos e documentos enviados em disputas.</li>
                </ul>
                <p>
                  <strong>2.2. Dados coletados automaticamente:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Dados de acesso:</strong> Endereco IP, data e hora de acesso, tipo de navegador e dispositivo;</li>
                  <li><strong>Dados de navegacao:</strong> Paginas visitadas, tempo de permanencia, acoes realizadas;</li>
                  <li><strong>Cookies:</strong> Identificadores para sessao e preferencias;</li>
                  <li><strong>Dados de localizacao:</strong> Localizacao aproximada baseada no IP (nao utilizamos GPS).</li>
                </ul>
                <p>
                  <strong>2.3. Dados de terceiros:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Processadores de pagamento:</strong> Status de transacoes, confirmacoes de pagamento;</li>
                  <li><strong>Servicos de verificacao:</strong> Validacao de CPF e dados cadastrais.</li>
                </ul>
              </div>
            </section>

            {/* Finalidades */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Como Utilizamos seus Dados</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>3.1.</strong> Utilizamos seus dados para as seguintes finalidades:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Prestacao do servico:</strong> Criar e gerenciar sua conta, processar transacoes, facilitar a comunicacao entre usuarios;</li>
                  <li><strong>Seguranca:</strong> Prevenir fraudes, verificar identidades, detectar atividades suspeitas;</li>
                  <li><strong>Comunicacao:</strong> Enviar notificacoes sobre transacoes, atualizacoes de servico, informacoes importantes;</li>
                  <li><strong>Suporte:</strong> Responder duvidas, resolver problemas, mediar disputas;</li>
                  <li><strong>Melhorias:</strong> Analisar uso da Plataforma, desenvolver novos recursos, melhorar a experiencia;</li>
                  <li><strong>Obrigacoes legais:</strong> Cumprir exigencias legais, regulatorias e judiciais;</li>
                  <li><strong>Marketing:</strong> Com seu consentimento, enviar comunicacoes promocionais (voce pode cancelar a qualquer momento).</li>
                </ul>
              </div>
            </section>

            {/* Base Legal */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Bases Legais para Tratamento (LGPD)</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>4.1.</strong> O tratamento de seus dados pessoais e fundamentado nas seguintes bases legais:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Execucao de contrato:</strong> Para prestacao dos servicos contratados (Art. 7, V);</li>
                  <li><strong>Consentimento:</strong> Para marketing e comunicacoes opcionais (Art. 7, I);</li>
                  <li><strong>Obrigacao legal:</strong> Para cumprimento de exigencias legais e regulatorias (Art. 7, II);</li>
                  <li><strong>Legitimo interesse:</strong> Para seguranca, prevencao a fraudes e melhorias (Art. 7, IX);</li>
                  <li><strong>Exercicio regular de direitos:</strong> Para defesa em processos judiciais (Art. 7, VI).</li>
                </ul>
              </div>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Compartilhamento de Dados</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>5.1.</strong> Podemos compartilhar seus dados com:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Outros usuarios:</strong> Nome e telefone apos confirmacao de pagamento, para viabilizar a entrega do ingresso;</li>
                  <li><strong>Processadores de pagamento:</strong> Asaas e outros parceiros para processar transacoes financeiras;</li>
                  <li><strong>Provedores de servicos:</strong> Hospedagem (Neon, Vercel), email (Resend), analytics;</li>
                  <li><strong>Autoridades:</strong> Quando exigido por lei, ordem judicial ou para proteger direitos;</li>
                  <li><strong>Empresas do grupo:</strong> Se houver, para fins administrativos e operacionais.</li>
                </ul>
                <p>
                  <strong>5.2.</strong> NAO vendemos, alugamos ou comercializamos seus dados pessoais a terceiros
                  para fins de marketing.
                </p>
                <p>
                  <strong>5.3.</strong> Exigimos que nossos parceiros mantenham padroes adequados de seguranca e
                  privacidade.
                </p>
              </div>
            </section>

            {/* Armazenamento */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Armazenamento e Seguranca</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>6.1.</strong> Seus dados sao armazenados em servidores seguros localizados no Brasil
                  e/ou Estados Unidos, com criptografia em transito e em repouso.
                </p>
                <p>
                  <strong>6.2.</strong> Adotamos medidas tecnicas e organizacionais para proteger seus dados,
                  incluindo:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Criptografia de senhas (bcrypt/argon2);</li>
                  <li>Conexoes seguras (HTTPS/TLS);</li>
                  <li>Controle de acesso restrito;</li>
                  <li>Monitoramento de atividades suspeitas;</li>
                  <li>Backups regulares;</li>
                  <li>Atualizacoes de seguranca.</li>
                </ul>
                <p>
                  <strong>6.3.</strong> Nenhum sistema e 100% seguro. Em caso de incidente de seguranca,
                  notificaremos voce e as autoridades competentes conforme exigido por lei.
                </p>
              </div>
            </section>

            {/* Retencao */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Retencao de Dados</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>7.1.</strong> Mantemos seus dados pelo tempo necessario para:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Prestar os servicos enquanto sua conta estiver ativa;</li>
                  <li>Cumprir obrigacoes legais (ex: registros fiscais por 5 anos);</li>
                  <li>Defender nossos interesses em eventuais disputas;</li>
                  <li>Exercer direitos legais.</li>
                </ul>
                <p>
                  <strong>7.2.</strong> Apos o encerramento da conta, seus dados serao mantidos por ate 5 anos
                  para fins legais, sendo anonimizados ou excluidos apos esse periodo.
                </p>
              </div>
            </section>

            {/* Direitos do Titular */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Seus Direitos (LGPD)</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>8.1.</strong> Voce possui os seguintes direitos em relacao aos seus dados:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Confirmacao e acesso:</strong> Saber se tratamos seus dados e obter copia;</li>
                  <li><strong>Correcao:</strong> Solicitar correcao de dados incompletos ou incorretos;</li>
                  <li><strong>Anonimizacao/bloqueio/eliminacao:</strong> De dados desnecessarios ou tratados irregularmente;</li>
                  <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado;</li>
                  <li><strong>Eliminacao:</strong> Solicitar exclusao de dados tratados com consentimento;</li>
                  <li><strong>Informacao:</strong> Sobre entidades com quem compartilhamos dados;</li>
                  <li><strong>Revogacao:</strong> Revogar consentimento a qualquer momento;</li>
                  <li><strong>Oposicao:</strong> Opor-se a tratamento em certas circunstancias.</li>
                </ul>
                <p>
                  <strong>8.2.</strong> Para exercer seus direitos, entre em contato pelo email:
                  privacidade@passback.com.br
                </p>
                <p>
                  <strong>8.3.</strong> Responderemos em ate 15 dias uteis, podendo solicitar informacoes
                  adicionais para confirmar sua identidade.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Cookies e Tecnologias Similares</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>9.1.</strong> Utilizamos cookies e tecnologias similares para:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cookies essenciais:</strong> Necessarios para funcionamento da Plataforma (login, sessao);</li>
                  <li><strong>Cookies de preferencias:</strong> Lembrar suas configuracoes e escolhas;</li>
                  <li><strong>Cookies analiticos:</strong> Entender como a Plataforma e utilizada;</li>
                  <li><strong>Cookies de marketing:</strong> Somente com seu consentimento.</li>
                </ul>
                <p>
                  <strong>9.2.</strong> Voce pode configurar seu navegador para recusar cookies, mas isso pode
                  afetar o funcionamento da Plataforma.
                </p>
              </div>
            </section>

            {/* Menores */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Menores de Idade</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>10.1.</strong> A Plataforma e destinada a maiores de 18 anos. Nao coletamos
                  intencionalmente dados de menores.
                </p>
                <p>
                  <strong>10.2.</strong> Se identificarmos que coletamos dados de menor, esses serao excluidos
                  imediatamente.
                </p>
              </div>
            </section>

            {/* Transferencia Internacional */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Transferencia Internacional de Dados</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>11.1.</strong> Alguns de nossos provedores de servicos podem estar localizados fora
                  do Brasil (ex: servicos de nuvem nos EUA).
                </p>
                <p>
                  <strong>11.2.</strong> Nestes casos, garantimos que a transferencia ocorra em conformidade
                  com a LGPD, mediante clausulas contratuais padrao ou para paises com nivel adequado de protecao.
                </p>
              </div>
            </section>

            {/* Alteracoes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Alteracoes nesta Politica</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>12.1.</strong> Podemos atualizar esta Politica periodicamente. A versao mais recente
                  estara sempre disponivel na Plataforma.
                </p>
                <p>
                  <strong>12.2.</strong> Alteracoes significativas serao comunicadas por email ou notificacao
                  na Plataforma.
                </p>
                <p>
                  <strong>12.3.</strong> O uso continuado apos alteracoes constitui aceitacao da nova Politica.
                </p>
              </div>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">13. Contato e Encarregado (DPO)</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>13.1.</strong> Para duvidas sobre privacidade e protecao de dados:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Email:</strong> privacidade@passback.com.br</li>
                  <li><strong>Encarregado (DPO):</strong> [Nome do Responsavel]</li>
                </ul>
                <p>
                  <strong>13.2.</strong> Voce tambem pode entrar em contato com a Autoridade Nacional de
                  Protecao de Dados (ANPD) caso entenda que seus direitos foram violados.
                </p>
              </div>
            </section>

            {/* Aceite */}
            <div className="border-t border-white/10 pt-6 mt-8">
              <p className="text-gray-400 text-sm italic">
                Ao utilizar a Plataforma Passback, voce declara ter lido, compreendido e concordado
                com esta Politica de Privacidade.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/termos" className="text-[#16C784] hover:underline">
              Termos de Uso
            </Link>
            <Link href="/reembolso" className="text-[#16C784] hover:underline">
              Politica de Reembolso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
