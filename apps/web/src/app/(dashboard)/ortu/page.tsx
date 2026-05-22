"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ClipboardCheck, AlertTriangle, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { AttendanceStatusBadge } from "@/components/shared/attendance-status-badge";
import { PercentageRing } from "@/components/shared/percentage-ring";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { AttendanceStatus } from "@/types/database";

const STATUS_COLORS = { hadir: "#22c55e", sakit: "#eab308", izin: "#3b82f6", alpha: "#ef4444" };

interface PresensiRow { tanggal: string; status: AttendanceStatus; mapel_nama: string; catatan: string | null; }

export default function OrtuDashboard() {
  const supabase = createClient();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [siswaName, setSiswaName] = useState("");
  const [kelasName, setKelasName] = useState("");
  const [stats, setStats] = useState({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0 });
  const [recentList, setRecentList] = useState<PresensiRow[]>([]);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        // Cari siswa yang terhubung ke user ortu
        const { data: siswa } = await supabase.from("siswa").select("id, nama, kelas(nama)").eq("user_id", user!.id).single();
        if (!siswa) { setLoading(false); return; }

        setSiswaName(siswa.nama);
        const kelasData = siswa.kelas as unknown as Record<string, unknown> | null;
        setKelasName((kelasData?.nama as string) ?? "—");

        // Query presensi siswa bulan ini
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

        const { data: presensiList } = await supabase
          .from("presensi")
          .select("tanggal, status, catatan, mata_pelajaran(nama)")
          .eq("siswa_id", siswa.id)
          .gte("tanggal", startOfMonth)
          .lte("tanggal", endOfMonth)
          .order("tanggal", { ascending: false });

        const rows = (presensiList ?? []).map((p: Record<string, unknown>) => ({
          tanggal: p.tanggal as string,
          status: p.status as AttendanceStatus,
          catatan: p.catatan as string | null,
          mapel_nama: ((p.mata_pelajaran as Record<string, unknown>)?.nama as string) ?? "—",
        }));

        const total = rows.length;
        const hadir = rows.filter((r) => r.status === "hadir").length;
        const sakit = rows.filter((r) => r.status === "sakit").length;
        const izin = rows.filter((r) => r.status === "izin").length;
        const alpha = rows.filter((r) => r.status === "alpha").length;
        const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

        setStats({ total, hadir, sakit, izin, alpha, persen });
        setRecentList(rows.slice(0, 10));
      } catch (err) { console.error("Error loading ortu dashboard:", err); }
      finally { setLoading(false); }
    }
    loadData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Orang Tua</h1>
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    );
  }

  const pieData = [
    { name: "Hadir", value: stats.hadir, color: STATUS_COLORS.hadir },
    { name: "Sakit", value: stats.sakit, color: STATUS_COLORS.sakit },
    { name: "Izin", value: stats.izin, color: STATUS_COLORS.izin },
    { name: "Alpha", value: stats.alpha, color: STATUS_COLORS.alpha },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Orang Tua</h1>
        <p className="text-muted-foreground">{siswaName} · {kelasName} · Bulan {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Kehadiran Bulan Ini</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.persen}%</div><p className="text-xs text-muted-foreground">Persentase hadir</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Pertemuan</CardTitle><ClipboardCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Bulan ini</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Alpha</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.alpha}</div><p className="text-xs text-muted-foreground">Kali bulan ini</p></CardContent>
        </Card>
      </div>

      {/* Chart + Ring */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Breakdown Kehadiran</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {stats.total === 0 ? (
              <p className="text-sm text-muted-foreground py-8">Belum ada data presensi bulan ini</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Persentase Kehadiran</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            <PercentageRing percentage={stats.persen} size={160} label="Kehadiran Bulan Ini" />
          </CardContent>
        </Card>
      </div>

      {/* Recent attendance */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Presensi Terbaru</CardTitle></CardHeader>
        <CardContent>
          {recentList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data presensi</p>
          ) : (
            <div className="space-y-2">
              {recentList.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{r.mapel_nama}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.catatan && <span className="text-xs text-muted-foreground">{r.catatan}</span>}
                    <AttendanceStatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
