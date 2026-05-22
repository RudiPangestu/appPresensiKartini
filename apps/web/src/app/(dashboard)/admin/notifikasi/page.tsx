"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Smartphone, AlertTriangle, CheckCircle, Clock, RefreshCw, Search, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import type { NotifikasiLog } from "@/types/database";

type FilterTipe = "all" | "absen" | "reminder_kegiatan" | "rekap_mingguan";
type FilterChannel = "all" | "push" | "email" | "whatsapp";
type FilterStatus = "all" | "terkirim" | "gagal" | "pending";

export default function AdminNotifikasiPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<(NotifikasiLog & { siswa_nama?: string })[]>([]);
  const [stats, setStats] = useState({ total: 0, terkirim: 0, gagal: 0, pending: 0 });
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState<FilterTipe>("all");
  const [filterChannel, setFilterChannel] = useState<FilterChannel>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [resending, setResending] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Stats
      const { count: total } = await supabase.from("notifikasi_log").select("id", { count: "exact", head: true });
      const { count: terkirim } = await supabase.from("notifikasi_log").select("id", { count: "exact", head: true }).eq("status", "terkirim");
      const { count: gagal } = await supabase.from("notifikasi_log").select("id", { count: "exact", head: true }).eq("status", "gagal");
      const { count: pending } = await supabase.from("notifikasi_log").select("id", { count: "exact", head: true }).eq("status", "pending");
      setStats({ total: total ?? 0, terkirim: terkirim ?? 0, gagal: gagal ?? 0, pending: pending ?? 0 });

      // Logs
      let query = supabase
        .from("notifikasi_log")
        .select("*, siswa(nama)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterTipe !== "all") query = query.eq("tipe", filterTipe);
      if (filterChannel !== "all") query = query.eq("channel", filterChannel);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);

      const { data } = await query;
      const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as NotifikasiLog),
        siswa_nama: ((row.siswa as Record<string, unknown>)?.nama as string) ?? "—",
      }));
      setLogs(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipe, filterChannel, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.pesan.toLowerCase().includes(q) ||
      log.dikirim_ke.toLowerCase().includes(q) ||
      (log.siswa_nama ?? "").toLowerCase().includes(q)
    );
  });

  async function handleResend(log: NotifikasiLog) {
    setResending(log.id);
    try {
      // Panggil API notify-absen untuk kirim ulang
      const res = await fetch("/api/notify-absen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record: {
            siswa_id: log.siswa_id,
            status: "alpha", // default
            tanggal: new Date().toISOString().split("T")[0],
            mapel_id: null,
            catatan: `Kirim ulang notifikasi: ${log.pesan}`,
          },
        }),
      });

      if (res.ok) {
        // Update status log lama
        await supabase
          .from("notifikasi_log")
          .update({ status: "terkirim", error_msg: "Dikirim ulang" })
          .eq("id", log.id);
        await loadData();
      }
    } catch (err) {
      console.error("Resend error:", err);
    } finally {
      setResending(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "terkirim":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle className="mr-1 h-3 w-3" /> Terkirim</Badge>;
      case "gagal":
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Gagal</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  }

  function getChannelIcon(channel: string) {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4 text-blue-500" />;
      case "push": return <Smartphone className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-purple-500" />;
    }
  }

  function getTipeBadge(tipe: string) {
    const colors: Record<string, string> = {
      absen: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      reminder_kegiatan: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      rekap_mingguan: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
    };
    const labels: Record<string, string> = {
      absen: "Absen",
      reminder_kegiatan: "Kegiatan",
      rekap_mingguan: "Rekap",
    };
    return <Badge className={colors[tipe] ?? ""}>{labels[tipe] ?? tipe}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground">
            Log semua notifikasi yang dikirim ke orang tua/wali.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terkirim</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.terkirim}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gagal</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.gagal}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari siswa, pesan, atau tujuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />

              <select
                value={filterTipe}
                onChange={(e) => setFilterTipe(e.target.value as FilterTipe)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Semua Tipe</option>
                <option value="absen">Absen</option>
                <option value="reminder_kegiatan">Kegiatan</option>
                <option value="rekap_mingguan">Rekap</option>
              </select>

              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value as FilterChannel)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Semua Channel</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="terkirim">Terkirim</option>
                <option value="gagal">Gagal</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Waktu</th>
                  <th className="px-4 py-3 text-left font-medium">Siswa</th>
                  <th className="px-4 py-3 text-left font-medium">Tipe</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Tujuan</th>
                  <th className="px-4 py-3 text-left font-medium">Pesan</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      {loading ? "Memuat..." : "Belum ada log notifikasi"}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        {new Date(log.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.siswa_nama}</td>
                      <td className="px-4 py-3">{getTipeBadge(log.tipe)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {getChannelIcon(log.channel)}
                          <span className="capitalize">{log.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate" title={log.dikirim_ke}>
                        {log.dikirim_ke}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={log.pesan}>
                        {log.pesan}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(log.status)}
                          {log.error_msg && (
                            <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={log.error_msg}>
                              {log.error_msg}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "gagal" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(log)}
                            disabled={resending === log.id}
                          >
                            <RefreshCw className={`mr-1 h-3 w-3 ${resending === log.id ? "animate-spin" : ""}`} />
                            {resending === log.id ? "..." : "Kirim Ulang"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
