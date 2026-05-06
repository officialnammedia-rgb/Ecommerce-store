import { cookies } from "next/headers";

const COOKIE = "ascendyl_favs";

export function readFavoriteIds(): string[] {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isFavorited(productId: string): boolean {
  return readFavoriteIds().includes(productId);
}
