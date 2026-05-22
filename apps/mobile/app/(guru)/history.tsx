import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import type { AttendanceStatus } from "@/constants/Colors";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

interface HistoryRow { id: string; tanggal: string; status: AttendanceStatus; siswa_nama: string; mapel_nama: string }

export default function GuruHistoryScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<HistoryRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadHistory() {
    if (!user) return;
    const { data: rows } = await supabase
      .from("presensi")
      .select("id, tanggal, status, siswa(nama), mata_pelajaran(nama)")
      .eq("dicatat_oleh", user.id)
      .order("tanggal", { ascending: false })
      .limit(100);

    setData((rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      tanggal: r.tanggal as string,
      status: r.status as AttendanceStatus,
      siswa_nama: ((r.siswa as Record<string, unknown>)?.nama as string) ?? "—",
      mapel_nama: ((r.mata_pelajaran as Record<string, unknown>)?.nama as string) ?? "—",
    })));
  }

  useEffect(() => { loadHistory(); }, [user]);

  async function onRefresh() { setRefreshing(true); await loadHistory(); setRefreshing(false); }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<Text style={styles.title}>Riwayat Presensi</Text>}
        ListEmptyComponent={<EmptyState title="Belum ada riwayat" message="Riwayat akan muncul setelah Anda menginput presensi" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowNama}>{item.siswa_nama}</Text>
              <Text style={styles.rowDetail}>
                {item.mapel_nama} · {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginBottom: 16, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  rowLeft: { flex: 1 },
  rowNama: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  rowDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
