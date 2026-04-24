import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "wouter";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal } from "lucide-react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import type { ListProductsParams } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filter state directly from URL each render — no useState needed
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const [sortBy, setSortBy] = useState<ListProductsParams["sortBy"]>("newest");
  const [page, setPage] = useState(1);

  // Reset pagination when category or search changes
  const prevCategoryRef = useRef(category);
  const prevSearchRef = useRef(search);
  useEffect(() => {
    if (prevCategoryRef.current !== category || prevSearchRef.current !== search) {
      setPage(1);
      prevCategoryRef.current = category;
      prevSearchRef.current = search;
    }
  }, [category, search]);

  function navigateToCategory(slug: string | undefined) {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  }

  const queryParams: ListProductsParams = {
    sortBy,
    page,
    limit: 24,
    ...(category ? { category } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading } = useListProducts(queryParams);
  const { data: categories } = useListCategories();

  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;

  const sortOptions: { label: string; value: ListProductsParams["sortBy"] }[] = [
    { label: "Mais recentes", value: "newest" },
    { label: "Menor preço", value: "price_asc" },
    { label: "Maior preço", value: "price_desc" },
    { label: "Mais populares", value: "popular" },
    { label: "Melhor avaliação", value: "rating" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <a href="/" className="hover:text-[#1B5E20]">Home</a>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-gray-800">Produtos</span>
          {search && (
            <>
              <span className="mx-2">&rsaquo;</span>
              <span className="text-gray-800">"{search}"</span>
            </>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Filter size={16} /> Filtrar por
              </h3>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Categorias</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => navigateToCategory(undefined)}
                    className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                      !category ? "bg-[#E8F5E9] text-[#1B5E20] font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Todos
                  </button>
                  {(categories ?? []).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navigateToCategory(cat.slug)}
                      className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                        category === cat.slug ? "bg-[#E8F5E9] text-[#1B5E20] font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                      <span className="float-right text-gray-400 text-xs">{cat.productCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-white rounded-lg border border-gray-200 px-3 sm:px-4 py-2.5">
              <p className="text-sm text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-800">{data?.total ?? 0}</span> produtos encontrados
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <SlidersHorizontal size={16} className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ListProductsParams["sortBy"])}
                  className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#1B5E20] max-w-36 sm:max-w-none"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
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
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
                <p className="text-gray-400 text-sm mt-2">Tente mudar os filtros ou buscar outro termo</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, page - 2) + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 rounded text-sm ${
                            pageNum === page
                              ? "bg-[#1B5E20] text-white"
                              : "border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Próximo
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
