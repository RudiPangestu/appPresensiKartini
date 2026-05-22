"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type Column } from "@/components/shared/data-table";
import { AttendanceStatusBadge } from "@/components/shared/attendance-status-badge";
import { AttendanceTrendChart, type TrendDataPoint } from "@/components/shared/attendance-trend-chart";
import { PercentageRing } from "@/components/shared/percentage-ring";
import { Badge } from "@/components/ui/badge";
import { exportToPDF, exportToExcel, type ExportColumn } from "@/lib/export";
import { FileDown, FileSpreadsheet, BarChart3, Users } from "lucide-react";
import type { Kelas, AttendanceStatus } from "@/types/database";

// ── Tipe periode ────────────────────────────────────────────
type PeriodeType = "harian" | "mingguan" | "bulanan" | "triwulan" | "semester" | "tahunan";

const PERIODE_OPTIONS: { value: PeriodeType; label: string }[] = [
  { value: "harian", label: "Harian" },
  { value: "mingguan", label: "Mingguan" },
  { value: "bulanan", label: "Bulanan" },
  { value: "triwulan", label: "Triwulan" },
  { value: "semester", label: "Semester" },
  { value: "tahunan", label: "Tahunan" },
];

interface RekapSiswa {
  siswa_id: string;
  siswa_nama: string;
  nisn: string;
  kelas_nama: string;
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persen: number;
}

// ── Helpers untuk kalkulasi tanggal ─────────────────────────
function getDateRange(periode: PeriodeType, refDate: string): { start: string; end: string } {
  const d = new Date(refDate);
  const y = d.getFullYear();
  const m = d.getMonth();

  switch (periode) {
    case "harian":
      return { start: refDate, end: refDate };
    case "mingguan": {
      const day = d.getDay();
      const monday = new Date(d); monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
      return { start: monday.toISOString().split("T")[0], end: friday.toISOString().split("T")[0] };
    }
    case "bulanan":
      return {
        start: new Date(y, m, 1).toISOString().split("T")[0],
        end: new Date(y, m + 1, 0).toISOString().split("T")[0],
      };
    case "triwulan": {
      const q = Math.floor(m / 3);
      return {
        start: new Date(y, q * 3, 1).toISOString().split("T")[0],
        end: new Date(y, q * 3 + 3, 0).toISOString().split("T")[0],
      };
    }
    case "semester": {
      const half = m < 6 ? 0 : 6;
      return {
        start: new Date(y, half, 1).toISOString().split("T")[0],
        end: new Date(y, half + 6, 0).toISOString().split("T")[0],
      };
    }
    case "tahunan":
      return {
        start: new Date(y, 0, 1).toISOString().split("T")[0],
        end: new Date(y, 11, 31).toISOString().split("T")[0],
      };
  }
}

function formatPeriodeLabel(periode: PeriodeType, start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (periode === "harian") return s.toLocaleDateString("id-ID", opts);
  return `${s.toLocaleDateString("id-ID", opts)} — ${e.toLocaleDateString("id-ID", opts)}`;
}

