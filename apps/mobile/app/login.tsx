import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from "react-native";
import { useAuth } from "@/context/auth";
import Colors from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <FontAwesome name="graduation-cap" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>SMA Kartini</Text>
          <Text style={styles.subtitle}>Sistem Presensi Digital</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="guru@smakartini.sch.id"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.pwdWrap}>
            <TextInput
              style={[styles.input, styles.pwdInput]}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(!showPwd)}>
              <FontAwesome name={showPwd ? "eye-slash" : "eye"} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>v0.1.0 · SMA Kartini Batam</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 4, marginTop: 12 },
  input: {
    height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 16, fontSize: 15, backgroundColor: "#fff", color: Colors.textPrimary,
  },
  pwdWrap: { position: "relative" },
  pwdInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 14, top: 14 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 8 },
  loginBtn: {
    height: 48, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center", marginTop: 20,
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 11, color: Colors.textMuted, marginTop: 40 },
});
