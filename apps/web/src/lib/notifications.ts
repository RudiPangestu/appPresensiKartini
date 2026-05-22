/**
 * Notification service — email, push, dan logging.
 * Menggunakan Nodemailer untuk email, FCM placeholder untuk push.
 */

import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import type { NotificationType, NotificationChannel, NotificationStatus } from "@/types/database";

// ── Supabase Admin Client (service role, lazy init) ───────
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars belum dikonfigurasi");
    _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabaseAdmin;
}

// ── Email Transporter (Gmail SMTP) ────────────────────────
function getEmailTransporter() {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Kirim email notifikasi.
 * @returns true jika berhasil, false jika gagal
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, error: "SMTP belum dikonfigurasi" };
    }

    await transporter.sendMail({
      from: `"SMA Kartini Batam" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    console.error("[Email Error]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Kirim push notification via FCM.
 * Saat ini placeholder — akan aktif begitu Firebase credentials diisi.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ambil FCM token user
    const { data: tokens } = await getSupabaseAdmin()
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", userId);

    if (!tokens || tokens.length === 0) {
      return { success: false, error: "Tidak ada FCM token terdaftar" };
    }

    // Cek apakah Firebase credentials tersedia
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.log("[Push] Firebase belum dikonfigurasi, skip push notification");
      return { success: false, error: "Firebase belum dikonfigurasi" };
    }

    // FCM v1 HTTP API (tanpa firebase-admin SDK)
    const accessToken = await getFirebaseAccessToken();
    if (!accessToken) {
      return { success: false, error: "Gagal mendapatkan Firebase access token" };
    }

    for (const { token } of tokens) {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: { type: "notification" },
            },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("[FCM Error]", errText);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown push error";
    console.error("[Push Error]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Dapatkan Firebase access token via service account JWT.
 * Placeholder — implementasi penuh memerlukan JWT signing.
 */
async function getFirebaseAccessToken(): Promise<string | null> {
  // Jika menggunakan Google Auth Library, bisa diimplementasikan di sini.
  // Untuk saat ini, return null jika belum dikonfigurasi.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) return null;

  // TODO: Implementasi JWT signing untuk mendapatkan access token
  // Memerlukan library: google-auth-library
  console.log("[Firebase] Service account tersedia, tapi JWT signing belum diimplementasikan");
  return null;
}

/**
 * Log notifikasi ke tabel notifikasi_log.
 */
export async function logNotification(params: {
  siswa_id: string;
  tipe: NotificationType;
  pesan: string;
  dikirim_ke: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  error_msg?: string;
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseAdmin().from("notifikasi_log") as any).insert({
    siswa_id: params.siswa_id,
    tipe: params.tipe,
    pesan: params.pesan,
    dikirim_ke: params.dikirim_ke,
    channel: params.channel,
    status: params.status,
    error_msg: params.error_msg ?? null,
  });

  if (error) {
    console.error("[Log Notifikasi Error]", error.message);
  }
}

/**
 * Template email untuk ketidakhadiran.
 */
export function buildAbsenEmailHtml(
  siswaName: string,
  status: string,
  tanggal: string,
  mapelName: string,
  catatan?: string | null
): string {
  const statusColor = status === "alpha" ? "#ef4444" : status === "sakit" ? "#eab308" : "#3b82f6";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 18px;">🏫 SMA Kartini Batam</h2>
        <p style="color: #dbeafe; margin: 4px 0 0; font-size: 13px;">Notifikasi Kehadiran</p>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Yth. Orang Tua / Wali,<br><br>
          Kami informasikan bahwa anak Anda:
        </p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Nama:</strong> ${siswaName}</p>
          <p style="margin: 0 0 8px;"><strong>Tanggal:</strong> ${tanggal}</p>
          <p style="margin: 0 0 8px;"><strong>Mata Pelajaran:</strong> ${mapelName}</p>
          <p style="margin: 0;">
            <strong>Status:</strong>
            <span style="background: ${statusColor}; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${statusLabel}</span>
          </p>
          ${catatan ? `<p style="margin: 8px 0 0;"><strong>Catatan:</strong> ${catatan}</p>` : ""}
        </div>
        <p style="color: #64748b; font-size: 13px; margin-top: 16px;">
          Jika ada pertanyaan, silakan hubungi pihak sekolah.<br>
          Terima kasih.
        </p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
        Email ini dikirim otomatis oleh Sistem Presensi SMA Kartini Batam
      </p>
    </div>
  `;
}

/**
 * Template email untuk pengingat kegiatan H-1.
 */
export function buildKegiatanReminderHtml(
  siswaName: string,
  kegiatanName: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  deskripsi?: string | null
): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 18px;">📅 Pengingat Kegiatan</h2>
        <p style="color: #fef3c7; margin: 4px 0 0; font-size: 13px;">SMA Kartini Batam</p>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Yth. Orang Tua / Wali dari <strong>${siswaName}</strong>,<br><br>
          Mengingatkan bahwa <strong>besok</strong> akan ada kegiatan sekolah:
        </p>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #92400e;">${kegiatanName}</p>
          <p style="margin: 0 0 4px;"><strong>Tanggal:</strong> ${tanggal}</p>
          <p style="margin: 0;"><strong>Waktu:</strong> ${jamMulai} — ${jamSelesai}</p>
          ${deskripsi ? `<p style="margin: 8px 0 0; color: #78350f;">${deskripsi}</p>` : ""}
        </div>
        <p style="color: #64748b; font-size: 13px;">
          Mohon pastikan anak Anda hadir tepat waktu. Terima kasih.
        </p>
      </div>
    </div>
  `;
}

export { getSupabaseAdmin as supabaseAdmin };
