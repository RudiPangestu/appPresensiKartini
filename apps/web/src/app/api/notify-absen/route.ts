/**
 * API Route: Notifikasi saat siswa absen (sakit/izin/alpha).
 *
 * Dipanggil via:
 * 1. Supabase Database Webhook (INSERT on presensi WHERE status != 'hadir')
 * 2. Manual POST dari admin panel
 *
 * Body: { record: { siswa_id, status, tanggal, mapel_id, catatan } }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  sendPushNotification,
  logNotification,
  buildAbsenEmailHtml,
  supabaseAdmin,
} from "@/lib/notifications";

interface AbsenPayload {
  record: {
    siswa_id: string;
    status: string;
    tanggal: string;
    mapel_id: string | null;
    catatan: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validasi auth header (Supabase webhook secret atau service key)
    const authHeader = request.headers.get("authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (authHeader !== `Bearer ${serviceKey}` && authHeader !== `Bearer ${webhookSecret}`) {
      // Jika tidak ada secret dikonfigurasi, izinkan (development)
      if (serviceKey && webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as AbsenPayload;
    const { record } = body;

    if (!record?.siswa_id || !record?.status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Skip jika hadir
    if (record.status === "hadir") {
      return NextResponse.json({ message: "Status hadir, skip notifikasi" });
    }

    // Ambil data siswa + orang tua
    const { data: siswaRaw } = await supabaseAdmin()
      .from("siswa")
      .select("nama, email_ortu, hp_ortu, user_id")
      .eq("id", record.siswa_id)
      .single();

    const siswa = siswaRaw as { nama: string; email_ortu: string | null; hp_ortu: string | null; user_id: string | null } | null;

    if (!siswa) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Ambil nama mapel
    let mapelName = "—";
    if (record.mapel_id) {
      const { data: mapelRaw } = await supabaseAdmin()
        .from("mata_pelajaran")
        .select("nama")
        .eq("id", record.mapel_id)
        .single();
      const mapel = mapelRaw as { nama: string } | null;
      mapelName = mapel?.nama ?? "—";
    }

    const tanggalFormatted = new Date(record.tanggal).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pesan = `${siswa.nama} ${record.status} pada ${tanggalFormatted} (${mapelName})`;
    const results: { channel: string; success: boolean; error?: string }[] = [];

    // 1. Email ke orang tua
    if (siswa.email_ortu) {
      const html = buildAbsenEmailHtml(
        siswa.nama,
        record.status,
        tanggalFormatted,
        mapelName,
        record.catatan
      );

      const emailResult = await sendEmail(
        siswa.email_ortu,
        `[SMA Kartini] ${siswa.nama} - ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`,
        html
      );

      results.push({ channel: "email", ...emailResult });

      await logNotification({
        siswa_id: record.siswa_id,
        tipe: "absen",
        pesan,
        dikirim_ke: siswa.email_ortu,
        channel: "email",
        status: emailResult.success ? "terkirim" : "gagal",
        error_msg: emailResult.error,
      });
    }

    // 2. Push notification ke orang tua
    if (siswa.user_id) {
      const pushResult = await sendPushNotification(
        siswa.user_id,
        `${siswa.nama} - ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`,
        pesan
      );

      results.push({ channel: "push", ...pushResult });

      if (siswa.email_ortu || siswa.hp_ortu) {
        await logNotification({
          siswa_id: record.siswa_id,
          tipe: "absen",
          pesan,
          dikirim_ke: siswa.hp_ortu ?? siswa.email_ortu ?? "push",
          channel: "push",
          status: pushResult.success ? "terkirim" : "gagal",
          error_msg: pushResult.error,
        });
      }
    }

    return NextResponse.json({
      message: "Notifikasi diproses",
      siswa: siswa.nama,
      results,
    });
  } catch (err: unknown) {
    console.error("[notify-absen Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
