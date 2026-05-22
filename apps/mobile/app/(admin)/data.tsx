import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/Colors";

interface DataItem { label: string; count: number; icon: string }

export default function AdminDataScreen() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const tables = [
      { label: "Users", table: "profiles" },
      { label: "Siswa", table: "siswa" },
      { label: "Guru", table: "guru" },
      { label: "Kelas", table: "kelas" },
      { label: "Mata Pelajaran", table: "mata_pelajaran" },
      { label: "Kegiatan", table: "kegiatan_sekolah" },
    ];
    const icons = ["👤", "🎓", "👨‍🏫", "🏫", "📚", "📅"];
    const results = await Promise.all(
      tables.map((t) => supabase.from(t.table).select("id", { count: "exact", head: true }).is("deleted_at", null))
    );
    setItems(tables.map((t, i) => ({ label: t.label, count: results[i].count ?? 0, icon: icons[i] })));
  }

  useEffect(() => { loadData(); }, []);

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Data Master</Text>
      <Text style={styles.subtitle}>Kelola data melalui web dashboard</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.icon}>{item.icon}</Text>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowCount}>{item.count} data</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  icon: { fontSize: 24, marginRight: 14 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  rowCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
