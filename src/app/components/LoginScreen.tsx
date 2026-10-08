import { useId, useState } from "react";
import type { ClientProfile } from "../types";
import { saveProfile } from "../auth";
import { entrarOuCadastrar, errorMessage } from "../api";
import { Wordmark } from "./Brand";

interface LoginScreenProps {
  onLogin: (profile: ClientProfile) => void;
  onBarber: () => void;
}

export function LoginScreen({ onLogin, onBarber }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const errorId = useId();

  const handlePhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (name.trim().length < 2) { setError("Digite seu nome completo."); return; }
    // A API exige DDD + número de 9 dígitos (11 no total).
    if (phone.replace(/\D/g, "").length !== 11) { setError("Digite o telefone com DDD e 9 dígitos."); return; }
    setError("");
    setSubmitting(true);

    try {
      // Se o telefone já tem cadastro, entra com o nome cadastrado.
      const profile = await entrarOuCadastrar(name.trim(), phone.replace(/\D/g, ""));
      saveProfile(profile);
      onLogin(profile);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="pole-stripes h-2" aria-hidden="true" />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <Wordmark size="lg" as="h1" />
            <p className="mt-6 text-lg">Senta aí que a gente já te chama.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5 border-y-2 border-ink py-7">
            <Field
              label="Seu nome"
              value={name}
              onChange={(v) => { setName(v); setError(""); }}
              placeholder="João da Silva"
              type="text"
              autoComplete="name"
              errorId={error ? errorId : undefined}
            />
            <Field
              label="Telefone com DDD"
              value={phone}
              onChange={(v) => { handlePhone(v); setError(""); }}
              placeholder="(11) 99999-9999"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              errorId={error ? errorId : undefined}
            />

            {error && (
              <p id={errorId} role="alert" className="font-medium text-pole-red">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-ink w-full text-lg disabled:opacity-60">
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-soft">
            Primeira vez? É só preencher, a gente cria seu cadastro na hora.
          </p>
          <p className="mt-2 text-center">
            <button onClick={onBarber} className="btn-text text-navy">
              Sou barbeiro <span aria-hidden="true">→</span>
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type, autoComplete, inputMode, errorId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type: string;
  autoComplete: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  errorId?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-describedby={errorId}
        aria-invalid={errorId ? true : undefined}
        className="min-h-12 w-full rounded-sm border-2 border-ink bg-ticket px-3 text-base text-ink placeholder:text-ink-soft focus:border-navy"
      />
    </div>
  );
}
