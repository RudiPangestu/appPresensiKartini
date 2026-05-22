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
import type { User, Profile } from "@/types/database";

interface UserWithProfile extends User {
  profiles: Profile[] | null;
}

const ROLE_LABELS: Record<string, string> = { admin: "Admin", guru: "Guru", ortu: "Orang Tua" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  guru: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ortu: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const [data, setData] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "guru", nama: "" });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: users } = await supabase
      .from("users")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });
    setData((users ?? []) as UserWithProfile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setForm({ email: "", password: "", role: "guru", nama: "" });
    setEditId(null);
    setShowForm(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) { setError("Nama wajib diisi"); return; }
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        // Update role
        await supabase.from("users").update({ role: form.role }).eq("id", editId);
        // Update profile
        await supabase.from("profiles").update({ nama: form.nama }).eq("user_id", editId);
      } else {
        // Validasi form baru
        if (!form.email.trim()) { setError("Email wajib diisi"); setSaving(false); return; }
        if (form.password.length < 6) { setError("Password minimal 6 karakter"); setSaving(false); return; }

        // Buat auth user via admin API melalui server action (simplified: pakai signUp)
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (authErr) throw authErr;
        if (!authData.user) throw new Error("Gagal membuat user");

        // Insert ke tabel users
        const { error: userErr } = await supabase.from("users").insert({
          id: authData.user.id,
          role: form.role,
        });
        if (userErr) throw userErr;

        // Insert ke tabel profiles
        await supabase.from("profiles").insert({
          user_id: authData.user.id,
          nama: form.nama,
        });
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
    await supabase.from("users").delete().eq("id", deleteId);
    setDeleteId(null);
    setDeleting(false);
    await loadData();
  };

  const startEdit = (user: UserWithProfile) => {
    setForm({
      email: "",
      password: "",
      role: user.role,
      nama: user.profiles?.[0]?.nama ?? "",
    });
    setEditId(user.id);
    setShowForm(true);
  };

  const columns: Column<UserWithProfile>[] = [
    { key: "nama", header: "Nama", sortable: true, render: (r) => r.profiles?.[0]?.nama ?? "—" },
    {
      key: "role", header: "Role", sortable: true,
      render: (r) => <Badge variant="outline" className={ROLE_COLORS[r.role]}>{ROLE_LABELS[r.role]}</Badge>,
    },
    { key: "no_hp", header: "No. HP", render: (r) => r.profiles?.[0]?.no_hp ?? "—" },
    { key: "created_at", header: "Terdaftar", sortable: true, render: (r) => new Date(r.created_at).toLocaleDateString("id-ID") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Users</h1>
          <p className="text-muted-foreground">CRUD users, assign role, dan reset password.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Tambah User
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? "Edit User" : "Tambah User Baru"}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
            {!editId && (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="user@smakartini.sch.id" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Minimal 6 karakter" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="Nama lengkap" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
                <option value="ortu">Orang Tua</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Batal</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={data as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        loading={loading}
        searchPlaceholder="Cari nama atau role..."
        actions={(row) => {
          const r = row as unknown as UserWithProfile;
          return (
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          );
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus User"
        description="Yakin ingin menghapus user ini? Aksi ini tidak bisa dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
