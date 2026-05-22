"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { DataTable, type Column } from "@/components/shared/data-table";
import { AttendanceStatusBadge } from "@/components/shared/attendance-status-badge";
import type { AttendanceStatus } from "@/types/database";

interface HistoryRow {
  id: string;
  tanggal: string;
  status: AttendanceStatus;
  catatan: string | null;
  siswa_nama: string;
  siswa_nisn: string;
  mapel_nama: string;
  kelas_nama: string;
}

export default function GuruHistoryPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadHistory() {
      try {
        const { data: guru } = await supabase.from("guru").select("id").eq("user_id", user!.id).single();
        if (!guru) { setLoading(false); return; }

        const { data: rows } = await supabase
          .from("presensi")
          .select("id, tanggal, status, catatan, siswa(nama, nisn, kelas(nama)), mata_pelajaran(nama)")
          .eq("dicatat_oleh", user!.id)
          .order("tanggal", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(200);

        const mapped = (rows ?? []).map((r: Record<string, unknown>) => {
          const siswa = r.siswa as Record<string, unknown> | null;
          const kelas = siswa?.kelas as Record<string, unknown> | null;
          const mapel = r.mata_pelajaran as Record<string, unknown> | null;
          return {
            id: r.id as string,
            tanggal: r.tanggal as string,
            status: r.status as AttendanceStatus,
            catatan: r.catatan as string | null,
            siswa_nama: (siswa?.nama as string) ?? "—",
            siswa_nisn: (siswa?.nisn as string) ?? "—",
            mapel_nama: (mapel?.nama as string) ?? "—",
            kelas_nama: (kelas?.nama as string) ?? "—",
          };
        });
        setData(mapped);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user, supabase]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "tanggal", header: "Tanggal", sortable: true, render: (r) => new Date(r.tanggal as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) },
    { key: "mapel_nama", header: "Mapel", sortable: true },
    { key: "kelas_nama", header: "Kelas" },
    { key: "siswa_nama", header: "Siswa", sortable: true },
    { key: "siswa_nisn", header: "NISN" },
    { key: "status", header: "Status", render: (r) => <AttendanceStatusBadge status={r.status as AttendanceStatus} /> },
    { key: "catatan", header: "Catatan", render: (r) => <span className="text-muted-foreground text-xs">{(r.catatan as string) || "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Presensi</h1>
        <p className="text-muted-foreground">Riwayat presensi yang sudah Anda input.</p>
      </div>
      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari nama siswa atau mapel..." />
    </div>
  );
}
