"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { AttendanceStatusBadge } from "@/components/shared/attendance-status-badge";
import { AttendanceTrendChart, type TrendDataPoint } from "@/components/shared/attendance-trend-chart";
import { PercentageRing } from "@/components/shared/percentage-ring";
import { Label } from "@/components/ui/label";
import type { AttendanceStatus } from "@/types/database";

type FilterPeriode = "bulanan" | "triwulan" | "semester" | "tahunan";

const FILTER_OPTIONS: { value: FilterPeriode; label: string }[] = [
  { value: "bulanan", label: "Bulan Ini" },
  { value: "triwulan", label: "Triwulan" },
  { value: "semester", label: "Semester" },
  { value: "tahunan", label: "Tahunan" },
];

function getRange(filter: FilterPeriode): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (filter) {
    case "bulanan": return { start: new Date(y, m, 1).toISOString().split("T")[0], end: new Date(y, m + 1, 0).toISOString().split("T")[0] };
    case "triwulan": { const q = Math.floor(m / 3); return { start: new Date(y, q * 3, 1).toISOString().split("T")[0], end: new Date(y, q * 3 + 3, 0).toISOString().split("T")[0] }; }
    case "semester": { const h = m < 6 ? 0 : 6; return { start: new Date(y, h, 1).toISOString().split("T")[0], end: new Date(y, h + 6, 0).toISOString().split("T")[0] }; }
    case "tahunan": return { start: new Date(y, 0, 1).toISOString().split("T")[0], end: new Date(y, 11, 31).toISOString().split("T")[0] };
  }
}

interface KehadiranRow {
  id: string;
  tanggal: string;
  status: AttendanceStatus;
  catatan: string | null;
  mapel_nama: string;
}

export default function OrtuKehadiranPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [data, setData] = useState<KehadiranRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriode>("bulanan");
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [stats, setStats] = useState({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0 });

  useEffect(() => {
    if (!user) return;
    async function loadKehadiran() {
      setLoading(true);
      try {
        const { data: siswa } = await supabase.from("siswa").select("id").eq("user_id", user!.id).single();
        if (!siswa) { setLoading(false); return; }

        const { start, end } = getRange(filter);
        const { data: rows } = await supabase
          .from("presensi")
          .select("id, tanggal, status, catatan, mata_pelajaran(nama)")
          .eq("siswa_id", siswa.id)
          .gte("tanggal", start)
          .lte("tanggal", end)
          .order("tanggal", { ascending: false });

        const mapped = (rows ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          tanggal: r.tanggal as string,
          status: r.status as AttendanceStatus,
          catatan: r.catatan as string | null,
          mapel_nama: ((r.mata_pelajaran as Record<string, unknown>)?.nama as string) ?? "—",
        }));

        setData(mapped);

        // Stats
        const total = mapped.length;
        const hadir = mapped.filter((r) => r.status === "hadir").length;
        const sakit = mapped.filter((r) => r.status === "sakit").length;
        const izin = mapped.filter((r) => r.status === "izin").length;
        const alpha = mapped.filter((r) => r.status === "alpha").length;
        setStats({ total, hadir, sakit, izin, alpha, persen: total > 0 ? Math.round((hadir / total) * 100) : 0 });

        // Trend
        const dayMap = new Map<string, { hadir: number; sakit: number; izin: number; alpha: number; total: number }>();
        for (const row of mapped) {
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
              ...d,
              persen_hadir: d.total > 0 ? Math.round((d.hadir / d.total) * 100) : 0,
            }))
        );
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadKehadiran();
  }, [user, supabase, filter]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "tanggal", header: "Tanggal", sortable: true, render: (r) => new Date(r.tanggal as string).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) },
    { key: "mapel_nama", header: "Mata Pelajaran", sortable: true },
    { key: "status", header: "Status", render: (r) => <AttendanceStatusBadge status={r.status as AttendanceStatus} /> },
    { key: "catatan", header: "Catatan", render: (r) => <span className="text-muted-foreground text-xs">{(r.catatan as string) || "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detail Kehadiran</h1>
          <p className="text-muted-foreground">Detail kehadiran anak dengan filter periode.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Periode</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[150px]"
            value={filter} onChange={(e) => setFilter(e.target.value as FilterPeriode)}>
            {FILTER_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats + Ring */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <PercentageRing percentage={stats.persen} size={120} label={FILTER_OPTIONS.find((f) => f.value === filter)?.label ?? ""} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div><p className="text-lg font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
              <div><p className="text-lg font-bold text-green-600">{stats.hadir}</p><p className="text-xs text-muted-foreground">Hadir</p></div>
              <div><p className="text-lg font-bold text-yellow-600">{stats.sakit}</p><p className="text-xs text-muted-foreground">Sakit</p></div>
              <div><p className="text-lg font-bold text-blue-600">{stats.izin}</p><p className="text-xs text-muted-foreground">Izin</p></div>
              <div><p className="text-lg font-bold text-red-600">{stats.alpha}</p><p className="text-xs text-muted-foreground">Alpha</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <AttendanceTrendChart data={trendData} title="Tren Kehadiran" />

      {/* Table */}
      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari mapel..." />
    </div>
  );
}
