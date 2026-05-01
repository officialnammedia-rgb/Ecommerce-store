"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const STATUS_OPTIONS = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"] as const;

export function ReturnAdminActions({
  id,
  currentStatus,
  currentNote,
  currentRefund,
  maxRefundPaise,
}: {
  id: string;
  currentStatus: string;
  currentNote: string;
  currentRefund: number | null;
  maxRefundPaise: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote);
  const [refundRupees, setRefundRupees] = useState(
    currentRefund != null ? String(Math.round(currentRefund / 100)) : "",
  );
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const refundPaise = refundRupees ? Math.round(Number(refundRupees) * 100) : null;
        if (refundPaise != null && refundPaise > maxRefundPaise) {
          toast.error(`Refund cannot exceed order total ₹${Math.round(maxRefundPaise / 100)}`);
          return;
        }
        const res = await fetch(`/api/admin/returns/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status,
            adminNote: note || null,
            refundAmount: refundPaise,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not save");
          return;
        }
        toast.success("Return updated");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs underline text-neutral-700 hover:text-neutral-900"
      >
        Manage
      </button>
    );
  }

  return (
    <div className="space-y-2 min-w-[220px]">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full h-9 rounded-md border border-neutral-300 px-2 text-xs"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        max={Math.round(maxRefundPaise / 100)}
        placeholder={`Refund ₹ (max ${Math.round(maxRefundPaise / 100)})`}
        value={refundRupees}
        onChange={(e) => setRefundRupees(e.target.value)}
        className="w-full h-9 rounded-md border border-neutral-300 px-2 text-xs"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Internal/customer note"
        rows={2}
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 h-7 rounded-md bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="flex-1 h-7 rounded-md border border-neutral-300 text-xs hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
