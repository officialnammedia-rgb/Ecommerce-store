"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; message: string; variant: ToastVariant };

type ToastApi = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, variant }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const api: ToastApi = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const styles: Record<ToastVariant, { bg: string; ring: string; Icon: typeof CheckCircle2 }> = {
    success: { bg: "bg-emerald-50 text-emerald-900", ring: "ring-emerald-200", Icon: CheckCircle2 },
    error: { bg: "bg-rose-50 text-rose-900", ring: "ring-rose-200", Icon: AlertCircle },
    info: { bg: "bg-neutral-900 text-white", ring: "ring-neutral-700", Icon: Info },
  };
  const s = styles[toast.variant];
  const Icon = s.Icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg shadow-lg ring-1 px-4 py-3 transition-all duration-200",
        s.bg,
        s.ring,
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
      )}
      role="status"
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
