/**
 * @sma-kartini/shared
 * Shared types, constants, dan utilities untuk Sistem Presensi SMA Kartini Batam.
 */

// ── Role Types ─────────────────────────────────────────────
export type UserRole = 'admin' | 'guru' | 'ortu';

// ── Attendance Status ──────────────────────────────────────
export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpha';

// ── Grade Levels ───────────────────────────────────────────
export type Tingkat = 'X' | 'XI' | 'XII';

// ── Days of Week ───────────────────────────────────────────
export type Hari = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

// ── Gender ─────────────────────────────────────────────────
export type JenisKelamin = 'L' | 'P';

// ── Notification Types ─────────────────────────────────────
export type NotificationType = 'absen' | 'reminder_kegiatan' | 'rekap_mingguan';
export type NotificationChannel = 'push' | 'email' | 'whatsapp';
export type NotificationStatus = 'terkirim' | 'gagal' | 'pending';

// ── Platform ───────────────────────────────────────────────
export type Platform = 'ios' | 'android';

// ── Constants ──────────────────────────────────────────────
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: 'Hadir',
  sakit: 'Sakit',
  izin: 'Izin',
  alpha: 'Alpha',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  hadir: '#22c55e',  // green
  sakit: '#eab308',  // yellow
  izin: '#3b82f6',   // blue
  alpha: '#ef4444',  // red
};

export const TINGKAT_OPTIONS: Tingkat[] = ['X', 'XI', 'XII'];

export const HARI_OPTIONS: Hari[] = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

export const MIN_ATTENDANCE_PERCENTAGE = 75;
