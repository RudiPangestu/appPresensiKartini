import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBadge } from "./StatusBadge";
import type { AttendanceStatus } from "@/constants/Colors";

interface Props {
  index: number;
  nama: string;
  nisn: string;
  status: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpha"];

/** Baris siswa dengan toggle status kehadiran */
export function StudentListItem({ index, nama, nisn, status, onStatusChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.index}>{index}</Text>
        <View style={styles.nameWrap}>
          <Text style={styles.nama} numberOfLines={1}>{nama}</Text>
          <Text style={styles.nisn}>{nisn}</Text>
        </View>
      </View>
      <View style={styles.buttons}>
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity key={s} onPress={() => onStatusChange(s)} style={[styles.btn, status === s && styles.btnActive]}>
            <StatusBadge status={s} size={status === s ? "md" : "sm"} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  info: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  index: { width: 28, fontSize: 13, color: "#94a3b8", fontFamily: "monospace", textAlign: "center" },
  nameWrap: { flex: 1 },
  nama: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  nisn: { fontSize: 11, color: "#94a3b8" },
  buttons: { flexDirection: "row", gap: 6 },
  btn: { opacity: 0.5 },
  btnActive: { opacity: 1 },
});
