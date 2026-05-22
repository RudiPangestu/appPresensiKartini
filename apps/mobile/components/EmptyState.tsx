import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface Props {
  icon?: keyof typeof FontAwesome.glyphMap;
  title?: string;
  message?: string;
}

/** Tampilan kosong yang informatif */
export function EmptyState({ icon = "inbox", title = "Tidak ada data", message = "Belum ada data untuk ditampilkan" }: Props) {
  return (
    <View style={styles.container}>
      <FontAwesome name={icon} size={48} color="#cbd5e1" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 40 },
  title: { fontSize: 16, fontWeight: "600", color: "#94a3b8", marginTop: 12 },
  message: { fontSize: 13, color: "#cbd5e1", marginTop: 4, textAlign: "center" },
});
