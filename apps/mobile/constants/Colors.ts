/** Konstanta warna dan styling untuk app SMA Kartini */

export type AttendanceStatus = "hadir" | "sakit" | "izin" | "alpha";

export const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; border: string }> = {
  hadir: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  sakit: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  izin: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  alpha: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
};

export const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const Colors = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  background: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  inputBg: "#f1f5f9",
};

export default Colors;
