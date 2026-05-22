import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

export default function AdminLaporanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Laporan</Text>
      <Text style={styles.subtitle}>Gunakan web dashboard untuk akses penuh fitur laporan, chart, dan export PDF/Excel.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
});
