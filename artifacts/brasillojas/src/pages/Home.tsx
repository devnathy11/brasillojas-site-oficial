import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetFeaturedProducts } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

import bannerOfertas from "@/assets/cat-ofertas.png";
import bannerEletro from "@/assets/banner-eletro.png";
import bannerSala from "@/assets/banner-sala.png";
import catMoveis from "@/assets/cat-moveis.png";
import catRoupas from "@/assets/cat-roupas.png";
import catCalcados from "@/assets/cat-calcados.png";
import catEletronicos from "@/assets/cat-eletronicos.png";
import catNovidades from "@/assets/cat-novidades.png";
import catOfertas from "@/assets/cat-ofertas.png";

const banners = [
  {
    id: 1,
    title: "NOVAS COLEÇÕES",
    subtitle: "SEU ESTILO. SUA CASA.",
    cta: "COMPRE AGORA",
    href: "/products?category=moveis",
    image: bannerSala,
  },
  {
    id: 2,
    title: "OFERTAS IMPERDÍVEIS",
    subtitle: "10% DE DESCONTO",
    cta: "VER OFERTAS",
    href: "/products?category=ofertas",
    image: bannerOfertas,
  },
  {
    id: 3,
    title: "ELETRÔNICOS",
    subtitle: "TECNOLOGIA EM SUAS MÃOS",
    cta: "EXPLORAR",
    href: "/products?category=eletronicos",
    image: bannerEletro,
  },
];

const categoryGrid = [
  { name: "Móveis", slug: "moveis", description: "Sofás, camas e mais", image: catMoveis },
  { name: "Roupas & Confecções", slug: "roupas", description: "Moda feminina e masculina", image: catRoupas },
  { name: "Calçados", slug: "calcados", description: "Tênis, sandálias e mais", image: catCalcados },
  { name: "Eletrônicos", slug: "eletronicos", description: "Tech e gadgets", image: catEletronicos },
  { name: "Novidades", slug: "novidades", description: "Chegou agora", image: catNovidades },
  { name: "Ofertas", slug: "ofertas", description: "10% off em produtos selecionados", image: catOfertas },
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[current];

  return (
    <div className="relative overflow-hidden rounded-none sm:rounded-lg h-64 sm:h-96 lg:h-[28rem] mx-0 sm:mx-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-8 w-full h-full flex items-center">
            <div className="max-w-md">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-lg"
              >
                {banner.title}
                <br />
                <span className="text-[#FFD54F]">{banner.subtitle}</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <Link
                  href={banner.href}
                  className="inline-block bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold px-8 py-3 rounded-md transition-colors shadow-lg"
                >
                  {banner.cta}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero */}
        <HeroBanner />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Categories */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-5 uppercase tracking-wide">
              Compre por Categoria
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categoryGrid.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link href={`/products?category=${cat.slug}`}>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#1B5E20] hover:shadow-lg transition-all cursor-pointer group">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{cat.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{cat.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Featured Products */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                Produtos em Destaque
              </h2>
              <Link
                href="/products"
                className="text-sm text-[#1B5E20] hover:underline font-medium"
              >
                Ver todos
              </Link>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="skeleton aspect-square" />
                    <div className="p-3 space-y-2">
                      <div className="skeleton h-4 rounded" />
                      <div className="skeleton h-4 rounded w-2/3" />
                      <div className="skeleton h-6 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {(featured ?? []).slice(0, 10).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}

            {(!featured || featured.length === 0) && !featuredLoading && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">Produtos em breve!</p>
                <p className="text-sm mt-1">Nosso catálogo está sendo preparado.</p>
              </div>
            )}
          </section>

          {/* Promo banner */}
          <section className="mb-10">
            <Link href="/products?category=ofertas">
              <div className="relative overflow-hidden rounded-lg cursor-pointer group">
                <img src={bannerOfertas} alt="Ofertas" className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#C62828]/90 via-[#C62828]/60 to-transparent flex items-center">
                  <div className="px-8 text-white">
                    <p className="text-sm uppercase tracking-widest mb-1 opacity-80">Promoção Especial</p>
                    <h3 className="text-2xl font-extrabold">10% DE DESCONTO</h3>
                    <p className="mt-2 opacity-90">Aproveite as melhores ofertas da temporada</p>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
