"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ProfileForms({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [savingProfile, startSaveProfile] = useTransition();

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    startSaveProfile(async () => {
      try {
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not save profile");
          return;
        }
        toast.success("Profile updated");
      } catch {
        toast.error("Network error");
      }
    });
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, startSavePwd] = useTransition();

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    startSavePwd(async () => {
      try {
        const res = await fetch("/api/account/profile", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not change password");
          return;
        }
        toast.success("Password updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch {
        toast.error("Network error");
      }
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveProfile} className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            disabled
            value={email}
            className="mt-1 w-full h-10 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500"
          />
          <p className="text-[11px] text-neutral-500 mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="mt-1 w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
        </div>
        <Button type="submit" disabled={savingProfile || !name.trim() || name === initialName}>
          {savingProfile ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <form onSubmit={changePassword} className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <div>
          <label className="text-sm font-medium">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
        </div>
        <Button
          type="submit"
          disabled={savingPwd || !currentPassword || !newPassword || !confirmPassword}
        >
          {savingPwd ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
