import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";

export default function OrtuProfilScreen() {
  const { user, signOut } = useAuth();
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: profile } = await supabase.from("profiles").select("nama, no_hp").eq("user_id", user!.id).single();
      if (profile) { setNama(profile.nama ?? ""); setNoHp(profile.no_hp ?? ""); }
      const { data: siswa } = await supabase.from("siswa").select("nama").eq("user_id", user!.id).single();
      if (siswa) setChildName(siswa.nama);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
    if (!nama.trim()) { Alert.alert("Error", "Nama wajib diisi"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nama, no_hp: noHp || null }).eq("user_id", user!.id);
    setSaving(false);
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Berhasil", "Profil berhasil disimpan");
  }

  function handleLogout() {
    Alert.alert("Keluar", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: signOut },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {childName ? <Text style={styles.child}>Anak: {childName}</Text> : null}
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nama Lengkap</Text>
        <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholder="Nama lengkap" />

        <Text style={styles.label}>No. HP</Text>
        <TextInput style={styles.input} value={noHp} onChangeText={setNoHp} placeholder="08xx" keyboardType="phone-pad" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? "Menyimpan..." : "Simpan"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  email: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  child: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  form: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 4, marginTop: 12 },
  input: { height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 15, backgroundColor: Colors.inputBg },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, padding: 14, alignItems: "center", marginTop: 20 },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 10, padding: 16, marginTop: 20, borderWidth: 1, borderColor: "#fecaca" },
  logoutText: { fontSize: 15, color: Colors.danger, fontWeight: "600" },
});
