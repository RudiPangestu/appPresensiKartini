import { z } from "zod";

// ── User Schemas ───────────────────────────────────────────
export const createUserSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "guru", "ortu"], { required_error: "Pilih role" }),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "guru", "ortu"]),
});

// ── Guru Schemas ───────────────────────────────────────────
export const guruSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  nip: z.string().optional().or(z.literal("")),
  bidang_studi: z.string().optional().or(z.literal("")),
  user_id: z.string().uuid("User ID tidak valid").optional().or(z.literal("")),
});

// ── Kelas Schemas ──────────────────────────────────────────
export const kelasSchema = z.object({
  nama: z.string().min(1, "Nama kelas wajib diisi"),
  tingkat: z.enum(["X", "XI", "XII"], { required_error: "Pilih tingkat" }),
  wali_kelas_id: z.string().optional().or(z.literal("")),
  tahun_ajaran_id: z.string().optional().or(z.literal("")),
});

// ── Siswa Schemas ──────────────────────────────────────────
export const siswaSchema = z.object({
  nisn: z.string().min(1, "NISN wajib diisi"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  jenis_kelamin: z.enum(["L", "P"]).optional(),
  kelas_id: z.string().optional().or(z.literal("")),
  nama_ortu: z.string().optional().or(z.literal("")),
  hp_ortu: z.string().optional().or(z.literal("")),
  email_ortu: z.string().email("Email tidak valid").optional().or(z.literal("")),
});

// ── Mata Pelajaran Schemas ─────────────────────────────────
export const mataPelajaranSchema = z.object({
  nama: z.string().min(1, "Nama mapel wajib diisi"),
  kode: z.string().min(1, "Kode mapel wajib diisi"),
  guru_id: z.string().optional().or(z.literal("")),
  kelas_id: z.string().optional().or(z.literal("")),
  hari: z.enum(["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]).optional(),
  jam_mulai: z.string().min(1, "Jam mulai wajib diisi"),
  jam_selesai: z.string().min(1, "Jam selesai wajib diisi"),
});

// ── Kegiatan Schemas ───────────────────────────────────────
export const kegiatanSchema = z.object({
  nama: z.string().min(1, "Nama kegiatan wajib diisi"),
  deskripsi: z.string().optional().or(z.literal("")),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  jam_mulai: z.string().min(1, "Jam mulai wajib diisi"),
  jam_selesai: z.string().min(1, "Jam selesai wajib diisi"),
});

// ── Presensi Schemas ───────────────────────────────────────
export const presensiItemSchema = z.object({
  siswa_id: z.string().uuid(),
  status: z.enum(["hadir", "sakit", "izin", "alpha"]),
  catatan: z.string().optional().or(z.literal("")),
});

export const submitPresensiSchema = z.object({
  mapel_id: z.string().uuid("Pilih mata pelajaran"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  items: z.array(presensiItemSchema).min(1, "Minimal 1 siswa"),
});

// ── Profile Schema ─────────────────────────────────────────
export const profileSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  no_hp: z.string().optional().or(z.literal("")),
});

// ── Type Exports ───────────────────────────────────────────
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GuruInput = z.infer<typeof guruSchema>;
export type KelasInput = z.infer<typeof kelasSchema>;
export type SiswaInput = z.infer<typeof siswaSchema>;
export type MataPelajaranInput = z.infer<typeof mataPelajaranSchema>;
export type KegiatanInput = z.infer<typeof kegiatanSchema>;
export type SubmitPresensiInput = z.infer<typeof submitPresensiSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
