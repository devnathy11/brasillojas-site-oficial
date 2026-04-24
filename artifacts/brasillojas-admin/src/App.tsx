import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, useClerk, useUser } from "@clerk/react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/Dashboard";
import ProductsPage from "@/pages/Products";
import OrdersPage from "@/pages/Orders";
import OrderDetailPage from "@/pages/OrderDetail";
import CouponsPage from "@/pages/Coupons";
import { AdminLayout } from "@/components/AdminLayout";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = !adminEmail || userEmail === adminEmail;

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6 py-12 bg-white rounded-lg shadow-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 font-bold text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
          <p className="text-gray-500 text-sm">
            Voce nao tem permissao para acessar o painel administrativo.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#1B5E20] flex items-center justify-center">
            <span className="text-white font-bold text-xl">BL</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Painel Admin - BrasilLojas</h1>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="*">
        <AdminGuard>
          <AdminLayout>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/products" component={ProductsPage} />
              <Route path="/orders/:id" component={OrderDetailPage} />
              <Route path="/orders" component={OrdersPage} />
              <Route path="/coupons" component={CouponsPage} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </AdminGuard>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        variables: {
          colorPrimary: "#1B5E20",
          borderRadius: "0.5rem",
          fontFamily: "Inter, sans-serif",
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
