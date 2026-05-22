import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { STATUS_COLORS, type AttendanceStatus } from "@/constants/Colors";

interface Props {
  status: AttendanceStatus;
  size?: "sm" | "md";
}

/** Badge berwarna untuk status kehadiran: Hadir=hijau, Sakit=kuning, Izin=biru, Alpha=merah */
export function StatusBadge({ status, size = "sm" }: Props) {
  const c = STATUS_COLORS[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }, size === "md" && styles.badgeMd]}>
      <Text style={[styles.text, { color: c.text }, size === "md" && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  badgeMd: { paddingHorizontal: 12, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: "600" },
  textMd: { fontSize: 13 },
});
