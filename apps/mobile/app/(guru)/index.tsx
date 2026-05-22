import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import Colors, { HARI_ID } from "@/constants/Colors";
import { EmptyState } from "@/components/EmptyState";
import { FontAwesome } from "@expo/vector-icons";

interface MapelToday { id: string; nama: string; kode: string; jam_mulai: string; jam_selesai: string; kelas_nama: string }

export default function GuruDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [todayMapel, setTodayMapel] = useState<MapelToday[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!user) return;
    try {
      const { data: guru } = await supabase.from("guru").select("id").eq("user_id", user.id).single();
      if (!guru) return;

      const hariIni = HARI_ID[new Date().getDay()];
      const { data: mapelList } = await supabase
        .from("mata_pelajaran").select("id, nama, kode, jam_mulai, jam_selesai, kelas(nama)")
        .eq("guru_id", guru.id).eq("hari", hariIni).is("deleted_at", null).order("jam_mulai");

      setTodayMapel((mapelList ?? []).map((m: Record<string, unknown>) => ({
        id: m.id as string, nama: m.nama as string, kode: m.kode as string,
        jam_mulai: m.jam_mulai as string, jam_selesai: m.jam_selesai as string,
        kelas_nama: ((m.kelas as Record<string, unknown>)?.nama as string) ?? "—",
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [user]);

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  const today = new Date();

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.welcome}>Dashboard Guru</Text>
      <Text style={styles.date}>{HARI_ID[today.getDay()]}, {today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</Text>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{todayMapel.length}</Text>
        <Text style={styles.statLabel}>Kelas Hari Ini</Text>
      </View>

      <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>

      {!loading && todayMapel.length === 0 ? (
        <EmptyState title="Tidak ada jadwal" message="Tidak ada kelas mengajar hari ini" />
      ) : (
        todayMapel.map((m) => (
          <TouchableOpacity key={m.id} style={styles.mapelCard}
            onPress={() => router.push(`/(guru)/presensi?mapel_id=${m.id}`)}>
            <View style={styles.mapelTime}>
              <Text style={styles.timeText}>{m.jam_mulai.slice(0, 5)}</Text>
              <Text style={styles.timeSep}>–</Text>
              <Text style={styles.timeText}>{m.jam_selesai.slice(0, 5)}</Text>
            </View>
            <View style={styles.mapelInfo}>
              <Text style={styles.mapelNama}>{m.nama}</Text>
              <Text style={styles.mapelKelas}>Kelas {m.kelas_nama}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  welcome: { fontSize: 24, fontWeight: "800", color: Colors.textPrimary, marginTop: 8 },
  date: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  statCard: { backgroundColor: Colors.primary, borderRadius: 12, padding: 20, marginBottom: 24, alignItems: "center" },
  statValue: { fontSize: 36, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 14, color: "#dbeafe", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  mapelCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  mapelTime: { alignItems: "center", marginRight: 14, minWidth: 50 },
  timeText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, fontFamily: "monospace" },
  timeSep: { fontSize: 10, color: Colors.textMuted },
  mapelInfo: { flex: 1 },
  mapelNama: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  mapelKelas: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
