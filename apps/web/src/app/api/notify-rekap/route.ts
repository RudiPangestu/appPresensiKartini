/**
 * API Route: Rekap kehadiran mingguan.
 *
 * Dipanggil via Vercel Cron Job setiap Jumat jam 09:00 UTC (16:00 WIB).
 * Mengirim email rekap kehadiran minggu ini ke semua orang tua.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  logNotification,
  supabaseAdmin,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    // Validasi cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hitung range minggu ini (Senin - Jumat)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const startDate = monday.toISOString().split("T")[0];
    const endDate = friday.toISOString().split("T")[0];

    // Ambil semua siswa yang punya email orang tua
    const { data: siswaRaw } = await supabaseAdmin()
      .from("siswa")
      .select("id, nama, email_ortu, kelas(nama)")
      .not("email_ortu", "is", null)
      .is("deleted_at", null);

    const siswaList = (siswaRaw ?? []) as unknown as {
      id: string; nama: string; email_ortu: string;
      kelas: { nama: string } | null;
    }[];

    if (siswaList.length === 0) {
      return NextResponse.json({ message: "Tidak ada siswa dengan email ortu", count: 0 });
    }

    let totalSent = 0;

    for (const siswa of siswaList) {

      // Ambil presensi minggu ini
      const { data: presensiRaw } = await supabaseAdmin()
        .from("presensi")
        .select("status")
        .eq("siswa_id", siswa.id)
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      const rows = (presensiRaw ?? []) as { status: string }[];
      const total = rows.length;
      const hadir = rows.filter((r) => r.status === "hadir").length;
      const sakit = rows.filter((r) => r.status === "sakit").length;
      const izin = rows.filter((r) => r.status === "izin").length;
      const alpha = rows.filter((r) => r.status === "alpha").length;
      const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

      if (total === 0) continue; // Skip jika tidak ada data

      const periodeLabel = `${new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — ${new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;

      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 18px;">📊 Rekap Kehadiran Mingguan</h2>
            <p style="color: #e9d5ff; margin: 4px 0 0; font-size: 13px;">SMA Kartini Batam · ${periodeLabel}</p>
          </div>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #334155; font-size: 14px;">
              Yth. Orang Tua / Wali dari <strong>${siswa.nama}</strong>
              ${siswa.kelas ? ` (Kelas ${siswa.kelas.nama})` : ""},
            </p>
            <p style="color: #64748b; font-size: 13px;">
              Berikut rekap kehadiran minggu ini:
            </p>

            <div style="display: flex; gap: 8px; margin: 16px 0; text-align: center;">
              <div style="flex:1; background: #f0fdf4; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 800; color: #16a34a;">${hadir}</div>
                <div style="font-size: 11px; color: #166534;">Hadir</div>
              </div>
              <div style="flex:1; background: #fefce8; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 800; color: #ca8a04;">${sakit}</div>
                <div style="font-size: 11px; color: #854d0e;">Sakit</div>
              </div>
              <div style="flex:1; background: #eff6ff; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 800; color: #2563eb;">${izin}</div>
                <div style="font-size: 11px; color: #1e40af;">Izin</div>
              </div>
              <div style="flex:1; background: #fef2f2; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${alpha}</div>
                <div style="font-size: 11px; color: #991b1b;">Alpha</div>
              </div>
            </div>

            <div style="background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center;">
              <span style="font-size: 13px; color: #64748b;">Persentase Kehadiran:</span>
              <span style="font-size: 20px; font-weight: 800; color: ${persen >= 90 ? "#16a34a" : persen >= 75 ? "#ca8a04" : "#dc2626"}; margin-left: 8px;">${persen}%</span>
            </div>

            <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
              Total ${total} sesi pelajaran tercatat minggu ini.
            </p>
          </div>
        </div>
      `;

      const emailResult = await sendEmail(
        siswa.email_ortu,
        `[SMA Kartini] Rekap Mingguan - ${siswa.nama} (${persen}% Hadir)`,
        html
      );

      const pesan = `Rekap minggu ${periodeLabel}: ${hadir}H ${sakit}S ${izin}I ${alpha}A (${persen}%)`;

      await logNotification({
        siswa_id: siswa.id,
        tipe: "rekap_mingguan",
        pesan,
        dikirim_ke: siswa.email_ortu,
        channel: "email",
        status: emailResult.success ? "terkirim" : "gagal",
        error_msg: emailResult.error,
      });

      totalSent++;
    }

    return NextResponse.json({
      message: "Rekap mingguan terkirim",
      totalSent,
      periode: `${startDate} — ${endDate}`,
    });
  } catch (err: unknown) {
    console.error("[notify-rekap Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
