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
import type { Kelas, Guru, TahunAjaran } from "@/types/database";

export default function AdminKelasPage() {
  const supabase = createClient();
  const [data, setData] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [taList, setTaList] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", tingkat: "X", wali_kelas_id: "", tahun_ajaran_id: "" });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [kelasRes, guruRes, taRes] = await Promise.all([
      supabase.from("kelas").select("*").is("deleted_at", null).order("nama"),
      supabase.from("guru").select("*").is("deleted_at", null).order("nama"),
      supabase.from("tahun_ajaran").select("*").order("nama", { ascending: false }),
    ]);
    setData((kelasRes.data ?? []) as Kelas[]);
    setGuruList((guruRes.data ?? []) as Guru[]);
    setTaList((taRes.data ?? []) as TahunAjaran[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ nama: "", tingkat: "X", wali_kelas_id: "", tahun_ajaran_id: "" }); setEditId(null); setShowForm(false); setError(null); };

  const handleSave = async () => {
    if (!form.nama.trim()) { setError("Nama kelas wajib diisi"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nama: form.nama, tingkat: form.tingkat, wali_kelas_id: form.wali_kelas_id || null, tahun_ajaran_id: form.tahun_ajaran_id || null };
      if (editId) { await supabase.from("kelas").update(payload).eq("id", editId); }
      else { await supabase.from("kelas").insert(payload); }
      resetForm(); await loadData();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from("kelas").update({ deleted_at: new Date().toISOString() }).eq("id", deleteId);
    setDeleteId(null); setDeleting(false); await loadData();
  };

  const startEdit = (k: Kelas) => {
    setForm({ nama: k.nama, tingkat: k.tingkat, wali_kelas_id: k.wali_kelas_id ?? "", tahun_ajaran_id: k.tahun_ajaran_id ?? "" });
    setEditId(k.id); setShowForm(true);
  };

  const getGuruName = (id: string | null) => guruList.find((g) => g.id === id)?.nama ?? "—";
  const getTaName = (id: string | null) => taList.find((t) => t.id === id)?.nama ?? "—";

  const columns: Column<Record<string, unknown>>[] = [
    { key: "nama", header: "Nama Kelas", sortable: true },
    { key: "tingkat", header: "Tingkat", sortable: true, render: (r) => <Badge variant="outline">{r.tingkat as string}</Badge> },
    { key: "wali_kelas_id", header: "Wali Kelas", render: (r) => getGuruName(r.wali_kelas_id as string | null) },
    { key: "tahun_ajaran_id", header: "Tahun Ajaran", render: (r) => getTaName(r.tahun_ajaran_id as string | null) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Kelas</h1>
          <p className="text-muted-foreground">CRUD kelas, lihat siswa per kelas, edit semua field.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Tambah Kelas</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? "Edit Kelas" : "Tambah Kelas"}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2"><Label>Nama Kelas</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="X-A" /></div>
            <div className="space-y-2"><Label>Tingkat</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tingkat} onChange={(e) => setForm({...form, tingkat: e.target.value})}>
                <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Wali Kelas</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.wali_kelas_id} onChange={(e) => setForm({...form, wali_kelas_id: e.target.value})}>
                <option value="">— Tidak ada —</option>
                {guruList.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Tahun Ajaran</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tahun_ajaran_id} onChange={(e) => setForm({...form, tahun_ajaran_id: e.target.value})}>
                <option value="">— Pilih —</option>
                {taList.map((t) => <option key={t.id} value={t.id}>{t.nama}{t.aktif ? " (Aktif)" : ""}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></div>
          </div>
        </div>
      )}

      <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Cari kelas..."
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" onClick={() => startEdit(row as unknown as Kelas)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId((row as unknown as Kelas).id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />
      <ConfirmDialog open={!!deleteId} title="Hapus Kelas" description="Yakin ingin menghapus kelas ini? (soft delete)" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
