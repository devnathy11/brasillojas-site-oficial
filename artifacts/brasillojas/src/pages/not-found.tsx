import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-7xl font-extrabold text-[#1B5E20] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagina nao encontrada</h2>
        <p className="text-gray-500 mb-8">A pagina que voce procura nao existe.</p>
        <Link href="/" className="inline-block bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-8 py-3 rounded-md transition-colors">
          Voltar para o inicio
        </Link>
      </div>
      <Footer />
    </div>
  );
}
