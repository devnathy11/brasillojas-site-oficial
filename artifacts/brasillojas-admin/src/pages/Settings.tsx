import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle } from "lucide-react";
import {
  useGetSettingsPixDiscount,
  useUpdateSettingsPixDiscount,
} from "@workspace/api-client-react";

export default function SettingsPage() {
  const { data, isLoading } = useGetSettingsPixDiscount();
  const updateMutation = useUpdateSettingsPixDiscount();

  const [pixPercent, setPixPercent] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data && typeof data.percent === "number") {
      setPixPercent(data.percent);
    }
  }, [data]);

  function handleSave() {
    const percentToSend = Number(pixPercent);

    updateMutation.mutate(
      { data: { percent: isNaN(percentToSend) ? 0 : percentToSend } },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      },
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-[#1B5E20]" />
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Desconto PIX</h2>
        <p className="text-sm text-gray-500 mb-6">
          Percentual de desconto oferecido aos clientes que pagam via PIX.
          Defina 0% para desabilitar o desconto PIX.
        </p>

        {isLoading ? (
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-48" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={pixPercent}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!isNaN(v) && v >= 0 && v <= 100) setPixPercent(v);
                }}
                className="w-32 border border-gray-300 rounded-lg px-4 py-2.5 text-lg font-semibold text-gray-800 outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/20 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                %
              </span>
            </div>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              <Save size={16} />
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </button>

            {saved && (
              <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                <CheckCircle size={16} />
                Salvo com sucesso!
              </div>
            )}
          </div>
        )}

        {pixPercent === 0 && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            Com 0%, o desconto PIX ficará oculto para os clientes no site.
          </p>
        )}

        {pixPercent > 0 && !isLoading && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            Clientes que pagarem via PIX receberão {pixPercent}% de desconto.
          </p>
        )}
      </div>
    </div>
  );
}
