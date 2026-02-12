import LoginForm from "../login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#E9EDE9] md:p-6">
      <section className="flex min-h-svh w-full max-w-[390px] items-center justify-center bg-[#E9EDE9] p-[25px] md:min-h-[844px]">
        <LoginForm />
      </section>
    </main>
  );
}
