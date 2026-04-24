import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  AlertCircle,
} from "lucide-react";

export default function TrocasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B5E20] mb-2">
            Trocas e Devoluções
          </h1>
          <p className="text-gray-600">
            Sua satisfação é nossa prioridade. Conheça nossa política de trocas e devoluções.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-[#1B5E20]" />
            </div>
            <h2 className="font-semibold text-gray-800 text-lg">Prazo para Trocas</h2>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-700" />
              <span className="font-semibold text-green-700">7 dias corridos</span>
            </div>
            <p className="text-sm text-green-800">
              A partir da data de recebimento do produto (para entregas) ou da retirada na loja. Este prazo está garantido pelo Código de Defesa do Consumidor.
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Após este período, a troca ou devolução fica sujeita à análise pela nossa equipe de suporte.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-800">Aceito para Troca</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Produto com defeito de fabricação",
                "Produto diferente do anunciado",
                "Produto danificado na entrega",
                "Produto com peças faltando",
                "Tamanho ou cor diferente do pedido",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-gray-800">Não Aceito para Troca</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Produto com danos causados pelo cliente",
                "Produto com sinais de uso acima do normal",
                "Produto sem embalagem original",
                "Troca por arrependimento após 7 dias",
                "Produto personalizado sob encomenda",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-600">
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">Como Solicitar uma Troca</h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Entre em contato",
                desc: "Acesse nossa Central de Atendimento e informe o número do pedido, o produto e o motivo da troca.",
              },
              {
                step: "2",
                title: "Aguarde a análise",
                desc: "Nossa equipe analisará sua solicitação em até 2 dias úteis e enviará as instruções para devolução.",
              },
              {
                step: "3",
                title: "Devolva o produto",
                desc: "Devolva o produto na loja com a embalagem original e todos os acessórios. Não há custo para o cliente.",
              },
              {
                step: "4",
                title: "Receba o produto trocado ou o reembolso",
                desc: "Após confirmação da devolução, enviamos o produto substituto ou processamos o reembolso em até 5 dias úteis.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-[#1B5E20] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{title}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="font-semibold text-gray-800 mb-3">Reembolso</h2>
          <div className="space-y-2">
            <div className="flex gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                <strong>Pix:</strong> Reembolso em até 3 dias úteis via transferência bancária.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                <strong>Cartão de Crédito:</strong> Estorno em até 2 faturas, conforme política da operadora.
              </p>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                O reembolso é processado somente após a devolução e conferência do produto na loja.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1B5E20] rounded-xl p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="w-5 h-5" />
            <h3 className="font-bold text-lg">Precisa de ajuda?</h3>
          </div>
          <p className="text-green-100 text-sm mb-4">
            Fale com nossa assistente virtual para iniciar sua solicitação de troca ou devolução.
          </p>
          <Link
            href="/suporte/central"
            className="inline-block bg-white text-[#1B5E20] font-semibold px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            Falar com Assistente
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
