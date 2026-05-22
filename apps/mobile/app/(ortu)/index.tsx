import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import type { AttendanceStatus } from "@/constants/Colors";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

interface RecentRow { tanggal: string; status: AttendanceStatus; mapel_nama: string }

export default function OrtuDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siswaName, setSiswaName] = useState("");
  const [stats, setStats] = useState({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, persen: 0 });
  const [recent, setRecent] = useState<RecentRow[]>([]);

  async function loadData() {
    if (!user) return;
    try {
      const { data: siswa } = await supabase.from("siswa").select("id, nama").eq("user_id", user.id).single();
      if (!siswa) { setLoading(false); return; }
      setSiswaName(siswa.nama);

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data: rows } = await supabase.from("presensi")
        .select("tanggal, status, mata_pelajaran(nama)")
        .eq("siswa_id", siswa.id).gte("tanggal", start).lte("tanggal", end)
        .order("tanggal", { ascending: false });

      const mapped = (rows ?? []).map((r: Record<string, unknown>) => ({
        tanggal: r.tanggal as string,
        status: r.status as AttendanceStatus,
        mapel_nama: ((r.mata_pelajaran as Record<string, unknown>)?.nama as string) ?? "—",
      }));

      const total = mapped.length;
      const hadir = mapped.filter((r) => r.status === "hadir").length;
      const sakit = mapped.filter((r) => r.status === "sakit").length;
      const izin = mapped.filter((r) => r.status === "izin").length;
      const alpha = mapped.filter((r) => r.status === "alpha").length;

      setStats({ total, hadir, sakit, izin, alpha, persen: total > 0 ? Math.round((hadir / total) * 100) : 0 });
      setRecent(mapped.slice(0, 10));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [user]);

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Dashboard Orang Tua</Text>
      <Text style={styles.subtitle}>{siswaName} · Bulan {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</Text>

      {/* Percentage ring (simplified) */}
      <View style={styles.ringCard}>
        <View style={styles.ringCircle}>
          <Text style={styles.ringPersen}>{stats.persen}%</Text>
          <Text style={styles.ringLabel}>Kehadiran</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {([
          { label: "Hadir", value: stats.hadir, color: Colors.success },
          { label: "Sakit", value: stats.sakit, color: Colors.warning },
          { label: "Izin", value: stats.izin, color: Colors.info },
          { label: "Alpha", value: stats.alpha, color: Colors.danger },
        ]).map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent */}
      <Text style={styles.sectionTitle}>Presensi Terbaru</Text>
      {recent.length === 0 ? (
        <EmptyState title="Belum ada data" message="Data presensi akan muncul setelah guru menginput" />
      ) : (
        recent.map((r, i) => (
          <View key={i} style={styles.recentRow}>
            <View style={styles.recentLeft}>
              <Text style={styles.recentMapel}>{r.mapel_nama}</Text>
              <Text style={styles.recentDate}>
                {new Date(r.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
              </Text>
            </View>
            <StatusBadge status={r.status} />
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  ringCard: { alignItems: "center", marginBottom: 20 },
  ringCircle: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: Colors.primary,
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },
  ringPersen: { fontSize: 32, fontWeight: "800", color: Colors.primary },
  ringLabel: { fontSize: 11, color: Colors.textSecondary },
  statsRow: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  recentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  recentLeft: { flex: 1 },
  recentMapel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  recentDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
