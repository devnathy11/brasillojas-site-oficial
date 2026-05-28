import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser, Show, useClerk } from "@clerk/react";
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LogOut, Package, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCart, useListProducts } from "@workspace/api-client-react";
import { Logo } from "@/components/Logo";

const categories = [
  { name: "Móveis", slug: "moveis" },
  { name: "Eletrônicos", slug: "eletronicos" },
  { name: "Eletrodomésticos", slug: "eletrodomestico" },
  { name: "Infantil", slug: "infantil" },
  { name: "Novidades", slug: "novidades" },
  { name: "Ofertas", slug: "ofertas" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: cart } = useGetCart({ query: { retry: false } as any });
  const searchRef = useRef<HTMLDivElement>(null);

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  const { data: suggestionsData } = useListProducts(
    { search: searchQuery.trim(), limit: 6 },
    { query: { enabled: searchQuery.trim().length >= 2, retry: false } as any }
  );
  const suggestions = suggestionsData?.products ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleSuggestionClick(productId: number) {
    setShowSuggestions(false);
    setSearchQuery("");
    setLocation(`/products/${productId}`);
  }

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top bar */}
      <div className="bg-[#1B5E20] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">

          {/* === Desktop row (single row with logo + search + actions) === */}
          <div className="hidden sm:flex items-center gap-4 py-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Logo size={38} />
              <span className="font-bold text-lg tracking-wide" translate="no">BRASILLOJAS</span>
            </Link>

            <div ref={searchRef} className="flex-1 min-w-0 max-w-2xl relative">
              <form onSubmit={handleSearch}>
                <div className="flex">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(e.target.value.trim().length >= 2);
                    }}
                    onFocus={() => { if (searchQuery.trim().length >= 2) setShowSuggestions(true); }}
                    placeholder="Buscar produtos..."
                    className="flex-1 px-4 py-2 text-gray-900 text-sm rounded-l-md outline-none border-0"
                    autoComplete="off"
                  />
                  <button type="submit" className="px-4 py-2 bg-[#F57F17] hover:bg-[#E65100] text-white rounded-r-md transition-colors">
                    <Search size={18} />
                  </button>
                </div>
              </form>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-gray-200 z-50 overflow-hidden"
                  >
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSuggestionClick(product.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 object-cover rounded border border-gray-100 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-[#C62828] font-semibold">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                          </p>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setShowSuggestions(false); setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`); }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm text-[#1B5E20] font-medium transition-colors border-t border-gray-100"
                    >
                      <Search size={14} /> Ver todos os resultados para "{searchQuery}"
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/cart" className="relative flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <ShoppingCart size={22} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#C62828] text-white text-xs flex items-center justify-center font-bold">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
                <span className="text-xs">Carrinho</span>
              </Link>

              <Show when="signed-in">
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                    <UserCircle size={22} />
                    <span className="text-xs max-w-20 truncate">{user?.firstName ?? "Minha conta"}</span>
                    <ChevronDown size={14} />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-100 text-gray-800 z-50"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-sm truncate">{user?.fullName ?? user?.firstName}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">
                          <User size={16} /> Meu Perfil
                        </Link>
                        <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">
                          <Package size={16} /> Meus Pedidos
                        </Link>
                        <hr className="border-gray-100" />
                        <button onClick={() => { setUserMenuOpen(false); signOut(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg text-left">
                          <LogOut size={16} /> Sair
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-in" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  <User size={22} />
                  <span className="text-xs">Entrar</span>
                </Link>
              </Show>
            </div>
          </div>

          {/* === Mobile: row 1 — logo + actions === */}
          <div className="flex sm:hidden items-center justify-between py-2.5">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Logo size={34} />
              <span className="font-bold text-base tracking-wide" translate="no">BRASILLOJAS</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/cart" className="relative hover:opacity-80 transition-opacity">
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#C62828] text-white text-[10px] flex items-center justify-center font-bold">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </Link>

              <Show when="signed-in">
                <Link href="/profile" className="hover:opacity-80 transition-opacity">
                  <UserCircle size={24} />
                </Link>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-in" className="hover:opacity-80 transition-opacity">
                  <User size={24} />
                </Link>
              </Show>

              <button onClick={() => setMobileOpen(!mobileOpen)} className="hover:opacity-80 transition-opacity">
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* === Mobile: row 2 — search bar === */}
          <div ref={searchRef} className="sm:hidden pb-2.5 relative">
            <form onSubmit={handleSearch}>
              <div className="flex">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => { if (searchQuery.trim().length >= 2) setShowSuggestions(true); }}
                  placeholder="Buscar produtos..."
                  className="flex-1 px-3 py-2 text-gray-900 text-sm rounded-l-md outline-none border-0"
                  autoComplete="off"
                />
                <button type="submit" className="px-3 py-2 bg-[#F57F17] hover:bg-[#E65100] text-white rounded-r-md transition-colors">
                  <Search size={16} />
                </button>
              </div>
            </form>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-0.5 bg-white rounded-md shadow-xl border border-gray-200 z-50 overflow-hidden"
                >
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSuggestionClick(product.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <img src={product.imageUrl} alt={product.name} className="w-8 h-8 object-cover rounded border border-gray-100 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-[#C62828] font-semibold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setShowSuggestions(false); setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`); }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm text-[#1B5E20] font-medium transition-colors border-t border-gray-100"
                  >
                    <Search size={14} /> Ver todos os resultados para "{searchQuery}"
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop navigation */}
      <nav className="bg-[#2E7D32] hidden sm:block">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="px-3 lg:px-4 py-2.5 text-white text-xs lg:text-sm font-medium hover:bg-[#1B5E20] transition-colors rounded-sm whitespace-nowrap flex-shrink-0"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="sm:hidden bg-[#1B5E20] overflow-hidden"
          >
            <div className="px-4 py-2 flex flex-col gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-white text-sm hover:bg-[#2E7D32] rounded"
                >
                  {cat.name}
                </Link>
              ))}
              <hr className="border-green-700 my-1" />
              <Show when="signed-in">
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-white text-sm hover:bg-[#2E7D32] rounded flex items-center gap-2">
                  <Package size={15} /> Meus Pedidos
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-white text-sm hover:bg-[#2E7D32] rounded flex items-center gap-2">
                  <User size={15} /> Meu Perfil
                </Link>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-white text-sm hover:bg-[#2E7D32] rounded flex items-center gap-2">
                  <User size={15} /> Entrar / Cadastrar
                </Link>
              </Show>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
