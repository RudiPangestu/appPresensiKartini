import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format tanggal ke locale Indonesia
 * @example formatDate("2026-05-02") => "2 Mei 2026"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format waktu ke locale Indonesia
 * @example formatTime("07:30") => "07.30"
 */
export function formatTime(time: string): string {
  return time.replace(":", ".");
}
