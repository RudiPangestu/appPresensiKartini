"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AttendanceStatusBadge } from "@/components/shared/attendance-status-badge";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { Check, Loader2 } from "lucide-react";
import type { MataPelajaran, AttendanceStatus } from "@/types/database";

interface PresensiItem {
  siswa_id: string;
  nama: string;
  nisn: string;
  status: AttendanceStatus;
  catatan: string;
}

export default function GuruPresensiPage() {
  const supabase = createClient();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const preselectedMapelId = searchParams.get("mapel_id");

  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [selectedMapel, setSelectedMapel] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<PresensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);

  // Load mapel list for this guru
  useEffect(() => {
    if (!user) return;
    async function loadMapel() {
      const { data: guru } = await supabase.from("guru").select("id").eq("user_id", user!.id).single();
      if (!guru) { setLoading(false); return; }
      const { data: mapel } = await supabase.from("mata_pelajaran").select("*").eq("guru_id", guru.id).is("deleted_at", null).order("nama");
      setMapelList((mapel ?? []) as MataPelajaran[]);
      if (preselectedMapelId) setSelectedMapel(preselectedMapelId);
      setLoading(false);
    }
    loadMapel();
  }, [user, supabase, preselectedMapelId]);

  // Load siswa when mapel selected
  const loadSiswa = useCallback(async () => {
    if (!selectedMapel) return;
    setLoadingSiswa(true); setSuccess(false); setError(null); setAlreadyDone(false);

    const mapel = mapelList.find((m) => m.id === selectedMapel);
    if (!mapel?.kelas_id) { setLoadingSiswa(false); setItems([]); return; }

    // Cek apakah sudah pernah diinput
    const { count } = await supabase.from("presensi").select("id", { count: "exact", head: true })
      .eq("mapel_id", selectedMapel).eq("tanggal", tanggal);

    if ((count ?? 0) > 0) { setAlreadyDone(true); setItems([]); setLoadingSiswa(false); return; }

    const { data: siswaList } = await supabase.from("siswa").select("id, nama, nisn")
      .eq("kelas_id", mapel.kelas_id).is("deleted_at", null).order("nama");

    setItems((siswaList ?? []).map((s) => ({ siswa_id: s.id, nama: s.nama, nisn: s.nisn, status: "hadir" as AttendanceStatus, catatan: "" })));
    setLoadingSiswa(false);
  }, [selectedMapel, tanggal, mapelList, supabase]);

  useEffect(() => { loadSiswa(); }, [loadSiswa]);

  const setStatus = (idx: number, status: AttendanceStatus) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, status } : item));
  };

  const setCatatan = (idx: number, catatan: string) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, catatan } : item));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setItems((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      const payload = items.map((item) => ({
        siswa_id: item.siswa_id,
        mapel_id: selectedMapel,
        tanggal,
        status: item.status,
        catatan: item.catatan || null,
        dicatat_oleh: user!.id,
      }));
      const { error: err } = await supabase.from("presensi").insert(payload);
      if (err) throw err;
      setSuccess(true); setShowConfirm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan presensi");
      setShowConfirm(false);
    } finally { setSubmitting(false); }
  };

  const STATUS_OPTIONS: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpha"];

  if (loading) return <div className="space-y-6"><h1 className="text-3xl font-bold">Input Presensi</h1><ListSkeleton /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Input Presensi</h1>
        <p className="text-muted-foreground">Pilih mata pelajaran, lalu input status kehadiran setiap siswa.</p>
      </div>

      {/* Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)}>
                <option value="">— Pilih Mapel —</option>
                {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama} ({m.kode})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Already done warning */}
      {alreadyDone && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ Presensi untuk mapel dan tanggal ini sudah pernah diinput. Tidak bisa submit dua kali.
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
          <Check className="h-4 w-4" /> Presensi berhasil disimpan!
        </div>
      )}

      {/* Student list */}
      {items.length > 0 && !success && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{items.length} Siswa</CardTitle>
              <div className="flex gap-1">
                <span className="text-xs text-muted-foreground mr-2">Set semua:</span>
                {STATUS_OPTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => setAllStatus(s)} className="text-xs h-7 px-2">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.siswa_id} className="flex items-center gap-4 rounded-md border p-3">
                <div className="w-8 text-center text-sm text-muted-foreground font-mono">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.nama}</p>
                  <p className="text-xs text-muted-foreground">{item.nisn}</p>
                </div>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setStatus(idx, s)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        item.status === s
                          ? s === "hadir" ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-400"
                          : s === "sakit" ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-400"
                          : s === "izin" ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400"
                          : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-400"
                          : "bg-background hover:bg-accent"
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {item.status !== "hadir" && (
                  <Input className="w-40 h-8 text-xs" placeholder="Catatan..." value={item.catatan} onChange={(e) => setCatatan(idx, e.target.value)} />
                )}
              </div>
            ))}

            {error && <p className="text-sm text-destructive mt-2">{error}</p>}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-3 text-xs">
                {STATUS_OPTIONS.map((s) => {
                  const count = items.filter((i) => i.status === s).length;
                  return <span key={s}><AttendanceStatusBadge status={s} /> {count}</span>;
                })}
              </div>
              <Button size="lg" onClick={() => setShowConfirm(true)} disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Submit Presensi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingSiswa && <ListSkeleton />}

      <ConfirmDialog
        open={showConfirm}
        title="Konfirmasi Submit Presensi"
        description={`Anda akan menyimpan presensi ${items.length} siswa. Pastikan data sudah benar.`}
        confirmLabel="Ya, Submit"
        variant="default"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
        loading={submitting}
      />
    </div>
  );
}
