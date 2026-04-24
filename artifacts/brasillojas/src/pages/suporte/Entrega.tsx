import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Truck, Store, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function EntregaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B5E20] mb-2">Entrega</h1>
          <p className="text-gray-600">
            Confira as modalidades de entrega disponíveis para cada categoria de produto.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#1B5E20]" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Entrega em Domicílio</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Frete Grátis
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Produtos da categoria <strong>Móveis</strong> são entregues diretamente na sua casa, sem custo adicional. Nossa equipe entra em contato para agendar o melhor horário.
            </p>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium">
                Categoria incluída: Móveis
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Retirada na Loja</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Sem frete
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Para todas as outras categorias, a retirada é feita na loja. Após a confirmação do pagamento, você receberá um aviso quando o produto estiver disponível para retirada.
            </p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-medium">
                Categorias: Eletrodomésticos, Eletrônicos, Roupas & Confecções, Calçados, Brinquedos e demais
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-[#1B5E20]" />
            <h2 className="font-semibold text-gray-800">Prazos Estimados</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Móveis — entrega em domicílio</span>
              <span className="text-sm font-medium text-gray-800">5 a 15 dias úteis</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Eletrodomésticos — retirada na loja</span>
              <span className="text-sm font-medium text-gray-800">2 a 5 dias úteis</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-700">Eletrônicos — retirada na loja</span>
              <span className="text-sm font-medium text-gray-800">1 a 3 dias úteis</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-700">Roupas, Calçados e demais — retirada na loja</span>
              <span className="text-sm font-medium text-gray-800">1 a 3 dias úteis</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            * Os prazos começam a contar após a confirmação do pagamento. Podem variar de acordo com a disponibilidade em estoque.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Informações Importantes</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Você pode acompanhar o status do pedido a qualquer momento em <strong>Meus Pedidos</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Para retirada na loja, é necessário apresentar o comprovante do pedido e um documento de identidade.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                No caso de entrega de Móveis, nossa equipe liga para agendar a entrega em horário conveniente.
              </p>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Pedidos pagos via Pix têm o prazo contado a partir da confirmação do pagamento, que pode levar até 30 minutos.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1B5E20] rounded-xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-2">Tem alguma dúvida sobre entrega?</h3>
          <p className="text-green-100 text-sm mb-4">
            Fale com nossa assistente virtual — estamos aqui para ajudar!
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
