/**
 * API Route: Pengingat kegiatan H-1.
 *
 * Dipanggil via Vercel Cron Job setiap hari jam 01:00 UTC (08:00 WIB).
 * Mencari kegiatan yang tanggalnya = besok, lalu kirim notifikasi ke orang tua
 * semua siswa di kelas terkait.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  sendPushNotification,
  logNotification,
  buildKegiatanReminderHtml,
  supabaseAdmin,
} from "@/lib/notifications";

interface KegiatanRow { id: string; nama: string; deskripsi: string | null; tanggal: string; jam_mulai: string; jam_selesai: string }
interface KelasLinkRow { kelas_id: string }
interface SiswaRow { id: string; nama: string; email_ortu: string | null; user_id: string | null }

export async function GET(request: NextRequest) {
  try {
    // Validasi cron secret (Vercel mengirim header ini)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tanggal besok
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Cari kegiatan besok
    const { data: kegiatanRaw } = await supabaseAdmin()
      .from("kegiatan_sekolah")
      .select("id, nama, deskripsi, tanggal, jam_mulai, jam_selesai")
      .eq("tanggal", tomorrowStr)
      .is("deleted_at", null);

    const kegiatanList = (kegiatanRaw ?? []) as KegiatanRow[];

    if (kegiatanList.length === 0) {
      return NextResponse.json({ message: "Tidak ada kegiatan besok", count: 0 });
    }

    let totalSent = 0;

    for (const kegiatan of kegiatanList) {
      // Ambil kelas terkait
      const { data: kelasRaw } = await supabaseAdmin()
        .from("kegiatan_kelas")
        .select("kelas_id")
        .eq("kegiatan_id", kegiatan.id);

      const kelasIds = ((kelasRaw ?? []) as KelasLinkRow[]).map((k) => k.kelas_id);
      if (kelasIds.length === 0) continue;

      // Ambil siswa di kelas tersebut
      const { data: siswaRaw } = await supabaseAdmin()
        .from("siswa")
        .select("id, nama, email_ortu, user_id")
        .in("kelas_id", kelasIds)
        .is("deleted_at", null);

      const siswaList = (siswaRaw ?? []) as SiswaRow[];
      if (siswaList.length === 0) continue;

      const tanggalFormatted = new Date(kegiatan.tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      for (const siswa of siswaList) {
        const pesan = `Pengingat: ${kegiatan.nama} besok ${tanggalFormatted} pukul ${kegiatan.jam_mulai.slice(0, 5)}`;

        // Email
        if (siswa.email_ortu) {
          const html = buildKegiatanReminderHtml(
            siswa.nama,
            kegiatan.nama,
            tanggalFormatted,
            kegiatan.jam_mulai.slice(0, 5),
            kegiatan.jam_selesai.slice(0, 5),
            kegiatan.deskripsi
          );

          const result = await sendEmail(
            siswa.email_ortu,
            `[SMA Kartini] Pengingat: ${kegiatan.nama} Besok`,
            html
          );

          await logNotification({
            siswa_id: siswa.id,
            tipe: "reminder_kegiatan",
            pesan,
            dikirim_ke: siswa.email_ortu,
            channel: "email",
            status: result.success ? "terkirim" : "gagal",
            error_msg: result.error,
          });

          totalSent++;
        }

        // Push
        if (siswa.user_id) {
          const pushResult = await sendPushNotification(
            siswa.user_id,
            `📅 ${kegiatan.nama} Besok`,
            pesan
          );

          await logNotification({
            siswa_id: siswa.id,
            tipe: "reminder_kegiatan",
            pesan,
            dikirim_ke: "push",
            channel: "push",
            status: pushResult.success ? "terkirim" : "gagal",
            error_msg: pushResult.error,
          });
        }
      }
    }

    return NextResponse.json({
      message: `Reminder kegiatan terkirim`,
      kegiatan: kegiatanList.length,
      totalSent,
    });
  } catch (err: unknown) {
    console.error("[notify-kegiatan Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
