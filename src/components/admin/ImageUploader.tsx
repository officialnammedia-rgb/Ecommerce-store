"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

export function ImageUploader({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Upload failed");
        }
        const data = await res.json();
        urls.push(data.url);
      }
      setValue((v) => (v ? `${v}\n${urls.join("\n")}` : urls.join("\n")));
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        name={name}
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://...\nhttps://..."
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-mono"
      />
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          className="hidden"
          id={`upload-${name}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload images"}
        </Button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      {value && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value
            .split(/\r?\n/)
            .map((u) => u.trim())
            .filter(Boolean)
            .map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt="" className="w-20 h-20 object-cover rounded border" />
            ))}
        </div>
      )}
    </div>
  );
}
