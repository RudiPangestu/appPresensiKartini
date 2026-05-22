"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { MataPelajaran, Guru, Kelas } from "@/types/database";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HARI_COLORS: Record<string, string> = {
  Senin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Selasa: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Rabu: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Kamis: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Jumat: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Sabtu: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function AdminMataPelajaranPage() {
  const supabase = createClient();
  const [data, setData] = useState<MataPelajaran[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", kode: "", guru_id: "", kelas_id: "", hari: "", jam_mulai: "07:30", jam_selesai: "08:15" });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mapelRes, guruRes, kelasRes] = await Promise.all([
      supabase.from("mata_pelajaran").select("*").is("deleted_at", null).order("hari").order("jam_mulai"),
      supabase.from("guru").select("*").is("deleted_at", null).order("nama"),
      supabase.from("kelas").select("*").is("deleted_at", null).order("nama"),
    ]);
    setData((mapelRes.data ?? []) as MataPelajaran[]);
    setGuruList((guruRes.data ?? []) as Guru[]);
    setKelasList((kelasRes.data ?? []) as Kelas[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ nama: "", kode: "", guru_id: "", kelas_id: "", hari: "", jam_mulai: "07:30", jam_selesai: "08:15" }); setEditId(null); setShowForm(false); setError(null); };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.kode.trim()) { setError("Nama dan kode wajib diisi"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nama: form.nama, kode: form.kode, guru_id: form.guru_id || null, kelas_id: form.kelas_id || null, hari: form.hari || null, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai };
      if (editId) { await supabase.from("mata_pelajaran").update(payload).eq("id", editId); }
      else { await supabase.from("mata_pelajaran").insert(payload); }
      resetForm(); await loadData();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    await supabase.from("mata_pelajaran").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId);
    setDeleteId(null); setDeleting(false); await loadData();
  };

  const startEdit = (m: MataPelajaran) => {
    setForm({ nama: m.nama, kode: m.kode, guru_id: m.guru_id ?? "", kelas_id: m.kelas_id ?? "", hari: m.hari ?? "", jam_mulai: m.jam_mulai, jam_selesai: m.jam_selesai });
    setEditId(m.id); setShowForm(true);
  };

  const getGuruName = (id: string | null) => guruList.find((g) => g.id === id)?.nama ?? "—";
  const getKelasName = (id: string | null) => kelasList.find((k) => k.id === id)?.nama ?? "—";

  const columns: Column<Record<string, unknown>>[] = [
    { key: "kode", header: "Kode", sortable: true },
    { key: "nama", header: "Mata Pelajaran", sortable: true },
    { key: "guru_id", header: "Guru", render: (r) => getGuruName(r.guru_id as string | null) },
    { key: "kelas_id", header: "Kelas", render: (r) => getKelasName(r.kelas_id as string | null) },
    { key: "hari", header: "Hari", render: (r) => r.hari ? <Badge variant="outline" className={HARI_COLORS[r.hari as string] ?? ""}>{r.hari as string}</Badge> : "—" },
    { key: "jam_mulai", header: "Jam", render: (r) => `${(r.jam_mulai as string).slice(0,5)} – ${(r.jam_selesai as string).slice(0,5)}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mata Pelajaran</h1>
          <p className="text-muted-foreground">CRUD jadwal pelajaran dan tampilan timetable.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Tambah Mapel</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? "Edit Mapel" : "Tambah Mapel"}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nama Mapel</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="Matematika" /></div>
              <div className="space-y-2"><Label>Kode</Label><Input value={form.kode} onChange={(e) => setForm({...form, kode: e.target.value})} placeholder="MAT-XA" /></div>
              <div className="space-y-2"><Label>Guru Pengampu</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.guru_id} onChange={(e) => setForm({...form, guru_id: e.target.value})}>
                  <option value="">— Pilih Guru —</option>
                  {guruList.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Kelas</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.kelas_id} onChange={(e) => setForm({...form, kelas_id: e.target.value})}>
                  <option value="">— Pilih Kelas —</option>
                  {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Hari</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.hari} onChange={(e) => setForm({...form, hari: e.target.value})}>
                  <option value="">— Pilih Hari —</option>
                  {HARI_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Jam Mulai</Label><Input type="time" value={form.jam_mulai} onChange={(e) => setForm({...form, jam_mulai: e.target.value})} /></div>
              <div className="space-y-2 col-span-2 sm:col-span-1"><Label>Jam Selesai</Label><Input type="time" value={form.jam_selesai} onChange={(e) => setForm({...form, jam_selesai: e.target.value})} /></div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></div>
          </div>
        </div>
      )}

      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari mapel atau kode..."
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" onClick={() => startEdit(row as unknown as MataPelajaran)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId((row as unknown as MataPelajaran).id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />
      <ConfirmDialog open={!!deleteId} title="Hapus Mata Pelajaran" description="Yakin ingin menghapus mapel ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
