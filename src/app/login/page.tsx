import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-sm text-neutral-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
