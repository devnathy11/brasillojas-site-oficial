import { useState } from "react";
import { useUser } from "@clerk/react";
import { UserProfile } from "@clerk/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="skeleton h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>
        <div className="flex justify-center">
          <UserProfile
            appearance={{
              variables: {
                colorPrimary: "#1B5E20",
                borderRadius: "0.5rem",
              },
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
