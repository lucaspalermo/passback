import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Termos de Uso | Passback",
  description: "Termos e condições de uso da plataforma Passback",
};

export default function TermosPage() {
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
            <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
            <p className="text-gray-400 mt-2">Ultima atualizacao: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-[#0F2A44] rounded-2xl border border-white/5 p-8 space-y-8">
            {/* 1. Definicoes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Definicoes e Aceitacao</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>1.1.</strong> O Passback ("Plataforma", "nos", "nosso") e uma plataforma de intermediacao
                  para revenda de ingressos entre usuarios, operando exclusivamente como intermediario entre
                  compradores e vendedores.
                </p>
                <p>
                  <strong>1.2.</strong> Ao se cadastrar, acessar ou utilizar nossos servicos, voce ("Usuario",
                  "voce", "seu") declara ter lido, compreendido e concordado integralmente com estes Termos de Uso,
                  nossa Politica de Privacidade e Politica de Reembolso.
                </p>
                <p>
                  <strong>1.3.</strong> Se voce nao concordar com qualquer disposicao destes termos, nao devera
                  utilizar a Plataforma.
                </p>
                <p>
                  <strong>1.4.</strong> E necessario ter no minimo 18 (dezoito) anos de idade ou ser emancipado
                  legalmente para utilizar a Plataforma.
                </p>
              </div>
            </section>

            {/* 2. Natureza do Servico */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Natureza do Servico</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>2.1.</strong> O Passback atua EXCLUSIVAMENTE como intermediario tecnologico,
                  disponibilizando uma plataforma que conecta compradores e vendedores de ingressos.
                </p>
                <p>
                  <strong>2.2.</strong> O Passback NAO e proprietario, detentor, emissor ou revendedor dos
                  ingressos anunciados. Todos os ingressos sao de propriedade e responsabilidade exclusiva
                  dos vendedores.
                </p>
                <p>
                  <strong>2.3.</strong> O Passback NAO garante a autenticidade, validade, legitimidade ou
                  qualidade dos ingressos anunciados, sendo esta responsabilidade exclusiva do vendedor.
                </p>
                <p>
                  <strong>2.4.</strong> O Passback NAO e organizador, promotor ou responsavel pelos eventos
                  cujos ingressos sao negociados na Plataforma.
                </p>
              </div>
            </section>

            {/* 3. Cadastro */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Cadastro e Conta</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>3.1.</strong> Para utilizar a Plataforma, e obrigatorio realizar cadastro fornecendo
                  informacoes verdadeiras, precisas, atuais e completas.
                </p>
                <p>
                  <strong>3.2.</strong> O Usuario e responsavel por manter a confidencialidade de sua senha e
                  por todas as atividades realizadas em sua conta.
                </p>
                <p>
                  <strong>3.3.</strong> O Usuario se compromete a notificar imediatamente o Passback sobre
                  qualquer uso nao autorizado de sua conta.
                </p>
                <p>
                  <strong>3.4.</strong> O fornecimento de informacoes falsas, incompletas ou fraudulentas
                  podera resultar no cancelamento imediato da conta, sem direito a reembolso.
                </p>
                <p>
                  <strong>3.5.</strong> O CPF informado sera utilizado para validacao de identidade e
                  processamento de pagamentos, conforme nossa Politica de Privacidade.
                </p>
              </div>
            </section>

            {/* 4. Vendedores */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Obrigacoes dos Vendedores</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>4.1.</strong> O Vendedor declara e garante que:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>E o legitimo proprietario ou detentor legal do ingresso anunciado;</li>
                  <li>O ingresso e autentico, valido e nao foi cancelado, transferido ou utilizado;</li>
                  <li>Possui pleno direito de transferir o ingresso ao comprador;</li>
                  <li>Todas as informacoes do anuncio sao verdadeiras e precisas;</li>
                  <li>O ingresso nao esta vinculado a nenhum tipo de restricao que impeca sua transferencia.</li>
                </ul>
                <p>
                  <strong>4.2.</strong> O Vendedor se compromete a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Confirmar a disponibilidade do ingresso em ate 15 minutos apos a reserva;</li>
                  <li>Entregar o ingresso ao comprador em tempo habil para uso no evento;</li>
                  <li>Manter o ingresso disponivel ate a conclusao da transacao;</li>
                  <li>Nao vender o mesmo ingresso em outras plataformas simultaneamente;</li>
                  <li>Responder prontamente as comunicacoes do comprador e da Plataforma.</li>
                </ul>
                <p>
                  <strong>4.3.</strong> O Vendedor e integralmente responsavel por qualquer prejuizo causado
                  ao comprador ou a terceiros em decorrencia de informacoes falsas, incompletas ou enganosas,
                  ou pela venda de ingressos invalidos, falsos ou duplicados.
                </p>
                <p>
                  <strong>4.4.</strong> Em caso de cancelamento apos confirmacao de pagamento por culpa do
                  Vendedor, podera ser aplicada multa de ate 20% do valor da transacao.
                </p>
              </div>
            </section>

            {/* 5. Compradores */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Obrigacoes dos Compradores</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>5.1.</strong> O Comprador reconhece que:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Esta adquirindo o ingresso de outro usuario, nao do Passback;</li>
                  <li>O Passback nao garante a entrada no evento;</li>
                  <li>Deve verificar todas as informacoes do ingresso antes de confirmar a compra;</li>
                  <li>E responsavel por combinar a entrega com o vendedor.</li>
                </ul>
                <p>
                  <strong>5.2.</strong> O Comprador se compromete a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Efetuar o pagamento dentro do prazo estipulado;</li>
                  <li>Confirmar o recebimento do ingresso apos entrar no evento;</li>
                  <li>Comunicar imediatamente qualquer problema com o ingresso;</li>
                  <li>Utilizar o sistema de disputas de forma honesta e de boa-fe.</li>
                </ul>
                <p>
                  <strong>5.3.</strong> A confirmacao de entrada no evento ou o decurso do prazo de 24 horas
                  apos o evento sem abertura de disputa implica na liberacao automatica do pagamento ao vendedor.
                </p>
              </div>
            </section>

            {/* 6. Pagamentos e Taxas */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Pagamentos, Taxas e Sistema Escrow</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>6.1.</strong> O Passback utiliza um sistema de pagamento em custodia (escrow), onde
                  o valor pago pelo comprador fica retido ate a confirmacao de entrada no evento.
                </p>
                <p>
                  <strong>6.2.</strong> A taxa de servico da Plataforma e de 10% (dez por cento) sobre o valor
                  da transacao, descontada do valor a receber pelo vendedor.
                </p>
                <p>
                  <strong>6.3.</strong> O pagamento ao vendedor sera liberado:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Quando o comprador confirmar a entrada no evento; ou</li>
                  <li>Automaticamente 24 horas apos a data do evento, caso nao haja disputa aberta.</li>
                </ul>
                <p>
                  <strong>6.4.</strong> Metodos de pagamento aceitos: PIX e Cartao de Credito, processados
                  por parceiros de pagamento homologados.
                </p>
                <p>
                  <strong>6.5.</strong> O saque do saldo disponivel pode ser solicitado a qualquer momento,
                  sujeito a analise e processamento em ate 24 horas uteis.
                </p>
              </div>
            </section>

            {/* 7. Disputas */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Sistema de Disputas</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>7.1.</strong> O comprador podera abrir uma disputa no prazo de ate 7 (sete) dias
                  apos o pagamento, nos seguintes casos:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ingresso nao recebido;</li>
                  <li>Ingresso invalido, falso ou duplicado;</li>
                  <li>Ingresso diferente do anunciado;</li>
                  <li>Impossibilidade de entrada no evento por culpa do vendedor.</li>
                </ul>
                <p>
                  <strong>7.2.</strong> O Passback atuara como mediador nas disputas, podendo solicitar
                  provas e evidencias de ambas as partes.
                </p>
                <p>
                  <strong>7.3.</strong> A decisao do Passback nas disputas e final e vinculante, nao cabendo
                  recurso na esfera da Plataforma, sem prejuizo dos direitos legais das partes.
                </p>
                <p>
                  <strong>7.4.</strong> Disputas fraudulentas ou de ma-fe poderao resultar em suspensao ou
                  banimento permanente da Plataforma.
                </p>
              </div>
            </section>

            {/* 8. Proibicoes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Condutas Proibidas</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>8.1.</strong> E expressamente proibido:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fornecer informacoes falsas ou fraudulentas;</li>
                  <li>Vender ingressos falsos, invalidos, roubados ou obtidos ilegalmente;</li>
                  <li>Utilizar a Plataforma para lavagem de dinheiro ou atividades ilicitas;</li>
                  <li>Criar multiplas contas para burlar restricoes;</li>
                  <li>Manipular precos ou praticar especulacao abusiva;</li>
                  <li>Assediar, ameacar ou ofender outros usuarios;</li>
                  <li>Tentar acessar sistemas ou dados da Plataforma de forma nao autorizada;</li>
                  <li>Contornar o sistema de pagamento da Plataforma;</li>
                  <li>Qualquer atividade que viole leis ou regulamentos aplicaveis.</li>
                </ul>
              </div>
            </section>

            {/* 9. Limitacao de Responsabilidade */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Limitacao de Responsabilidade</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>9.1.</strong> O Passback NAO se responsabiliza por:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancelamento, adiamento ou alteracao de eventos;</li>
                  <li>Autenticidade, validade ou qualidade dos ingressos vendidos;</li>
                  <li>Condutas de usuarios vendedores ou compradores;</li>
                  <li>Prejuizos decorrentes de transacoes entre usuarios;</li>
                  <li>Impossibilidade de entrada em eventos por qualquer motivo;</li>
                  <li>Indisponibilidade temporaria da Plataforma;</li>
                  <li>Perdas indiretas, incidentais ou consequenciais.</li>
                </ul>
                <p>
                  <strong>9.2.</strong> Em qualquer hipotese, a responsabilidade do Passback estara limitada
                  ao valor das taxas de servico efetivamente recebidas na transacao em questao.
                </p>
                <p>
                  <strong>9.3.</strong> O Usuario concorda em isentar e indenizar o Passback por quaisquer
                  perdas, danos, custos ou despesas decorrentes de sua utilizacao da Plataforma ou violacao
                  destes Termos.
                </p>
              </div>
            </section>

            {/* 10. Propriedade Intelectual */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Propriedade Intelectual</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>10.1.</strong> Todos os direitos de propriedade intelectual da Plataforma, incluindo
                  marca, logo, design, codigo e conteudo, pertencem exclusivamente ao Passback.
                </p>
                <p>
                  <strong>10.2.</strong> O Usuario nao adquire qualquer direito sobre a propriedade intelectual
                  do Passback pelo uso da Plataforma.
                </p>
              </div>
            </section>

            {/* 11. Modificacoes */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Modificacoes dos Termos</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>11.1.</strong> O Passback reserva-se o direito de modificar estes Termos a qualquer
                  momento, mediante publicacao da versao atualizada na Plataforma.
                </p>
                <p>
                  <strong>11.2.</strong> O uso continuado da Plataforma apos as modificacoes constitui
                  aceitacao dos novos termos.
                </p>
                <p>
                  <strong>11.3.</strong> Alteracoes significativas serao comunicadas por email aos usuarios
                  cadastrados.
                </p>
              </div>
            </section>

            {/* 12. Disposicoes Gerais */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Disposicoes Gerais</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>12.1.</strong> Estes Termos constituem o acordo integral entre o Usuario e o Passback.
                </p>
                <p>
                  <strong>12.2.</strong> A invalidade de qualquer disposicao nao afetara a validade das demais.
                </p>
                <p>
                  <strong>12.3.</strong> A tolerancia quanto ao descumprimento de qualquer disposicao nao
                  implicara renuncia ou novacao.
                </p>
                <p>
                  <strong>12.4.</strong> Este contrato sera regido pelas leis da Republica Federativa do Brasil.
                </p>
                <p>
                  <strong>12.5.</strong> Fica eleito o foro da comarca de [CIDADE/ESTADO] para dirimir quaisquer
                  controversias decorrentes destes Termos, com renuncia a qualquer outro, por mais privilegiado
                  que seja.
                </p>
              </div>
            </section>

            {/* 13. Contato */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">13. Contato</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  Para duvidas, sugestoes ou reclamacoes, entre em contato:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email: contato@passback.com.br</li>
                  <li>Website: passback.com.br</li>
                </ul>
              </div>
            </section>

            {/* Aceite */}
            <div className="border-t border-white/10 pt-6 mt-8">
              <p className="text-gray-400 text-sm italic">
                Ao utilizar a Plataforma Passback, voce declara ter lido, compreendido e concordado
                integralmente com estes Termos de Uso.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/privacidade" className="text-[#16C784] hover:underline">
              Politica de Privacidade
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
