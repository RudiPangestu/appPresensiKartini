import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import type { AttendanceStatus } from "@/constants/Colors";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

type FilterPeriode = "bulanan" | "triwulan" | "semester" | "tahunan";

const FILTERS: { value: FilterPeriode; label: string }[] = [
  { value: "bulanan", label: "Bulan" },
  { value: "triwulan", label: "Triwulan" },
  { value: "semester", label: "Semester" },
  { value: "tahunan", label: "Tahunan" },
];

function getRange(f: FilterPeriode): { start: string; end: string } {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  switch (f) {
    case "bulanan": return { start: new Date(y, m, 1).toISOString().split("T")[0], end: new Date(y, m + 1, 0).toISOString().split("T")[0] };
    case "triwulan": { const q = Math.floor(m / 3); return { start: new Date(y, q * 3, 1).toISOString().split("T")[0], end: new Date(y, q * 3 + 3, 0).toISOString().split("T")[0] }; }
    case "semester": { const h = m < 6 ? 0 : 6; return { start: new Date(y, h, 1).toISOString().split("T")[0], end: new Date(y, h + 6, 0).toISOString().split("T")[0] }; }
    case "tahunan": return { start: new Date(y, 0, 1).toISOString().split("T")[0], end: new Date(y, 11, 31).toISOString().split("T")[0] };
  }
}

interface Row { id: string; tanggal: string; status: AttendanceStatus; mapel_nama: string }

export default function OrtuKehadiranScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterPeriode>("bulanan");
  const [data, setData] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, persen: 0 });

  async function loadData() {
    if (!user) return;
    const { data: siswa } = await supabase.from("siswa").select("id").eq("user_id", user.id).single();
    if (!siswa) return;
    const { start, end } = getRange(filter);
    const { data: rows } = await supabase.from("presensi")
      .select("id, tanggal, status, mata_pelajaran(nama)")
      .eq("siswa_id", siswa.id).gte("tanggal", start).lte("tanggal", end)
      .order("tanggal", { ascending: false });

    const mapped = (rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, tanggal: r.tanggal as string, status: r.status as AttendanceStatus,
      mapel_nama: ((r.mata_pelajaran as Record<string, unknown>)?.nama as string) ?? "—",
    }));
    setData(mapped);
    const hadir = mapped.filter((r) => r.status === "hadir").length;
    setStats({ total: mapped.length, persen: mapped.length > 0 ? Math.round((hadir / mapped.length) * 100) : 0 });
  }

  useEffect(() => { loadData(); }, [user, filter]);

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.value} onPress={() => setFilter(f.value)}
            style={[styles.filterBtn, filter === f.value && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{stats.total} catatan · {stats.persen}% hadir</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState title="Tidak ada data" message="Belum ada data kehadiran untuk periode ini" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowMapel}>{item.mapel_nama}</Text>
              <Text style={styles.rowDate}>
                {new Date(item.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 0 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: Colors.border },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  statsBar: { paddingHorizontal: 16, paddingVertical: 8 },
  statsText: { fontSize: 13, color: Colors.textSecondary },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  rowLeft: { flex: 1 },
  rowMapel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  rowDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
