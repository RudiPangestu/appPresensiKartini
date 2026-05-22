"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, BookOpen, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import type { MataPelajaran, Kelas } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function GuruDashboard() {
  const supabase = createClient();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [todayMapel, setTodayMapel] = useState<(MataPelajaran & { kelas?: Kelas })[]>([]);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [todayDone, setTodayDone] = useState(0);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        // Cari guru berdasarkan user_id
        const { data: guru } = await supabase.from("guru").select("id").eq("user_id", user!.id).single();
        if (!guru) { setLoading(false); return; }

        const hariIni = HARI_ID[new Date().getDay()];
        const tanggalIni = new Date().toISOString().split("T")[0];

        // Mapel hari ini
        const { data: mapelList } = await supabase
          .from("mata_pelajaran").select("*, kelas(*)")
          .eq("guru_id", guru.id).eq("hari", hariIni).is("deleted_at", null).order("jam_mulai");

        const mapelData = (mapelList ?? []) as (MataPelajaran & { kelas?: Kelas })[];
        setTodayMapel(mapelData);

        // Hitung total siswa di semua kelas guru
        const kelasIds = Array.from(new Set(mapelData.map((m) => m.kelas_id).filter(Boolean))) as string[];
        if (kelasIds.length > 0) {
          const { count } = await supabase.from("siswa").select("id", { count: "exact", head: true }).in("kelas_id", kelasIds).is("deleted_at", null);
          setTotalSiswa(count ?? 0);
        }

        // Cek berapa mapel sudah diinput hari ini
        const mapelIds = mapelData.map((m) => m.id);
        if (mapelIds.length > 0) {
          const { data: presensiList } = await supabase
            .from("presensi").select("mapel_id").in("mapel_id", mapelIds).eq("tanggal", tanggalIni);
          const doneMapelIds = new Set((presensiList ?? []).map((p) => p.mapel_id));
          setTodayDone(doneMapelIds.size);
        }
      } catch (err) {
        console.error("Error loading guru dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Guru</h1>
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Guru</h1>
        <p className="text-muted-foreground">Kelas hari ini dan statistik cepat · {HARI_ID[new Date().getDay()]}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{todayMapel.length}</div><p className="text-xs text-muted-foreground">Mata pelajaran</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Siswa</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalSiswa}</div><p className="text-xs text-muted-foreground">Di kelas Anda</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Presensi Hari Ini</CardTitle><ClipboardCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{todayDone}/{todayMapel.length}</div><p className="text-xs text-muted-foreground">Sudah diinput</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Jadwal Hari Ini</CardTitle></CardHeader>
        <CardContent>
          {todayMapel.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Tidak ada jadwal mengajar hari ini</div>
          ) : (
            <div className="space-y-3">
              {todayMapel.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-mono text-muted-foreground">{m.jam_mulai.slice(0,5)}–{m.jam_selesai.slice(0,5)}</div>
                    <div>
                      <p className="font-medium">{m.nama}</p>
                      <p className="text-sm text-muted-foreground">Kelas {m.kelas?.nama ?? "—"}</p>
                    </div>
                  </div>
                  <Link href={`/guru/presensi?mapel_id=${m.id}`}>
                    <Button size="sm" variant="outline"><ClipboardCheck className="mr-2 h-3.5 w-3.5" /> Input</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
