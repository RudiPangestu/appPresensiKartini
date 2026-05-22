import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import type { AttendanceStatus } from "@/constants/Colors";
import { StudentListItem } from "@/components/StudentListItem";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

interface MapelOption { id: string; nama: string; kode: string; kelas_id: string }
interface PresensiItem { siswa_id: string; nama: string; nisn: string; status: AttendanceStatus }

export default function GuruPresensiScreen() {
  const { user } = useAuth();
  const { mapel_id } = useLocalSearchParams<{ mapel_id?: string }>();
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [selectedMapel, setSelectedMapel] = useState(mapel_id ?? "");
  const [items, setItems] = useState<PresensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const tanggal = new Date().toISOString().split("T")[0];

  // Load mapel list
  useEffect(() => {
    if (!user) return;
    async function loadMapel() {
      const { data: guru } = await supabase.from("guru").select("id").eq("user_id", user!.id).single();
      if (!guru) { setLoading(false); return; }
      const { data } = await supabase.from("mata_pelajaran").select("id, nama, kode, kelas_id").eq("guru_id", guru.id).is("deleted_at", null).order("nama");
      setMapelList((data ?? []) as MapelOption[]);
      setLoading(false);
    }
    loadMapel();
  }, [user]);

  // Load siswa when mapel selected
  const loadSiswa = useCallback(async () => {
    if (!selectedMapel) return;
    setLoadingSiswa(true); setSuccess(false); setAlreadyDone(false);
    const mapel = mapelList.find((m) => m.id === selectedMapel);
    if (!mapel?.kelas_id) { setLoadingSiswa(false); setItems([]); return; }

    // Cek duplicate
    const { count } = await supabase.from("presensi").select("id", { count: "exact", head: true })
      .eq("mapel_id", selectedMapel).eq("tanggal", tanggal);
    if ((count ?? 0) > 0) { setAlreadyDone(true); setItems([]); setLoadingSiswa(false); return; }

    const { data: siswaList } = await supabase.from("siswa").select("id, nama, nisn")
      .eq("kelas_id", mapel.kelas_id).is("deleted_at", null).order("nama");
    setItems((siswaList ?? []).map((s) => ({ siswa_id: s.id, nama: s.nama, nisn: s.nisn, status: "hadir" as AttendanceStatus })));
    setLoadingSiswa(false);
  }, [selectedMapel, mapelList, tanggal]);

  useEffect(() => { if (mapelList.length > 0) loadSiswa(); }, [loadSiswa, mapelList]);

  function setStatus(idx: number, status: AttendanceStatus) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, status } : item));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = items.map((item) => ({
        siswa_id: item.siswa_id, mapel_id: selectedMapel, tanggal,
        status: item.status, dicatat_oleh: user!.id,
      }));
      const { error } = await supabase.from("presensi").insert(payload);
      if (error) throw error;
      setSuccess(true); setShowConfirm(false);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Gagal menyimpan");
      setShowConfirm(false);
    } finally { setSubmitting(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Input Presensi</Text>
      <Text style={styles.date}>Tanggal: {new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>

      {/* Mapel selector */}
      <View style={styles.selectorWrap}>
        {mapelList.map((m) => (
          <TouchableOpacity key={m.id} onPress={() => setSelectedMapel(m.id)}
            style={[styles.mapelChip, selectedMapel === m.id && styles.mapelChipActive]}>
            <Text style={[styles.chipText, selectedMapel === m.id && styles.chipTextActive]}>
              {m.nama} ({m.kode})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {alreadyDone && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Presensi sudah diinput untuk mapel dan tanggal ini</Text>
        </View>
      )}

      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ Presensi berhasil disimpan!</Text>
        </View>
      )}

      {loadingSiswa && <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />}

      {!loadingSiswa && items.length === 0 && selectedMapel && !alreadyDone && !success && (
        <EmptyState title="Tidak ada siswa" message="Belum ada siswa di kelas ini" />
      )}

      {items.length > 0 && !success && (
        <>
          <Text style={styles.sectionTitle}>{items.length} Siswa</Text>
          {items.map((item, idx) => (
            <StudentListItem key={item.siswa_id} index={idx + 1} nama={item.nama} nisn={item.nisn}
              status={item.status} onStatusChange={(s) => setStatus(idx, s)} />
          ))}

          {/* Summary + submit */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              H:{items.filter((i) => i.status === "hadir").length}  S:{items.filter((i) => i.status === "sakit").length}  I:{items.filter((i) => i.status === "izin").length}  A:{items.filter((i) => i.status === "alpha").length}
            </Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={() => setShowConfirm(true)}>
            <Text style={styles.submitText}>Submit Presensi</Text>
          </TouchableOpacity>
        </>
      )}

      <ConfirmDialog visible={showConfirm} title="Konfirmasi" message={`Simpan presensi ${items.length} siswa?`}
        confirmLabel="Ya, Submit" onConfirm={handleSubmit} onCancel={() => setShowConfirm(false)} loading={submitting} />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginTop: 8 },
  date: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  selectorWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  mapelChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: "#fff" },
  mapelChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  warning: { backgroundColor: "#fef9c3", borderRadius: 8, padding: 12, marginBottom: 12 },
  warningText: { fontSize: 13, color: "#854d0e" },
  successBox: { backgroundColor: "#dcfce7", borderRadius: 8, padding: 12, marginBottom: 12 },
  successText: { fontSize: 13, color: "#166534" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  summary: { backgroundColor: "#f1f5f9", borderRadius: 8, padding: 12, marginTop: 8 },
  summaryText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary, textAlign: "center", fontFamily: "monospace" },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 16 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
