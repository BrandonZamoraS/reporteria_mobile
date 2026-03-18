"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { validateResetPasswordForm } from "@/app/login/forgot-password-state.mjs";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#D9E7D8" />
      <path
        d="m15 24.5 6 6 12-13"
        stroke="#0D3233"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VisibilityToggle({
  visible,
  onClick,
  label,
}: {
  visible: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 text-[#8A9BA7]"
    >
      {visible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const redirectTimeoutRef = useRef<number | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (!session) {
          router.replace("/login?error=token-expired");
          return;
        }

        setIsCheckingSession(false);
      } catch {
        if (isMounted) {
          router.replace("/login?error=token-expired");
        }
      }
    };

    void verifySession();

    return () => {
      isMounted = false;
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateResetPasswordForm({
      password,
      confirmPassword,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError("No fue posible actualizar la contrasena.");
        setIsPending(false);
        return;
      }

      await supabase.auth.signOut();
      setIsSuccess(true);
      setIsPending(false);
      redirectTimeoutRef.current = window.setTimeout(() => {
        router.replace("/login");
      }, 3000);
    } catch {
      setError("No fue posible actualizar la contrasena.");
      setIsPending(false);
    }
  };

  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9]">
      <section className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9] p-[25px] pb-[calc(25px+env(safe-area-inset-bottom))] pt-[calc(25px+env(safe-area-inset-top))]">
        <div className="flex w-full max-w-[360px] flex-col gap-4">
          {isCheckingSession ? (
            <p className="m-0 text-center text-[14px] leading-[1.5] font-normal text-[#405C62]">
              Validando enlace...
            </p>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckIcon />
              <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[24px] leading-none font-normal text-[#0D3233]">
                  Contrasena actualizada
                </h1>
                <p className="m-0 text-[14px] leading-[1.5] font-normal text-[#405C62]">
                  Tu acceso fue actualizado. Te llevaremos al inicio de sesion en unos segundos.
                </p>
              </div>
              <Link
                href="/login"
                className="text-[12px] leading-none font-normal text-[#405C62] underline underline-offset-2"
              >
                Volver al inicio de sesion
              </Link>
            </div>
          ) : (
            <form className="flex w-full flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[24px] leading-none font-normal text-[#0D3233]">
                  Nueva contrasena
                </h1>
                <p className="m-0 text-[14px] leading-[1.5] font-normal text-[#405C62]">
                  Elige una nueva contrasena para continuar con tu acceso.
                </p>
              </div>

              <div className="flex w-full flex-col gap-[6px]">
                <label
                  className="m-0 text-[12px] leading-none font-normal text-[#405C62]"
                  htmlFor="password"
                >
                  Nueva contrasena
                </label>
                <div className="relative">
                  <input
                    className="h-[44px] w-full rounded-[12px] border border-[#B3B5B3] bg-white pl-3 pr-10 text-[14px] leading-none font-normal text-[#0D3233] outline-none placeholder:text-[#8A9BA7]"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <VisibilityToggle
                    visible={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    label={showPassword ? "Ocultar nueva contrasena" : "Mostrar nueva contrasena"}
                  />
                </div>
              </div>

              <div className="flex w-full flex-col gap-[6px]">
                <label
                  className="m-0 text-[12px] leading-none font-normal text-[#405C62]"
                  htmlFor="confirmPassword"
                >
                  Confirmar contrasena
                </label>
                <div className="relative">
                  <input
                    className="h-[44px] w-full rounded-[12px] border border-[#B3B5B3] bg-white pl-3 pr-10 text-[14px] leading-none font-normal text-[#0D3233] outline-none placeholder:text-[#8A9BA7]"
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <VisibilityToggle
                    visible={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    label={showConfirmPassword ? "Ocultar confirmacion de contrasena" : "Mostrar confirmacion de contrasena"}
                  />
                </div>
              </div>

              {error ? (
                <p className="m-0 text-[12px] leading-[1.3] font-normal text-[#B42318]">
                  {error}
                </p>
              ) : null}

              <button
                className="h-[44px] w-full cursor-pointer rounded-[12px] border-0 bg-[#0D3233] text-[14px] leading-none font-normal text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-[#0B2B2C] active:translate-y-px active:bg-[#082122] disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Actualizando..." : "Actualizar contrasena"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
