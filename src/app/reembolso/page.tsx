import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Politica de Reembolso | Passback",
  description: "Politica de Reembolso e Cancelamento da plataforma Passback",
};

export default function ReembolsoPage() {
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
            <h1 className="text-3xl font-bold text-white">Politica de Reembolso</h1>
            <p className="text-gray-400 mt-2">Ultima atualizacao: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-[#0F2A44] rounded-2xl border border-white/5 p-8 space-y-8">
            {/* Sistema Escrow */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Sistema de Pagamento em Custodia (Escrow)</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>1.1.</strong> O Passback utiliza um sistema de pagamento em custodia (escrow) para
                  proteger compradores e vendedores. O valor pago pelo comprador fica retido ate que a transacao
                  seja concluida com sucesso.
                </p>
                <p>
                  <strong>1.2.</strong> O pagamento ao vendedor e liberado:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Quando o comprador confirma a entrada no evento; ou</li>
                  <li>Automaticamente 24 horas apos a data/hora do evento, caso nao haja disputa aberta.</li>
                </ul>
                <p>
                  <strong>1.3.</strong> Este sistema garante que o comprador tenha a oportunidade de verificar
                  o ingresso antes da liberacao do pagamento.
                </p>
              </div>
            </section>

            {/* Direito ao Reembolso */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Situacoes com Direito a Reembolso</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>2.1.</strong> O comprador tera direito a reembolso integral nas seguintes situacoes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Ingresso nao entregue:</strong> O vendedor nao entregou o ingresso conforme combinado;</li>
                  <li><strong>Ingresso invalido:</strong> O ingresso e falso, foi cancelado ou nao permite entrada;</li>
                  <li><strong>Ingresso duplicado:</strong> O mesmo ingresso foi vendido a mais de uma pessoa;</li>
                  <li><strong>Ingresso diferente:</strong> O ingresso entregue difere significativamente do anunciado;</li>
                  <li><strong>Vendedor rejeitou a reserva:</strong> Antes do pagamento ser processado;</li>
                  <li><strong>Expiracao da reserva:</strong> O vendedor nao confirmou em tempo habil.</li>
                </ul>
                <p>
                  <strong>2.2.</strong> O reembolso sera processado apos analise e resolucao da disputa pelo Passback.
                </p>
              </div>
            </section>

            {/* Sem Direito */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Situacoes SEM Direito a Reembolso</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>3.1.</strong> O comprador NAO tera direito a reembolso nas seguintes situacoes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Desistencia:</strong> Mudanca de ideia ou arrependimento apos o pagamento;</li>
                  <li><strong>Impossibilidade de comparecimento:</strong> Motivos pessoais que impediram o comprador de ir ao evento;</li>
                  <li><strong>Confirmacao de entrada:</strong> Apos o comprador confirmar que entrou no evento;</li>
                  <li><strong>Liberacao automatica:</strong> Apos decurso do prazo de 24h sem abertura de disputa;</li>
                  <li><strong>Cancelamento do evento:</strong> O Passback nao se responsabiliza por cancelamentos (disputar com o organizador);</li>
                  <li><strong>Alteracao do evento:</strong> Mudanca de data, local ou atracao pelo organizador;</li>
                  <li><strong>Informacoes erradas:</strong> Comprador nao verificou informacoes do anuncio antes de comprar;</li>
                  <li><strong>Perda do ingresso:</strong> Comprador perdeu o ingresso apos recebe-lo;</li>
                  <li><strong>Disputa fraudulenta:</strong> Tentativa de fraude por parte do comprador.</li>
                </ul>
              </div>
            </section>

            {/* Processo de Disputa */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Processo de Disputa</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>4.1.</strong> Para solicitar reembolso, o comprador deve:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Abrir uma disputa na Plataforma em ate 7 dias apos o pagamento;</li>
                  <li>Descrever detalhadamente o problema ocorrido;</li>
                  <li>Fornecer evidencias (prints, fotos, videos, mensagens);</li>
                  <li>Aguardar a analise e resposta do vendedor;</li>
                  <li>Cooperar com solicitacoes adicionais do Passback.</li>
                </ol>
                <p>
                  <strong>4.2.</strong> O vendedor tera oportunidade de apresentar sua versao e evidencias.
                </p>
                <p>
                  <strong>4.3.</strong> O Passback analisara as evidencias de ambas as partes e tomara uma
                  decisao em ate 7 dias uteis.
                </p>
                <p>
                  <strong>4.4.</strong> A decisao do Passback e final e vinculante na esfera da Plataforma,
                  sem prejuizo dos direitos legais das partes.
                </p>
              </div>
            </section>

            {/* Prazos */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Prazos Importantes</h2>
              <div className="text-gray-300 space-y-3">
                <div className="bg-[#1A3A5C] rounded-xl p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white">Acao</th>
                        <th className="text-right py-2 text-white">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      <tr className="border-b border-white/5">
                        <td className="py-3">Confirmacao do vendedor</td>
                        <td className="text-right text-[#16C784]">15 minutos</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Pagamento apos confirmacao</td>
                        <td className="text-right text-[#16C784]">5 minutos</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Abertura de disputa</td>
                        <td className="text-right text-[#FF8A00]">Ate 7 dias apos pagamento</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Liberacao automatica ao vendedor</td>
                        <td className="text-right text-[#16C784]">24h apos o evento</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Analise de disputa</td>
                        <td className="text-right text-gray-400">Ate 7 dias uteis</td>
                      </tr>
                      <tr>
                        <td className="py-3">Processamento de reembolso</td>
                        <td className="text-right text-gray-400">Ate 10 dias uteis</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Como Funciona */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Como o Reembolso e Processado</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>6.1.</strong> Apos decisao favoravel ao comprador, o reembolso sera processado:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Pagamento via PIX:</strong> Reembolso via PIX para chave cadastrada ou dados bancarios fornecidos;</li>
                  <li><strong>Pagamento via Cartao:</strong> Estorno na fatura do cartao (prazo depende da operadora).</li>
                </ul>
                <p>
                  <strong>6.2.</strong> O prazo para disponibilizacao do valor depende da instituicao financeira
                  do comprador, podendo levar ate 10 dias uteis.
                </p>
                <p>
                  <strong>6.3.</strong> O valor reembolsado sera o valor integral pago pelo comprador, incluindo
                  a taxa de servico.
                </p>
              </div>
            </section>

            {/* Cancelamento pelo Vendedor */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Cancelamento pelo Vendedor</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>7.1.</strong> O vendedor pode rejeitar uma reserva ANTES de confirmar a disponibilidade
                  do ingresso, sem penalidades.
                </p>
                <p>
                  <strong>7.2.</strong> Se o vendedor cancelar APOS a confirmacao de pagamento:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>O comprador recebera reembolso integral automaticamente;</li>
                  <li>O vendedor podera receber uma penalidade de ate 20% do valor da transacao;</li>
                  <li>A penalidade sera registrada como saldo negativo na carteira do vendedor;</li>
                  <li>O vendedor nao podera realizar saques ou novas vendas ate regularizar o saldo.</li>
                </ul>
                <p>
                  <strong>7.3.</strong> Cancelamentos reincidentes poderao resultar em suspensao ou banimento
                  permanente da Plataforma.
                </p>
              </div>
            </section>

            {/* Fraudes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Fraudes e Abusos</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>8.1.</strong> O Passback possui sistemas de deteccao de fraudes e se reserva o direito de:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Negar reembolsos em casos de suspeita de fraude;</li>
                  <li>Suspender contas envolvidas em atividades fraudulentas;</li>
                  <li>Reter valores para investigacao;</li>
                  <li>Reportar atividades ilegais as autoridades competentes.</li>
                </ul>
                <p>
                  <strong>8.2.</strong> Sao consideradas fraudes, entre outras:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Abrir disputa apos utilizar o ingresso normalmente;</li>
                  <li>Fornecer evidencias falsas ou adulteradas;</li>
                  <li>Conluio entre comprador e vendedor para fraudar o sistema;</li>
                  <li>Uso de chargebacks indevidos no cartao de credito.</li>
                </ul>
              </div>
            </section>

            {/* Limitacoes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Limitacoes de Responsabilidade</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>9.1.</strong> O Passback atua como intermediario e NAO se responsabiliza por:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancelamento, adiamento ou alteracao de eventos pelos organizadores;</li>
                  <li>Qualidade da experiencia no evento;</li>
                  <li>Problemas de acesso ao local do evento nao relacionados ao ingresso;</li>
                  <li>Perdas indiretas, consequenciais ou lucros cessantes.</li>
                </ul>
                <p>
                  <strong>9.2.</strong> Em caso de cancelamento do evento pelo organizador, o comprador deve
                  buscar reembolso diretamente com o organizador ou produtora do evento.
                </p>
                <p>
                  <strong>9.3.</strong> A responsabilidade maxima do Passback em qualquer circunstancia estara
                  limitada ao valor das taxas de servico recebidas na transacao especifica.
                </p>
              </div>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Contato</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  Para duvidas sobre reembolsos ou disputas:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Email:</strong> suporte@passback.com.br</li>
                  <li><strong>Prazo de resposta:</strong> Ate 48 horas uteis</li>
                </ul>
              </div>
            </section>

            {/* Aceite */}
            <div className="border-t border-white/10 pt-6 mt-8">
              <p className="text-gray-400 text-sm italic">
                Ao realizar transacoes na Plataforma Passback, voce declara ter lido, compreendido e concordado
                com esta Politica de Reembolso.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/termos" className="text-[#16C784] hover:underline">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-[#16C784] hover:underline">
              Politica de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
