"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, School, ClipboardCheck, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { AttendanceTrendChart, type TrendDataPoint } from "@/components/shared/attendance-trend-chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RekapHarian, StatistikSiswa, AttendanceStatus } from "@/types/database";

export default function AdminDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ siswa: 0, guru: 0, kelas: 0, persen: 0 });
  const [rekap, setRekap] = useState<RekapHarian[]>([]);
  const [perhatian, setPerhatian] = useState<StatistikSiswa[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [siswaRes, guruRes, kelasRes, rekapRes, perhatianRes] = await Promise.all([
          supabase.from("siswa").select("id", { count: "exact", head: true }).is("deleted_at", null),
          supabase.from("guru").select("id", { count: "exact", head: true }).is("deleted_at", null),
          supabase.from("kelas").select("id", { count: "exact", head: true }).is("deleted_at", null),
          supabase.from("v_rekap_harian").select("*"),
          supabase.from("v_siswa_perlu_perhatian").select("*").limit(5),
        ]);

        const totalSiswa = siswaRes.count ?? 0;
        const totalGuru = guruRes.count ?? 0;
        const totalKelas = kelasRes.count ?? 0;

        const rekapData = (rekapRes.data ?? []) as RekapHarian[];
        const totalHadir = rekapData.reduce((s, r) => s + r.jumlah_hadir, 0);
        const totalAll = rekapData.reduce((s, r) => s + r.total_siswa, 0);
        const persen = totalAll > 0 ? Math.round((totalHadir / totalAll) * 100) : 0;

        setStats({ siswa: totalSiswa, guru: totalGuru, kelas: totalKelas, persen });
        setRekap(rekapData);
        setPerhatian((perhatianRes.data ?? []) as StatistikSiswa[]);

        // Load 7-day trend
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const { data: trendRows } = await supabase
          .from("presensi")
          .select("tanggal, status")
          .gte("tanggal", sevenDaysAgo.toISOString().split("T")[0])
          .lte("tanggal", today.toISOString().split("T")[0]);

        const dayMap = new Map<string, { hadir: number; sakit: number; izin: number; alpha: number; total: number }>();
        for (const row of (trendRows ?? []) as { tanggal: string; status: AttendanceStatus }[]) {
          if (!dayMap.has(row.tanggal)) dayMap.set(row.tanggal, { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 });
          const d = dayMap.get(row.tanggal)!;
          d[row.status]++;
          d.total++;
        }
        setTrendData(
          Array.from(dayMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, d]) => ({
              label: new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
              hadir: d.hadir, sakit: d.sakit, izin: d.izin, alpha: d.alpha,
              persen_hadir: d.total > 0 ? Math.round((d.hadir / d.total) * 100) : 0,
            }))
        );
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground">Ringkasan data dan statistik sistem presensi SMA Kartini.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.siswa}</div>
            <p className="text-xs text-muted-foreground">Siswa aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.guru}</div>
            <p className="text-xs text-muted-foreground">Guru aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.kelas}</div>
            <p className="text-xs text-muted-foreground">Kelas aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.persen}%</div>
            <p className="text-xs text-muted-foreground">Rata-rata semua kelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Alert */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Rekap Per Kelas Hari Ini</CardTitle></CardHeader>
          <CardContent>
            {rekap.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Belum ada data presensi hari ini</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rekap}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="kelas_nama" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="jumlah_hadir" name="Hadir" fill="hsl(142,71%,45%)" radius={[4,4,0,0]} />
                  <Bar dataKey="jumlah_alpha" name="Alpha" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Siswa Perlu Perhatian
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perhatian.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Semua siswa kehadiran baik (&ge;75%)</div>
            ) : (
              <div className="space-y-3">
                {perhatian.map((s) => (
                  <div key={s.siswa_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium text-sm">{s.siswa_nama}</p>
                      <p className="text-xs text-muted-foreground">{s.kelas_nama} · NISN {s.nisn}</p>
                    </div>
                    <span className="text-sm font-bold text-destructive">{s.persen_hadir}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Trend */}
      <AttendanceTrendChart data={trendData} title="Tren Kehadiran 7 Hari Terakhir" />
    </div>
  );
}
