import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/Colors";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ siswa: 0, guru: 0, kelas: 0, mapel: 0 });
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    try {
      const [s, g, k, m] = await Promise.all([
        supabase.from("siswa").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("guru").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("kelas").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("mata_pelajaran").select("id", { count: "exact", head: true }).is("deleted_at", null),
      ]);
      setStats({ siswa: s.count ?? 0, guru: g.count ?? 0, kelas: k.count ?? 0, mapel: m.count ?? 0 });
    } catch (err) { console.error(err); }
  }

  useEffect(() => { loadStats(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  const cards = [
    { label: "Total Siswa", value: stats.siswa, color: Colors.primary },
    { label: "Total Guru", value: stats.guru, color: Colors.success },
    { label: "Total Kelas", value: stats.kelas, color: Colors.warning },
    { label: "Mata Pelajaran", value: stats.mapel, color: Colors.info },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.welcome}>Dashboard Admin</Text>
      <Text style={styles.subtitle}>Ringkasan data SMA Kartini</Text>

      <View style={styles.grid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.card}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <Text style={styles.cardValue}>{c.value}</Text>
            <Text style={styles.cardLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Tip</Text>
        <Text style={styles.infoText}>
          Kelola data master (siswa, guru, kelas, mapel) melalui web dashboard di browser untuk pengalaman terbaik.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  welcome: { fontSize: 24, fontWeight: "800", color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  cardLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  infoBox: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 40 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: Colors.primary, marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
