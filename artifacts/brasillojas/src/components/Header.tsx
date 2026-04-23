import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, Show, useClerk } from "@clerk/react";
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LogOut, Package, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCart } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const categories = [
  { name: "Móveis", slug: "moveis" },
  { name: "Eletrodomésticos", slug: "eletrodomesticos" },
  { name: "Eletrônicos", slug: "eletronicos" },
  { name: "Novidades", slug: "novidades" },
  { name: "Ofertas", slug: "ofertas" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: cart } = useGetCart({ query: { retry: false } });

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top bar */}
      <div className="bg-[#1B5E20] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Logo size={42} />
              <span className="font-bold text-lg tracking-wide hidden sm:block">BRASILLOJAS</span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="flex-1 px-4 py-2 text-gray-900 text-sm rounded-l-md outline-none border-0"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F57F17] hover:bg-[#E65100] text-white rounded-r-md transition-colors"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Cart */}
              <Link href="/cart" className="relative flex items-center gap-1 hover:opacity-80 transition-opacity">
                <ShoppingCart size={22} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#C62828] text-white text-xs flex items-center justify-center font-bold">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
                <span className="hidden sm:block text-xs">Carrinho</span>
              </Link>

              {/* User */}
              <Show when="signed-in">
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <UserCircle size={22} />
                    <span className="hidden sm:block text-xs max-w-20 truncate">
                      {user?.firstName ?? "Minha conta"}
                    </span>
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
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                        >
                          <User size={16} /> Meu Perfil
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                        >
                          <Package size={16} /> Meus Pedidos
                        </Link>
                        <hr className="border-gray-100" />
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut(); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg text-left"
                        >
                          <LogOut size={16} /> Sair
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-in" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                  <User size={22} />
                  <span className="hidden sm:block text-xs">Entrar</span>
                </Link>
              </Show>

              {/* Mobile menu toggle */}
              <button
                className="sm:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-[#2E7D32] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="px-4 py-2.5 text-white text-sm font-medium hover:bg-[#1B5E20] transition-colors rounded-sm"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
