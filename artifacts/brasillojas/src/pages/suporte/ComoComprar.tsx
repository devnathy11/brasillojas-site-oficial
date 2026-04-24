import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Search,
  ShoppingCart,
  MapPin,
  CreditCard,
  CheckCircle,
  Package,
} from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Navegue e encontre o produto",
    description:
      "Use a barra de busca no topo da página ou navegue pelas categorias disponíveis: Móveis, Eletrodomésticos, Eletrônicos, Roupas & Confecções, Calçados, Brinquedos e muito mais. Você também pode filtrar por preço e ordenar por relevância ou menor preço.",
  },
  {
    icon: ShoppingCart,
    title: "2. Adicione ao carrinho",
    description:
      "Na página do produto, clique em \"Adicionar ao Carrinho\". Você pode continuar navegando e adicionar mais itens. Para ver o carrinho, clique no ícone de sacola no topo. Lá você pode alterar quantidades ou remover produtos.",
  },
  {
    icon: MapPin,
    title: "3. Informe seu endereço",
    description:
      "Para finalizar a compra, você precisará estar logado na sua conta. Certifique-se de que seu perfil está completo com endereço de entrega atualizado. Você pode atualizar o endereço na seção \"Meu Perfil\".",
  },
  {
    icon: CreditCard,
    title: "4. Escolha a forma de pagamento",
    description:
      "Aceitamos Cartão de Crédito/Débito (processado com segurança pelo Stripe) e Pix. Caso tenha um cupom de desconto, insira-o no carrinho antes de prosseguir para o pagamento.",
  },
  {
    icon: CheckCircle,
    title: "5. Confirme o pedido",
    description:
      "Revise os itens, endereço e forma de pagamento. Clique em \"Finalizar Pedido\". Você receberá uma confirmação e poderá acompanhar o status do pedido em \"Meus Pedidos\".",
  },
  {
    icon: Package,
    title: "6. Aguarde seu produto",
    description:
      "Após a confirmação do pagamento, seu pedido entra em processamento. Para Móveis, realizamos a entrega em domicílio. Para as demais categorias, a retirada é feita na loja. Você será notificado a cada atualização do seu pedido.",
  },
];

export default function ComoComprarPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B5E20] mb-2">
            Como Comprar
          </h1>
          <p className="text-gray-600">
            Comprar na BrasilLojas é simples e seguro. Siga o passo a passo abaixo.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#1B5E20]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 mb-1">
                    {step.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-[#1B5E20] rounded-xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-2">Ainda tem dúvidas?</h3>
          <p className="text-green-100 text-sm mb-4">
            Nossa assistente virtual está disponível 24 horas para te ajudar.
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
