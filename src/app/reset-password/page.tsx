import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-sm text-neutral-500">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
