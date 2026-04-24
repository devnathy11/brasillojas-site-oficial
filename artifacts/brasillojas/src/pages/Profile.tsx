import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { data: profile, isLoading } = useGetUserProfile({ query: { retry: false } as any });
  const updateProfile = useUpdateUserProfile();

  const [form, setForm] = useState({
    name: "",
    email: "",
    recoveryEmail: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? user?.fullName ?? "",
        email: profile.email ?? user?.primaryEmailAddress?.emailAddress ?? "",
        recoveryEmail: profile.recoveryEmail ?? "",
        phone: profile.phone ?? "",
        zipCode: profile.address?.zipCode ?? "",
        street: profile.address?.street ?? "",
        number: profile.address?.number ?? "",
        complement: profile.address?.complement ?? "",
        neighborhood: profile.address?.neighborhood ?? "",
        city: profile.address?.city ?? "",
        state: profile.address?.state ?? "",
      });
    } else if (isLoaded && user && !isLoading) {
      setForm((f) => ({
        ...f,
        name: user.fullName ?? "",
        email: user.primaryEmailAddress?.emailAddress ?? "",
      }));
    }
  }, [profile, isLoaded, user, isLoading]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    try {
      await updateProfile.mutateAsync({
        data: {
          name: form.name,
          email: form.email,
          recoveryEmail: form.recoveryEmail,
          phone: form.phone,
          address: {
            zipCode: form.zipCode,
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
        },
      });
      setSaved(true);
    } catch {
      setError("Erro ao salvar perfil. Tente novamente.");
    }
  }

  const isProfileComplete = !!(
    form.name &&
    form.email &&
    form.recoveryEmail &&
    form.phone &&
    form.zipCode &&
    form.street &&
    form.number &&
    form.neighborhood &&
    form.city &&
    form.state
  );

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="skeleton h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mb-6">
          Todos os campos são obrigatórios para finalizar compras.
        </p>

        {!isProfileComplete && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Perfil incompleto</p>
              <p>Preencha todos os campos abaixo para poder realizar compras.</p>
            </div>
          </div>
        )}

        {isProfileComplete && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            <CheckCircle size={18} className="flex-shrink-0" />
            <p className="font-semibold">Perfil completo — você pode finalizar compras!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4 border-b pb-2">Dados Pessoais</h2>
            <div className="space-y-4">
              <Field label="Nome completo *" name="name" value={form.name} onChange={handleChange} required />
              <Field label="E-mail *" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Field label="E-mail de recuperação *" name="recoveryEmail" type="email" value={form.recoveryEmail} onChange={handleChange} required placeholder="usado para recuperar sua conta" />
              <Field label="Telefone/Celular *" name="phone" value={form.phone} onChange={handleChange} required placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4 border-b pb-2">Endereço</h2>
            <div className="space-y-4">
              <Field label="CEP *" name="zipCode" value={form.zipCode} onChange={handleChange} required placeholder="00000-000" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Rua *" name="street" value={form.street} onChange={handleChange} required />
                </div>
                <Field label="Número *" name="number" value={form.number} onChange={handleChange} required />
              </div>
              <Field label="Complemento" name="complement" value={form.complement} onChange={handleChange} placeholder="Apto, Bloco (opcional)" />
              <Field label="Bairro *" name="neighborhood" value={form.neighborhood} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade *" name="city" value={form.city} onChange={handleChange} required />
                <Field label="Estado *" name="state" value={form.state} onChange={handleChange} required placeholder="SP" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
          )}

          {saved && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
              <CheckCircle size={16} /> Perfil salvo com sucesso!
            </p>
          )}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="w-full py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-lg transition-colors disabled:opacity-70"
          >
            {updateProfile.isPending ? "Salvando..." : "Salvar Perfil"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/20"
      />
    </div>
  );
}