export default function AdminLaporanPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [periode, setPeriode] = useState<PeriodeType>("bulanan");
  const [refDate, setRefDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rekapSiswa, setRekapSiswa] = useState<RekapSiswa[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [totalStats, setTotalStats] = useState({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0 });

  // Load kelas list
  useEffect(() => {
    async function loadKelas() {
      const { data } = await supabase.from("kelas").select("*").is("deleted_at", null).order("nama");
      setKelasList((data ?? []) as Kelas[]);
      setLoading(false);
    }
    loadKelas();
  }, [supabase]);

  // Load rekap data
  const loadRekap = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(periode, refDate);

    try {
      // Build query for individual student stats
      let query = supabase
        .from("presensi")
        .select("siswa_id, status, tanggal, siswa(nama, nisn, kelas(nama))")
        .gte("tanggal", start)
        .lte("tanggal", end);

      if (selectedKelas) {
        // Filter by kelas: get siswa IDs in this kelas first
        const { data: siswaInKelas } = await supabase
          .from("siswa").select("id").eq("kelas_id", selectedKelas).is("deleted_at", null);
        const ids = (siswaInKelas ?? []).map((s) => s.id);
        if (ids.length === 0) {
          setRekapSiswa([]); setTrendData([]); setTotalStats({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0 });
          setLoading(false);
          return;
        }
        query = query.in("siswa_id", ids);
      }

      const { data: presensiRows } = await query;
      const rows = (presensiRows ?? []) as unknown as {
        siswa_id: string;
        status: AttendanceStatus;
        tanggal: string;
        siswa: { nama: string; nisn: string; kelas: { nama: string } | null } | null;
      }[];

      // ── Aggregate per siswa ──
      const siswaMap = new Map<string, RekapSiswa>();
      for (const row of rows) {
        if (!siswaMap.has(row.siswa_id)) {
          siswaMap.set(row.siswa_id, {
            siswa_id: row.siswa_id,
            siswa_nama: row.siswa?.nama ?? "—",
            nisn: row.siswa?.nisn ?? "—",
            kelas_nama: row.siswa?.kelas?.nama ?? "—",
            total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0,
          });
        }
        const s = siswaMap.get(row.siswa_id)!;
        s.total++;
        s[row.status]++;
      }
      // Calculate percentages
      Array.from(siswaMap.values()).forEach((s) => {
        s.persen = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      });
      const rekapList = Array.from(siswaMap.values()).sort((a, b) => a.siswa_nama.localeCompare(b.siswa_nama));
      setRekapSiswa(rekapList);

      // ── Total stats ──
      const totals = rekapList.reduce((acc, s) => ({
        total: acc.total + s.total, hadir: acc.hadir + s.hadir,
        sakit: acc.sakit + s.sakit, izin: acc.izin + s.izin, alpha: acc.alpha + s.alpha, persen: 0,
      }), { total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0 });
      totals.persen = totals.total > 0 ? Math.round((totals.hadir / totals.total) * 100) : 0;
      setTotalStats(totals);

      // ── Trend data (group by day for chart) ──
      const dayMap = new Map<string, { hadir: number; sakit: number; izin: number; alpha: number; total: number }>();
      for (const row of rows) {
        if (!dayMap.has(row.tanggal)) {
          dayMap.set(row.tanggal, { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 });
        }
        const d = dayMap.get(row.tanggal)!;
        d[row.status]++;
        d.total++;
      }
      const trend: TrendDataPoint[] = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({
          label: new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          hadir: d.hadir,
          sakit: d.sakit,
          izin: d.izin,
          alpha: d.alpha,
          persen_hadir: d.total > 0 ? Math.round((d.hadir / d.total) * 100) : 0,
        }));
      setTrendData(trend);
    } catch (err) {
      console.error("Error loading laporan:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedKelas, periode, refDate]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  // ── Export handlers ──
  const { start, end } = getDateRange(periode, refDate);
  const periodeLabel = formatPeriodeLabel(periode, start, end);
  const kelasLabel = selectedKelas ? kelasList.find((k) => k.id === selectedKelas)?.nama ?? "" : "Semua Kelas";

  const exportColumns: ExportColumn[] = [
    { header: "No", key: "no" },
    { header: "NISN", key: "nisn" },
    { header: "Nama Siswa", key: "siswa_nama" },
    { header: "Kelas", key: "kelas_nama" },
    { header: "Total", key: "total" },
    { header: "Hadir", key: "hadir" },
    { header: "Sakit", key: "sakit" },
    { header: "Izin", key: "izin" },
    { header: "Alpha", key: "alpha" },
    { header: "% Hadir", key: "persen" },
  ];

  const getExportRows = () =>
    rekapSiswa.map((s, i) => ({ ...s, no: i + 1, persen: `${s.persen}%` }));

  const handleExportPDF = () => {
    exportToPDF(
      `Rekap Kehadiran - ${kelasLabel}`,
      exportColumns,
      getExportRows(),
      `Periode: ${periodeLabel}`
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      `Rekap Kehadiran - ${kelasLabel}`,
      exportColumns,
      getExportRows(),
      "Rekap Kehadiran"
    );
  };

  // ── Table columns ──
  const tableColumns: Column<Record<string, unknown>>[] = [
    { key: "nisn", header: "NISN", sortable: true },
    { key: "siswa_nama", header: "Nama Siswa", sortable: true },
    { key: "kelas_nama", header: "Kelas", sortable: true },
    { key: "total", header: "Total", sortable: true, className: "text-center" },
    {
      key: "hadir", header: "Hadir", sortable: true, className: "text-center",
      render: (r) => <span className="text-green-600 dark:text-green-400 font-medium">{r.hadir as number}</span>,
    },
    {
      key: "sakit", header: "Sakit", sortable: true, className: "text-center",
      render: (r) => <span className="text-yellow-600 dark:text-yellow-400">{r.sakit as number}</span>,
    },
    {
      key: "izin", header: "Izin", sortable: true, className: "text-center",
      render: (r) => <span className="text-blue-600 dark:text-blue-400">{r.izin as number}</span>,
    },
    {
      key: "alpha", header: "Alpha", sortable: true, className: "text-center",
      render: (r) => <span className="text-red-600 dark:text-red-400 font-medium">{r.alpha as number}</span>,
    },
    {
      key: "persen", header: "% Hadir", sortable: true, className: "text-center",
      render: (r) => {
        const p = r.persen as number;
        return (
          <Badge variant="outline" className={
            p >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : p >= 75 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }>{p}%</Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Kehadiran</h1>
          <p className="text-muted-foreground">Rekap kehadiran per siswa, chart tren, dan export PDF/Excel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={rekapSiswa.length === 0}>
            <FileDown className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={rekapSiswa.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Periode</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={periode} onChange={(e) => setPeriode(e.target.value as PeriodeType)}>
                {PERIODE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Referensi</Label>
              <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Periode: <span className="font-medium">{periodeLabel}</span> · {kelasLabel}
          </p>
        </CardContent>
      </Card>

      {/* Summary stats */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{totalStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Catatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-green-600">{totalStats.hadir}</p>
              <p className="text-xs text-muted-foreground">Hadir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-yellow-600">{totalStats.sakit}</p>
              <p className="text-xs text-muted-foreground">Sakit</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalStats.izin}</p>
              <p className="text-xs text-muted-foreground">Izin</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-red-600">{totalStats.alpha}</p>
              <p className="text-xs text-muted-foreground">Alpha</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend chart + Percentage ring */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <AttendanceTrendChart data={trendData} title="Tren Kehadiran Harian" />
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Ringkasan</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-4">
            <PercentageRing percentage={totalStats.persen} size={140} label={periodeLabel} />
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><AttendanceStatusBadge status="hadir" /> Hadir</span>
                <span className="font-medium">{totalStats.hadir}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><AttendanceStatusBadge status="sakit" /> Sakit</span>
                <span className="font-medium">{totalStats.sakit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><AttendanceStatusBadge status="izin" /> Izin</span>
                <span className="font-medium">{totalStats.izin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><AttendanceStatusBadge status="alpha" /> Alpha</span>
                <span className="font-medium">{totalStats.alpha}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-student table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Rekap Per Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={rekapSiswa as unknown as Record<string, unknown>[]}
            columns={tableColumns}
            loading={loading}
            searchPlaceholder="Cari nama siswa atau NISN..."
            searchFields={["siswa_nama", "nisn"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
