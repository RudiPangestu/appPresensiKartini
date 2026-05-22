"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { KegiatanSekolah, Kelas } from "@/types/database";

export default function AdminKegiatanPage() {
  const supabase = createClient();
  const [data, setData] = useState<KegiatanSekolah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", deskripsi: "", tanggal: "", jam_mulai: "07:30", jam_selesai: "12:00" });
  const [selectedKelas, setSelectedKelas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [kegRes, kelasRes] = await Promise.all([
      supabase.from("kegiatan_sekolah").select("*").is("deleted_at", null).order("tanggal", { ascending: false }),
      supabase.from("kelas").select("*").is("deleted_at", null).order("nama"),
    ]);
    setData((kegRes.data ?? []) as KegiatanSekolah[]);
    setKelasList((kelasRes.data ?? []) as Kelas[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ nama: "", deskripsi: "", tanggal: "", jam_mulai: "07:30", jam_selesai: "12:00" }); setSelectedKelas([]); setEditId(null); setShowForm(false); setError(null); };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.tanggal) { setError("Nama dan tanggal wajib diisi"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nama: form.nama, deskripsi: form.deskripsi || null, tanggal: form.tanggal, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai };
      let kegiatanId = editId;
      if (editId) {
        await supabase.from("kegiatan_sekolah").update(payload).eq("id", editId);
        // Update relasi kegiatan_kelas
        await supabase.from("kegiatan_kelas").delete().eq("kegiatan_id", editId);
      } else {
        const { data: res, error: err } = await supabase.from("kegiatan_sekolah").insert(payload).select("id").single();
        if (err) throw err;
        kegiatanId = res.id;
      }
      // Insert relasi kegiatan_kelas
      if (kegiatanId && selectedKelas.length > 0) {
        const relasi = selectedKelas.map((kelas_id) => ({ kegiatan_id: kegiatanId!, kelas_id }));
        await supabase.from("kegiatan_kelas").insert(relasi);
      }
      resetForm(); await loadData();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    await supabase.from("kegiatan_sekolah").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId);
    setDeleteId(null); setDeleting(false); await loadData();
  };

  const startEdit = async (k: KegiatanSekolah) => {
    setForm({ nama: k.nama, deskripsi: k.deskripsi ?? "", tanggal: k.tanggal, jam_mulai: k.jam_mulai, jam_selesai: k.jam_selesai });
    // Load relasi kelas
    const { data: relasi } = await supabase.from("kegiatan_kelas").select("kelas_id").eq("kegiatan_id", k.id);
    setSelectedKelas((relasi ?? []).map((r) => r.kelas_id));
    setEditId(k.id); setShowForm(true);
  };

  const toggleKelas = (id: string) => {
    setSelectedKelas((prev) => prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "nama", header: "Nama Kegiatan", sortable: true },
    { key: "tanggal", header: "Tanggal", sortable: true, render: (r) => new Date(r.tanggal as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) },
    { key: "jam_mulai", header: "Jam", render: (r) => `${(r.jam_mulai as string).slice(0,5)} – ${(r.jam_selesai as string).slice(0,5)}` },
    { key: "deskripsi", header: "Deskripsi", render: (r) => <span className="text-muted-foreground line-clamp-1">{(r.deskripsi as string) || "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kegiatan Sekolah</h1>
          <p className="text-muted-foreground">CRUD kegiatan sekolah dan set peserta per kelas.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? "Edit Kegiatan" : "Tambah Kegiatan"}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2"><Label>Nama Kegiatan</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="Upacara Bendera" /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Input value={form.deskripsi} onChange={(e) => setForm({...form, deskripsi: e.target.value})} placeholder="Opsional" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})} /></div>
              <div className="space-y-2"><Label>Jam Mulai</Label><Input type="time" value={form.jam_mulai} onChange={(e) => setForm({...form, jam_mulai: e.target.value})} /></div>
              <div className="space-y-2"><Label>Jam Selesai</Label><Input type="time" value={form.jam_selesai} onChange={(e) => setForm({...form, jam_selesai: e.target.value})} /></div>
            </div>
            <div className="space-y-2">
              <Label>Kelas Peserta</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                {kelasList.map((k) => (
                  <button key={k.id} type="button" onClick={() => toggleKelas(k.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedKelas.includes(k.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                    {k.nama}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{selectedKelas.length} kelas dipilih</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></div>
          </div>
        </div>
      )}

      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari kegiatan..."
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" onClick={() => startEdit(row as unknown as KegiatanSekolah)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId((row as unknown as KegiatanSekolah).id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />
      <ConfirmDialog open={!!deleteId} title="Hapus Kegiatan" description="Yakin ingin menghapus kegiatan ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
