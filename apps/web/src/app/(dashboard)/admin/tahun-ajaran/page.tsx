"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, Pencil, Trash2, X, CheckCircle } from "lucide-react";

interface TahunAjaran {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  aktif: boolean;
  created_at: string;
}

export default function AdminTahunAjaranPage() {
  const supabase = createClient();
  const [data, setData] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    aktif: false,
  });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("tahun_ajaran")
      .select("*")
      .order("nama", { ascending: false });
    setData((rows ?? []) as TahunAjaran[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({ nama: "", tanggal_mulai: "", tanggal_selesai: "", aktif: false });
    setEditId(null);
    setShowForm(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      setError("Nama tahun ajaran wajib diisi");
      return;
    }
    if (!form.tanggal_mulai || !form.tanggal_selesai) {
      setError("Tanggal mulai dan selesai wajib diisi");
      return;
    }
    if (form.tanggal_selesai <= form.tanggal_mulai) {
      setError("Tanggal selesai harus setelah tanggal mulai");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Jika aktif = true, nonaktifkan yang lain dulu
      if (form.aktif) {
        await supabase
          .from("tahun_ajaran")
          .update({ aktif: false })
          .neq("id", editId ?? "");
      }

      const payload = {
        nama: form.nama,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        aktif: form.aktif,
      };

      if (editId) {
        const { error: err } = await supabase
          .from("tahun_ajaran")
          .update(payload)
          .eq("id", editId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("tahun_ajaran")
          .insert(payload);
        if (err) throw err;
      }
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from("tahun_ajaran").delete().eq("id", deleteId);
    setDeleteId(null);
    setDeleting(false);
    await loadData();
  };

  const handleSetAktif = async (id: string) => {
    // Nonaktifkan semua, aktifkan yang dipilih
    await supabase.from("tahun_ajaran").update({ aktif: false }).neq("id", "");
    await supabase.from("tahun_ajaran").update({ aktif: true }).eq("id", id);
    await loadData();
  };

  const startEdit = (ta: TahunAjaran) => {
    setForm({
      nama: ta.nama,
      tanggal_mulai: ta.tanggal_mulai,
      tanggal_selesai: ta.tanggal_selesai,
      aktif: ta.aktif,
    });
    setEditId(ta.id);
    setShowForm(true);
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "nama", header: "Tahun Ajaran", sortable: true },
    {
      key: "tanggal_mulai",
      header: "Mulai",
      sortable: true,
      render: (r) =>
        new Date(r.tanggal_mulai as string).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
    {
      key: "tanggal_selesai",
      header: "Selesai",
      render: (r) =>
        new Date(r.tanggal_selesai as string).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
    {
      key: "aktif",
      header: "Status",
      render: (r) =>
        r.aktif ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Aktif
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Tidak Aktif
          </Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Tahun Ajaran
          </h1>
          <p className="text-muted-foreground">
            Tambah, edit, dan atur tahun ajaran aktif.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Tahun Ajaran
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editId ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Nama Tahun Ajaran</Label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="2026/2027"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={form.tanggal_mulai}
                onChange={(e) =>
                  setForm({ ...form, tanggal_mulai: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={form.tanggal_selesai}
                onChange={(e) =>
                  setForm({ ...form, tanggal_selesai: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aktif"
                checked={form.aktif}
                onChange={(e) =>
                  setForm({ ...form, aktif: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="aktif">Jadikan Tahun Ajaran Aktif</Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={data as unknown as Record<string, unknown>[]}
        columns={columns}
        loading={loading}
        searchPlaceholder="Cari tahun ajaran..."
        actions={(row) => {
          const r = row as unknown as TahunAjaran;
          return (
            <div className="flex gap-1 justify-end">
              {!r.aktif && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Jadikan Aktif"
                  onClick={() => handleSetAktif(r.id)}
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(r)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(r.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Tahun Ajaran"
        description="Yakin ingin menghapus tahun ajaran ini? Semua data kelas yang terkait akan terpengaruh."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
