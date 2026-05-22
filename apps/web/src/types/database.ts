/**
 * Type definitions untuk Supabase database tables.
 * Nantinya bisa di-generate otomatis dari Supabase CLI:
 * npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type UserRole = "admin" | "guru" | "ortu";
export type AttendanceStatus = "hadir" | "sakit" | "izin" | "alpha";
export type Tingkat = "X" | "XI" | "XII";
export type Hari = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
export type JenisKelamin = "L" | "P";
export type NotificationType = "absen" | "reminder_kegiatan" | "rekap_mingguan";
export type NotificationChannel = "push" | "email" | "whatsapp";
export type NotificationStatus = "terkirim" | "gagal" | "pending";

// ── Table Row Types ────────────────────────────────────────

export interface User {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  nama: string;
  no_hp: string | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TahunAjaran {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  aktif: boolean;
  created_at: string;
}

export interface Guru {
  id: string;
  user_id: string;
  nip: string | null;
  nama: string;
  bidang_studi: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: Tingkat;
  wali_kelas_id: string | null;
  tahun_ajaran_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  jenis_kelamin: JenisKelamin | null;
  kelas_id: string | null;
  nama_ortu: string | null;
  hp_ortu: string | null;
  email_ortu: string | null;
  foto_url: string | null;
  user_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MataPelajaran {
  id: string;
  nama: string;
  kode: string;
  guru_id: string | null;
  kelas_id: string | null;
  hari: Hari | null;
  jam_mulai: string;
  jam_selesai: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KegiatanSekolah {
  id: string;
  nama: string;
  deskripsi: string | null;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KegiatanKelas {
  id: string;
  kegiatan_id: string;
  kelas_id: string;
}

export interface Presensi {
  id: string;
  siswa_id: string;
  mapel_id: string | null;
  kegiatan_id: string | null;
  tanggal: string;
  status: AttendanceStatus;
  catatan: string | null;
  dicatat_oleh: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotifikasiLog {
  id: string;
  siswa_id: string | null;
  tipe: NotificationType;
  pesan: string;
  dikirim_ke: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  error_msg: string | null;
  created_at: string;
}

export interface FcmToken {
  id: string;
  user_id: string;
  token: string;
  platform: "ios" | "android";
  updated_at: string;
}

// ── View Types ─────────────────────────────────────────────

export interface RekapHarian {
  kelas_id: string;
  kelas_nama: string;
  tingkat: Tingkat;
  tanggal: string;
  total_siswa: number;
  jumlah_hadir: number;
  jumlah_sakit: number;
  jumlah_izin: number;
  jumlah_alpha: number;
  persen_hadir: number;
}

export interface StatistikSiswa {
  siswa_id: string;
  siswa_nama: string;
  nisn: string;
  kelas_id: string;
  kelas_nama: string;
  total_pertemuan: number;
  jumlah_hadir: number;
  jumlah_sakit: number;
  jumlah_izin: number;
  jumlah_alpha: number;
  persen_hadir: number;
}
