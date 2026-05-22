"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { Guru } from "@/types/database";

export default function AdminGuruPage() {
  const supabase = createClient();
  const [data, setData] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", nip: "", bidang_studi: "" });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: guru } = await supabase.from("guru").select("*").is("deleted_at", null).order("nama");
    setData((guru ?? []) as Guru[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ nama: "", nip: "", bidang_studi: "" }); setEditId(null); setShowForm(false); setError(null); };

  const handleSave = async () => {
    if (!form.nama.trim()) { setError("Nama wajib diisi"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nama: form.nama, nip: form.nip || null, bidang_studi: form.bidang_studi || null };
      if (editId) { await supabase.from("guru").update(payload).eq("id", editId); }
      else { await supabase.from("guru").insert(payload); }
      resetForm(); await loadData();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    await supabase.from("guru").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId);
    setDeleteId(null); setDeleting(false); await loadData();
  };

  const startEdit = (g: Guru) => {
    setForm({ nama: g.nama, nip: g.nip ?? "", bidang_studi: g.bidang_studi ?? "" });
    setEditId(g.id); setShowForm(true);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "nama", header: "Nama", sortable: true },
    { key: "nip", header: "NIP", sortable: true, render: (r) => (r.nip as string) || "—" },
    { key: "bidang_studi", header: "Bidang Studi", render: (r) => (r.bidang_studi as string) || "—" },
    { key: "created_at", header: "Terdaftar", sortable: true, render: (r) => new Date(r.created_at as string).toLocaleDateString("id-ID") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Guru</h1>
          <p className="text-muted-foreground">CRUD guru, assign ke kelas dan mata pelajaran.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Tambah Guru</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? "Edit Guru" : "Tambah Guru"}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} /></div>
            <div className="space-y-2"><Label>NIP</Label><Input value={form.nip} onChange={(e) => setForm({...form, nip: e.target.value})} placeholder="Opsional" /></div>
            <div className="space-y-2"><Label>Bidang Studi</Label><Input value={form.bidang_studi} onChange={(e) => setForm({...form, bidang_studi: e.target.value})} placeholder="Matematika, Fisika, dll" /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></div>
          </div>
        </div>
      )}

      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari nama atau NIP..."
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" onClick={() => startEdit(row as unknown as Guru)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId((row as unknown as Guru).id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />
      <ConfirmDialog open={!!deleteId} title="Hapus Guru" description="Yakin ingin menghapus guru ini? (soft delete)" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
