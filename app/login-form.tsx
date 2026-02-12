"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "./login-actions";

const initialState: LoginActionState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-[44px] w-full cursor-pointer rounded-[12px] border-0 bg-[#0D3233] text-[14px] leading-none font-normal text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-[#0B2B2C] active:translate-y-px active:bg-[#082122] disabled:cursor-not-allowed disabled:opacity-70"
      type="submit"
      disabled={pending}
    >
      {pending ? "Ingresando..." : "Ingresar"}
    </button>
  );
}

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form className="flex w-full flex-col gap-4" action={formAction}>
      <div className="flex w-full items-center justify-center">
        <Image
          src="/logo.png"
          alt="Logo Reporteria"
          width={120}
          height={120}
          className="h-[120px] w-[120px] object-contain"
          priority
        />
      </div>

      <div className="flex w-full flex-col gap-[6px]">
        <label
          className="m-0 text-[12px] leading-none font-normal text-[#405C62]"
          htmlFor="username"
        >
          Usuario
        </label>
        <input
          className="h-[44px] w-full rounded-[12px] border border-[#B3B5B3] bg-white px-3 text-[14px] leading-none font-normal text-[#0D3233] outline-none placeholder:text-[#8A9BA7]"
          id="username"
          name="username"
          type="email"
          placeholder="usuario@empresa.com"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>

      <div className="flex w-full flex-col gap-[6px]">
        <label
          className="m-0 text-[12px] leading-none font-normal text-[#405C62]"
          htmlFor="password"
        >
          Contrasena
        </label>
        <input
          className="h-[44px] w-full rounded-[12px] border border-[#B3B5B3] bg-white px-3 text-[14px] leading-none font-normal text-[#0D3233] outline-none placeholder:text-[#8A9BA7]"
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="********"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </div>

      <button
        className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[12px] leading-none font-normal text-[#5A7984]"
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
      </button>

      {state.error ? (
        <p className="m-0 text-[12px] leading-[1.3] font-normal text-[#B42318]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="m-0 text-[12px] leading-[1.3] font-normal text-[#0D3233]">
          Sesion iniciada correctamente.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
