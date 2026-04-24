import comprovante from "@/pages/comprovante";
import { useEffect, useRef } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useAuth,
} from "@clerk/react";
import {
  Switch,
  Route,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { setAuthTokenGetter, useGetUserProfile } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/Home";
import ProductsPage from "@/pages/Products";
import ProductDetailPage from "@/pages/ProductDetail";
import CartPage from "@/pages/Cart";
import OrdersPage from "@/pages/Orders";
import ProfilePage from "@/pages/Profile";
import ReceiptPage from "@/pages/Receipt";
import PaymentSuccessPage from "@/pages/PaymentSuccess";
import OrderConfirmationPage from "@/pages/OrderConfirmation";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1B5E20",
    colorBackground: "#ffffff",
    colorInputBackground: "#f5f5f5",
    colorText: "#212121",
    colorTextSecondary: "#616161",
    colorInputText: "#212121",
    colorNeutral: "#616161",
    borderRadius: "0.5rem",
    fontFamily: "Inter, sans-serif",
    fontFamilyButtons: "Inter, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "rounded-2xl w-full overflow-hidden shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "#1B5E20", fontWeight: "700" },
    headerSubtitle: { color: "#616161" },
    socialButtonsBlockButtonText: { color: "#212121" },
    formFieldLabel: { color: "#212121" },
    footerActionLink: { color: "#1B5E20" },
    footerActionText: { color: "#616161" },
    dividerText: { color: "#9E9E9E" },
    identityPreviewEditButton: { color: "#1B5E20" },
    formFieldSuccessText: { color: "#2E7D32" },
    alertText: { color: "#C62828" },
    logoBox: "flex justify-center mb-2",
    logoImage: "h-16 w-16",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
    formButtonPrimary: "bg-[#1B5E20] hover:bg-[#2E7D32] text-white",
    formFieldInput: "border border-gray-300 focus:border-[#1B5E20]",
    footerAction: "pt-4",
    dividerLine: "bg-gray-200",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "border-[#1B5E20]",
  },
};

/**
 * Registers the Clerk session token as the Bearer token for every API call.
 * This is the fix for 401 errors on cart / order endpoints.
 */
function ApiClientTokenInitializer() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1B5E20] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">BL</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1B5E20]">BrasilLojas</h1>
          <p className="text-gray-500 text-sm mt-1">Sua loja online favorita</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1B5E20] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">BL</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1B5E20]">BrasilLojas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Crie sua conta e comece a comprar
          </p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function isProfileComplete(profile: UserProfile | undefined): boolean {
  if (!profile) return false;
  return !!(
    profile.name &&
    profile.email &&
    profile.recoveryEmail &&
    profile.phone &&
    profile.address?.zipCode &&
    profile.address?.street &&
    profile.address?.number &&
    profile.address?.neighborhood &&
    profile.address?.city &&
    profile.address?.state
  );
}

const PROFILE_EXEMPT_PATHS = ["/profile", "/sign-in", "/sign-up"];

function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: profile, isLoading } = useGetUserProfile({
    query: { enabled: !!isSignedIn && isLoaded, retry: false },
  });

  const isExempt = PROFILE_EXEMPT_PATHS.some((p) => location.startsWith(p));

  useEffect(() => {
    if (!isLoaded || isLoading || !isSignedIn || isExempt) return;
    if (!isProfileComplete(profile)) {
      setLocation("/profile");
    }
  }, [isLoaded, isLoading, isSignedIn, profile, isExempt, setLocation]);

  return <>{children}</>;
}

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function HomeRedirect() {
  return <HomePage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/comprovante" component={comprovante} />
      <Route path="/" component={HomeRedirect} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:id" component={ProductDetailPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/orders">
        <ProtectedRoute component={OrdersPage} />
      </Route>
      <Route path="/receipt/:id">
        <ProtectedRoute component={ReceiptPage} />
      </Route>
      <Route path="/payment-success">
        <ProtectedRoute component={PaymentSuccessPage} />
      </Route>
      <Route path="/order-confirmation/:id">
        <ProtectedRoute component={OrderConfirmationPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Bem-vindo de volta",
            subtitle: "Entre na sua conta BrasilLojas",
          },
        },
        signUp: {
          start: {
            title: "Crie sua conta",
            subtitle: "Cadastre-se e comece a comprar",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ApiClientTokenInitializer />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <ProfileCompletionGate>
            <Router />
          </ProfileCompletionGate>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
