"use client";

import { useSearchParams } from "next/navigation";
import { getLoginUrlErrorMessage } from "@/app/auth/auth-flow.mjs";
import LoginForm from "../login-form";

export default function LoginUrlError() {
  const searchParams = useSearchParams();
  const urlError = getLoginUrlErrorMessage(searchParams.get("error"));

  return <LoginForm urlError={urlError} />;
}
