import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { MapPin, Phone, Clock, Mail } from "lucide-react";

const STORE_INFO = {
  address: "Av. Getúlio Vargas, 1010 A — Centro",
  city: "Pinheiro-MA",
  cep: "CEP: 65.200-000",
  cnpj: "CNPJ: 05.279.846/0001-26",
  phone: "(98) 3381-4556",
  email: "moveis@grupobrasillojas.com",
  hours: [
    { days: "Segunda a Sexta", time: "8h às 18h" },
    { days: "Sábado", time: "8h às 12h" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1B5E20] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-green-200">Institucional</h3>
            <ul className="space-y-2 text-sm text-green-100">
              <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trabalhe Conosco</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Imprensa</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sustentabilidade</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-green-200">Atendimento</h3>
            <ul className="space-y-2 text-sm text-green-100">
              <li>
                <a
                  href={`mailto:${STORE_INFO.email}`}
                  className="hover:text-white transition-colors"
                >
                  Central de Atendimento
                </a>
              </li>
              <li><Link href="/suporte/como-comprar" className="hover:text-white transition-colors">Como Comprar</Link></li>
              <li><Link href="/suporte/entrega" className="hover:text-white transition-colors">Entrega</Link></li>
              <li><Link href="/suporte/trocas" className="hover:text-white transition-colors">Trocas e Devoluções</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-green-200">Minha Conta</h3>
            <ul className="space-y-2 text-sm text-green-100">
              <li><Link href="/sign-in" className="hover:text-white transition-colors">Entrar</Link></li>
              <li><Link href="/sign-up" className="hover:text-white transition-colors">Cadastrar-se</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Meus Pedidos</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">Meu Perfil</Link></li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo size={42} />
              <span className="font-bold text-lg" translate="no">BRASILLOJAS</span>
            </div>
            <p className="text-sm text-green-100 mb-3">
              Sua loja online favorita com as melhores marcas e preços.
            </p>
            <ul className="space-y-1.5 text-xs text-green-200">
              <li className="flex items-start gap-1.5">
                <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                <span>{STORE_INFO.address}<br />{STORE_INFO.city}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone size={12} className="flex-shrink-0" />
                <a href={`tel:${STORE_INFO.phone.replace(/\D/g, "")}`} className="hover:text-white">{STORE_INFO.phone}</a>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail size={12} className="flex-shrink-0" />
                <a href={`mailto:${STORE_INFO.email}`} className="hover:text-white break-all">{STORE_INFO.email}</a>
              </li>
              <li className="flex items-start gap-1.5">
                <Clock size={12} className="flex-shrink-0 mt-0.5" />
                <div>
                  {STORE_INFO.hours.map((h) => (
                    <p key={h.days}>{h.days}: {h.time}</p>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>
        <hr className="border-green-700 mt-10 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-green-300">
          <div className="text-center sm:text-left">
            <p>&copy; 2026 <span translate="no">BrasilLojas</span>. Todos os direitos reservados.</p>
            <p className="mt-0.5">{STORE_INFO.cnpj} · {STORE_INFO.cep}</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
