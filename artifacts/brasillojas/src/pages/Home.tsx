import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

const banners = [
  {
    id: 1,
    title: "NOVAS COLEÇÕES.",
    subtitle: "SEU ESTILO. SUA CASA.",
    cta: "COMPRE AGORA",
    href: "/products?category=moveis",
    bg: "from-[#1B5E20] to-[#2E7D32]",
    textColor: "text-white",
  },
  {
    id: 2,
    title: "OFERTAS IMPERDÍVEIS.",
    subtitle: "ATÉ 50% DE DESCONTO.",
    cta: "VER OFERTAS",
    href: "/products?category=ofertas",
    bg: "from-[#7B1FA2] to-[#9C27B0]",
    textColor: "text-white",
  },
  {
    id: 3,
    title: "MODA BRASILEIRA.",
    subtitle: "ROUPAS E CALÇADOS.",
    cta: "EXPLORAR",
    href: "/products?category=roupas",
    bg: "from-[#1565C0] to-[#1976D2]",
    textColor: "text-white",
  },
];

const categoryGrid = [
  { name: "Móveis", slug: "moveis", description: "Sofás, camas e mais" },
  { name: "Roupas & Confecções", slug: "roupas", description: "Moda feminina e masculina" },
  { name: "Calçados", slug: "calcados", description: "Tênis, sapatos e sandálias" },
  { name: "Novidades", slug: "novidades", description: "Chegou agora" },
  { name: "Ofertas", slug: "ofertas", description: "Até 50% off" },
  { name: "Eletrônicos", slug: "eletronicos", description: "Tech e gadgets" },
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-none sm:rounded-lg h-56 sm:h-80 lg:h-96 mx-0 sm:mx-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
          className={`absolute inset-0 bg-gradient-to-r ${banners[current].bg} flex items-center`}
        >
          <div className="max-w-7xl mx-auto px-8 w-full">
            <div className="max-w-md">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${banners[current].textColor} leading-tight`}
              >
                {banners[current].title}
                <br />
                {banners[current].subtitle}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <Link
                  href={banners[current].href}
                  className="inline-block bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold px-8 py-3 rounded-md transition-colors"
                >
                  {banners[current].cta}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
  const { data: categories } = useListCategories();

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
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-[#1B5E20] hover:shadow-md transition-all cursor-pointer group">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#E8F5E9] flex items-center justify-center group-hover:bg-[#1B5E20] transition-colors">
                        <span className="text-[#1B5E20] group-hover:text-white font-bold text-sm transition-colors">
                          {cat.name.charAt(0)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{cat.description}</p>
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
              <div className="bg-gradient-to-r from-[#C62828] to-[#E53935] rounded-lg p-8 text-white flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity">
                <div>
                  <p className="text-sm uppercase tracking-widest mb-1 opacity-80">Promoção Especial</p>
                  <h3 className="text-2xl font-extrabold">ATÉ 50% DE DESCONTO</h3>
                  <p className="mt-2 opacity-90">Aproveite as melhores ofertas da temporada</p>
                </div>
                <div className="text-6xl font-black opacity-20 select-none">%</div>
              </div>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
