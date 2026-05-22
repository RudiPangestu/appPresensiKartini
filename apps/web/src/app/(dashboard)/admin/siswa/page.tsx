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
import type { Siswa, Kelas } from "@/types/database";

export default function AdminSiswaPage() {
  const supabase = createClient();
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nisn: "", nama: "", jenis_kelamin: "L", kelas_id: "", nama_ortu: "", hp_ortu: "", email_ortu: "" });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [siswaRes, kelasRes] = await Promise.all([
      supabase.from("siswa").select("*").is("deleted_at", null).order("nama"),
      supabase.from("kelas").select("*").is("deleted_at", null).order("nama"),
    ]);
    setData((siswaRes.data ?? []) as Siswa[]);
    setKelasList((kelasRes.data ?? []) as Kelas[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ nisn: "", nama: "", jenis_kelamin: "L", kelas_id: "", nama_ortu: "", hp_ortu: "", email_ortu: "" }); setEditId(null); setShowForm(false); setError(null); };

  const handleSave = async () => {
    if (!form.nisn.trim() || !form.nama.trim()) { setError("NISN dan nama wajib diisi"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { ...form, kelas_id: form.kelas_id || null, jenis_kelamin: form.jenis_kelamin || null, email_ortu: form.email_ortu || null };
      if (editId) { await supabase.from("siswa").update(payload).eq("id", editId); }
      else { await supabase.from("siswa").insert(payload); }
      resetForm(); await loadData();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    await supabase.from("siswa").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId);
    setDeleteId(null); setDeleting(false); await loadData();
  };

  const startEdit = (s: Siswa) => {
    setForm({ nisn: s.nisn, nama: s.nama, jenis_kelamin: s.jenis_kelamin ?? "L", kelas_id: s.kelas_id ?? "", nama_ortu: s.nama_ortu ?? "", hp_ortu: s.hp_ortu ?? "", email_ortu: s.email_ortu ?? "" });
    setEditId(s.id); setShowForm(true);
  };

  const getKelasName = (id: string | null) => kelasList.find((k) => k.id === id)?.nama ?? "—";

  const columns: Column<Record<string, unknown>>[] = [
    { key: "nisn", header: "NISN", sortable: true },
    { key: "nama", header: "Nama", sortable: true },
    { key: "jenis_kelamin", header: "JK", render: (r) => <Badge variant="outline">{r.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</Badge> },
    { key: "kelas_id", header: "Kelas", sortable: true, render: (r) => getKelasName(r.kelas_id as string | null) },
    { key: "nama_ortu", header: "Nama Ortu" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Siswa</h1>
          <p className="text-muted-foreground">CRUD siswa, search/filter/sort.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Tambah Siswa</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? "Edit Siswa" : "Tambah Siswa"}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>NISN</Label><Input value={form.nisn} onChange={(e) => setForm({...form, nisn: e.target.value})} placeholder="0051234001" /></div>
              <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} /></div>
              <div className="space-y-2"><Label>Jenis Kelamin</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.jenis_kelamin} onChange={(e) => setForm({...form, jenis_kelamin: e.target.value})}>
                  <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Kelas</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.kelas_id} onChange={(e) => setForm({...form, kelas_id: e.target.value})}>
                  <option value="">— Pilih Kelas —</option>
                  {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Data Orang Tua</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Ortu</Label><Input value={form.nama_ortu} onChange={(e) => setForm({...form, nama_ortu: e.target.value})} /></div>
                <div className="space-y-2"><Label>HP Ortu</Label><Input value={form.hp_ortu} onChange={(e) => setForm({...form, hp_ortu: e.target.value})} placeholder="08xx" /></div>
              </div>
              <div className="space-y-2"><Label>Email Ortu</Label><Input type="email" value={form.email_ortu} onChange={(e) => setForm({...form, email_ortu: e.target.value})} /></div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></div>
          </div>
        </div>
      )}

      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari NISN atau nama..."
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" onClick={() => startEdit(row as unknown as Siswa)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId((row as unknown as Siswa).id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />
      <ConfirmDialog open={!!deleteId} title="Hapus Siswa" description="Yakin ingin menghapus siswa ini? (soft delete)" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
