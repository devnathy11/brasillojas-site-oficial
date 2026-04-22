import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-[#1B5E20] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
              <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Como Comprar</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Entrega</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trocas e Devoluções</a></li>
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
              <span className="font-bold text-lg">BRASILLOJAS</span>
            </div>
            <p className="text-sm text-green-100 mb-4">
              Sua loja online favorita com as melhores marcas e preços.
            </p>
            <div className="flex gap-3">
              {["Twitter", "Instagram", "Facebook"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-full bg-[#2E7D32] hover:bg-[#388E3C] flex items-center justify-center transition-colors"
                  aria-label={social}
                >
                  <span className="text-xs font-bold">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-green-700 mt-10 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-green-300">
          <p>&copy; 2026 BrasilLojas. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
