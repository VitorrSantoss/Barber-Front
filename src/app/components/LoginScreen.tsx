import { useState } from "react";
import { Scissors, User, Phone, ArrowRight, LogIn } from "lucide-react";
import { motion } from "motion/react";
import type { ClientProfile } from "../types";
import { saveProfile } from "../auth";

interface LoginScreenProps {
  onLogin: (profile: ClientProfile) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handlePhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    setPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setError("Digite seu nome completo."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("Digite um telefone válido."); return; }
    setError("");

    const profile: ClientProfile = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      memberSince: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      totalVisits: 0,
    };
    saveProfile(profile);
    onLogin(profile);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0a" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)" }}
          >
            <Scissors size={26} color="#c9a84c" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#f0ece0", fontWeight: 700, lineHeight: 1.2 }}>
            Barber<span style={{ color: "#c9a84c" }}>House</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#888070", fontSize: 14, marginTop: 8 }}>
            Identifique-se para agendar e acompanhar sua fila
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <LogIn size={16} color="#c9a84c" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#f0ece0" }}>
              Entrar ou Cadastrar
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="NOME COMPLETO"
              icon={<User size={14} color="#888070" />}
              value={name}
              onChange={(v) => { setName(v); setError(""); }}
              placeholder="João da Silva"
              type="text"
            />
            <Field
              label="TELEFONE"
              icon={<Phone size={14} color="#888070" />}
              value={phone}
              onChange={(v) => { handlePhone(v); setError(""); }}
              placeholder="(11) 99999-9999"
              type="tel"
            />

            {error && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#f87171", marginTop: 2 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg mt-2 transition-all hover:opacity-90"
              style={{
                background: name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10 ? "#c9a84c" : "#1e1e1e",
                color: name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10 ? "#0a0a0a" : "#555",
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 15,
                border: "1px solid " + (name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10 ? "#c9a84c" : "#333"),
                cursor: "pointer",
              }}
            >
              Entrar <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <p style={{ fontFamily: "Inter, sans-serif", color: "#555", fontSize: 12, textAlign: "center", marginTop: 20 }}>
          Novo por aqui? Basta preencher acima e seu perfil será criado automaticamente.
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  label, icon, value, onChange, placeholder, type,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888070", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
        style={{
          background: "#1e1e1e",
          border: focused ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
        }}
      >
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#f0ece0" }}
        />
      </div>
    </div>
  );
}
