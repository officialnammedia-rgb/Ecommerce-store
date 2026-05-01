"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type AddressDTO = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const empty = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
};

export function AddressBook({ initialAddresses }: { initialAddresses: AddressDTO[] }) {
  const toast = useToast();
  const [addresses, setAddresses] = useState<AddressDTO[]>(initialAddresses);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [pending, startTransition] = useTransition();

  function startNew() {
    setEditingId("new");
    setForm({ ...empty, isDefault: addresses.length === 0 });
  }
  function startEdit(a: AddressDTO) {
    setEditingId(a.id);
    setForm({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country || "IN",
      isDefault: a.isDefault,
    });
  }
  function cancel() {
    setEditingId(null);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const isNew = editingId === "new";
        const url = isNew
          ? "/api/account/addresses"
          : `/api/account/addresses/${editingId}`;
        const method = isNew ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...form, line2: form.line2 || null }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not save address");
          return;
        }
        // Refetch to keep ordering & defaults consistent.
        const fresh = await fetch("/api/account/addresses").then((r) => r.json());
        setAddresses(fresh.addresses ?? []);
        setEditingId(null);
        toast.success(isNew ? "Address added" : "Address updated");
      } catch {
        toast.error("Network error");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this address?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not delete address");
          return;
        }
        const fresh = await fetch("/api/account/addresses").then((r) => r.json());
        setAddresses(fresh.addresses ?? []);
        toast.success("Address removed");
      } catch {
        toast.error("Network error");
      }
    });
  }

  function makeDefault(a: AddressDTO) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/account/addresses/${a.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fullName: a.fullName,
            phone: a.phone,
            line1: a.line1,
            line2: a.line2,
            city: a.city,
            state: a.state,
            postalCode: a.postalCode,
            country: a.country || "IN",
            isDefault: true,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not set default");
          return;
        }
        const fresh = await fetch("/api/account/addresses").then((r) => r.json());
        setAddresses(fresh.addresses ?? []);
        toast.success("Default address updated");
      } catch {
        toast.error("Network error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && editingId !== "new" && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No saved addresses yet.
        </div>
      )}

      <ul className="space-y-3">
        {addresses.map((a) =>
          editingId === a.id ? (
            <li key={a.id}>
              <AddressForm
                form={form}
                setForm={setForm}
                onSubmit={save}
                onCancel={cancel}
                pending={pending}
              />
            </li>
          ) : (
            <li
              key={a.id}
              className="rounded-lg border border-neutral-200 p-4 flex items-start justify-between gap-4 flex-wrap"
            >
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{a.fullName}</p>
                  {a.isDefault && (
                    <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-neutral-600 mt-1">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.postalCode}
                  <br />
                  {a.country} · {a.phone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(a)}
                    disabled={pending}
                    className="text-xs underline text-neutral-600 hover:text-neutral-900"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="text-xs underline text-neutral-600 hover:text-neutral-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  className="text-xs underline text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      {editingId === "new" ? (
        <AddressForm
          form={form}
          setForm={setForm}
          onSubmit={save}
          onCancel={cancel}
          pending={pending}
        />
      ) : (
        <Button type="button" variant="outline" onClick={startNew}>
          + Add new address
        </Button>
      )}
    </div>
  );
}

function AddressForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  pending,
}: {
  form: typeof empty;
  setForm: (f: typeof empty) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  function input<K extends keyof typeof empty>(
    key: K,
    label: string,
    extra?: { required?: boolean; placeholder?: string; type?: string },
  ) {
    return (
      <div>
        <label className="text-xs font-medium text-neutral-700">{label}</label>
        <input
          type={extra?.type ?? "text"}
          required={extra?.required}
          placeholder={extra?.placeholder}
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1 w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        />
      </div>
    );
  }
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-neutral-300 bg-neutral-50 p-4 space-y-3"
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {input("fullName", "Full name", { required: true })}
        {input("phone", "Phone", { required: true, type: "tel" })}
      </div>
      {input("line1", "Address line 1", { required: true, placeholder: "House / Flat / Street" })}
      {input("line2", "Address line 2 (optional)")}
      <div className="grid sm:grid-cols-3 gap-3">
        {input("city", "City", { required: true })}
        {input("state", "State", { required: true })}
        {input("postalCode", "PIN code", { required: true })}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="h-4 w-4 rounded border-neutral-300"
        />
        Use as default shipping address
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save address"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
