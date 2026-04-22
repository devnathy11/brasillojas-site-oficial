import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { LayoutDashboard, Package, ShoppingBag, Tag, Menu, X, LogOut, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/coupons", label: "Cupons", icon: Tag },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
  const [location] = useLocation();
  const isActive = href === "/" ? location === "/" : location.startsWith(href);
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-[#2E7D32] text-white" : "text-green-100 hover:bg-[#2E7D32]/60 hover:text-white"}`}>
        <Icon size={18} />
        <span className="font-medium">{label}</span>
        {isActive && <ChevronRight size={14} className="ml-auto" />}
      </div>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1B5E20] transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex lg:flex-col flex-shrink-0`}>
        <div className="flex items-center justify-between p-5 border-b border-green-700">
          <div className="flex items-center gap-2">
            <Logo size={40} />
            <div>
              <p className="text-white font-bold text-sm">BrasilLojas</p>
              <p className="text-green-200 text-xs">Painel Admin</p>
            </div>
          </div>
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-green-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1B5E20] font-bold text-sm">
              {user?.firstName?.charAt(0) ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.fullName ?? user?.firstName ?? "Admin"}</p>
              <p className="text-green-300 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 text-green-200 hover:text-white hover:bg-[#2E7D32] rounded-lg transition-colors text-sm"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Painel Administrativo</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
