import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { getGetCartQueryKey } from "@workspace/api-client-react";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirmando pagamento...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("Sessão de pagamento não encontrada.");
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL ?? "";

    getToken().then((token) =>
    fetch(`${apiBase}/api/stripe/complete-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId }),
    }))
      .then(async (res) => {
        if (res.status === 409) {
          // Already processed — redirect to orders
          setStatus("success");
          setMessage("Pagamento confirmado!");
          setTimeout(() => setLocation("/orders"), 1500);
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Erro ao confirmar pagamento");
        }
        const data = await res.json();
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        // Trigger auto-print on the receipt page
        sessionStorage.setItem("bl_autoprint_order", String(data.orderId));
        setStatus("success");
        setMessage("Pagamento confirmado! Redirecionando...");
        setTimeout(() => setLocation(`/receipt/${data.orderId}`), 1000);
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
        setMessage(err.message ?? "Erro ao processar pagamento.");
      });
  }, [setLocation, queryClient, getToken]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={64} className="mx-auto text-[#1B5E20] animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Processando pagamento</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={64} className="mx-auto text-green-600 mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagamento aprovado!</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={64} className="mx-auto text-red-500 mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Falha no pagamento</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => setLocation("/cart")}
              className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-6 py-3 rounded-md"
            >
              Voltar ao carrinho
            </button>
          </>
        )}
      </div>
    </div>
  );
}
