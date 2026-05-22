import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  destructive?: boolean;
}

/** Dialog konfirmasi modal untuk aksi penting */
export function ConfirmDialog({
  visible, title, message,
  confirmLabel = "Konfirmasi", cancelLabel = "Batal",
  onConfirm, onCancel, loading = false, destructive = false,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.destructive]}
              onPress={onConfirm} disabled={loading}>
              <Text style={styles.confirmText}>{loading ? "Memproses..." : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  dialog: { backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 360 },
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  message: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 20 },
  buttons: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  cancelText: { fontSize: 14, color: "#64748b" },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primary },
  destructive: { backgroundColor: Colors.danger },
  confirmText: { fontSize: 14, color: "#fff", fontWeight: "600" },
});
