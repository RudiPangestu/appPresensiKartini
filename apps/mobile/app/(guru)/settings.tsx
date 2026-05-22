import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";

export default function GuruSettingsScreen() {
  const { user, signOut } = useAuth();

  function handleLogout() {
    Alert.alert("Keluar", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.email}>{user?.email ?? "—"}</Text>
        <Text style={styles.role}>Guru</Text>
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
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  email: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 10, padding: 16, marginTop: 20, borderWidth: 1, borderColor: "#fecaca" },
  logoutText: { fontSize: 15, color: Colors.danger, fontWeight: "600" },
});
