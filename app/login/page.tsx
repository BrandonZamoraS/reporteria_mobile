import { Suspense } from "react";
import LoginForm from "../login-form";
import LoginUrlError from "./login-url-error";

export default function LoginPage() {
  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9]">
      <section className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9] p-[25px] pb-[calc(25px+env(safe-area-inset-bottom))] pt-[calc(25px+env(safe-area-inset-top))]">
        <Suspense fallback={<LoginForm />}>
          <LoginUrlError />
        </Suspense>
      </section>
    </main>
  );
}
