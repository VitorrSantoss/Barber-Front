import { useEffect, useId, useState } from "react";
import type { Barber } from "../types";
import { ApiError, errorMessage, loginBarbeiro } from "../api";
import { PIN_LENGTH } from "../barberAuth";

interface BarberLoginProps {
  onLogin: (barber: Barber) => void;
  onBack: () => void;
}

const DEFAULT_LOCK_SECONDS = 30;

export function BarberLogin({ onLogin, onBack }: BarberLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const inputId = useId();
  const errorId = useId();

  // A API bloqueia depois de várias senhas erradas (429); a tela espera o mesmo tempo.
  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setTimeout(() => setLockLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [lockLeft]);

  const locked = lockLeft > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || submitting) return;
    if (pin.length !== PIN_LENGTH) { setError(`A senha tem ${PIN_LENGTH} dígitos.`); return; }

    setSubmitting(true);
    try {
      onLogin(await loginBarbeiro(pin));
    } catch (err) {
      setPin("");
      if (err instanceof ApiError && err.status === 429) {
        // "Muitas tentativas incorretas. Tente de novo em 27s."
        setLockLeft(Number(/(\d+)s/.exec(err.message)?.[1]) || DEFAULT_LOCK_SECONDS);
        setError("Muitas tentativas erradas.");
      } else if (err instanceof ApiError && err.status === 401) {
        setError("Senha incorreta.");
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h2 className="text-center text-3xl">Balcão do barbeiro</h2>
      <p className="mt-2 text-center text-ink-soft">Digite sua senha de {PIN_LENGTH} dígitos.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5 border-y-2 border-ink py-7">
        <div>
          <label htmlFor={inputId} className="mb-1.5 block">Senha</label>
          <input
            id={inputId}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            value={pin}
            disabled={locked || submitting}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH)); setError(""); }}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            autoFocus
            placeholder="••••••"
            className="min-h-14 w-full rounded-sm border-2 border-ink bg-ticket px-3 text-center font-display text-3xl tracking-[0.5em] text-ink placeholder:text-ink-soft focus:border-navy disabled:opacity-60"
          />
        </div>

        {(error || locked) && (
          <p id={errorId} role="alert" className="font-medium text-pole-red">
            {locked ? `${error} Tente de novo em ${lockLeft}s.` : error}
          </p>
        )}

        <button type="submit" disabled={locked || submitting} className="btn btn-ink w-full text-lg disabled:opacity-60">
          Entrar
        </button>
      </form>

      <p className="mt-5 text-center">
        <button onClick={onBack} className="btn-text text-navy">
          <span aria-hidden="true">←</span> Voltar pro cliente
        </button>
      </p>
    </div>
  );
}
