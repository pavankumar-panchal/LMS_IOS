import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const { width: W } = Dimensions.get("window");

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.error || "Login failed. Invalid credentials.");
  };

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* Background Decor */}
      <View style={[s.glow, { backgroundColor: theme.primary + "08" }]} />
      
      <ScrollView contentContainerStyle={[s.scroll, { backgroundColor: theme.bg }]} style={{ backgroundColor: theme.bg }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={s.header}>
          <View style={[s.logoBox, { backgroundColor: theme.primary }]}>
            <Text style={s.logoText}>L</Text>
          </View>
          <Text style={[s.appName, { color: theme.text }]}>LMS PRO</Text>
          <Text style={[s.tagline, { color: theme.textMuted }]}>Management Workspace</Text>
        </View>

        {/* Login Card */}
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[s.cardHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[s.cardTitle, { color: theme.textSecondary }]}>SIGN IN</Text>
          </View>

          <View style={s.cardBody}>
            {!!error && (
              <View style={[s.errorBanner, { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
                <Text style={s.errorIcon}>✕</Text>
                <Text style={[s.errorMsg, { color: "#ef4444" }]}>{error}</Text>
                <TouchableOpacity onPress={() => setError("")}>
                  <Text style={{ color: "#ef4444", fontSize: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[s.label, { color: theme.textSecondary }]}>Account Identifier</Text>
            <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="Username or email address"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[s.label, { color: theme.textSecondary }]}>Security Key</Text>
            <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, flexDirection: "row" }]}>
              <TextInput
                style={[s.input, { color: theme.text, flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                <Text style={[s.eyeText, { color: showPass ? theme.primary : theme.textMuted }]}>
                  {showPass ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[s.btn, { backgroundColor: theme.primary }, loading && s.btnDisabled]} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={s.btnContent}>
                  <Text style={s.btnText}>Authenticate</Text>
                  <Text style={s.btnArrow}>→</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Switching & Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.themeToggle} onPress={toggleTheme} activeOpacity={0.7}>
            <Text style={[s.footerText, { color: theme.textMuted }]}>
              Switch to {isDark ? "Light" : "Dark"} Mode
            </Text>
          </TouchableOpacity>
          <Text style={[s.versionText, { color: theme.textMuted }]}>v1.0.0 · Secure Terminal</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: "absolute", top: -W * 0.2, right: -W * 0.2,
    width: W * 0.8, height: W * 0.8, borderRadius: W * 0.4,
  },
  scroll: { flexGrow: 1, padding: 24, paddingVertical: 40 },
  
  header: { alignItems: "center", marginBottom: 40, paddingTop: 40 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "900" },
  appName: { fontSize: 24, fontWeight: "800", letterSpacing: 2 },
  tagline: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 4, textTransform: "uppercase" },

  card: {
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 4,
  },
  cardHeader: {
    paddingVertical: 16, borderBottomWidth: 1, alignItems: "center",
  },
  cardTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 3 },
  cardBody: { padding: 24 },
  
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 8, marginTop: 16, textTransform: "uppercase" },
  inputWrap: {
    borderWidth: 1, borderRadius: 12, overflow: "hidden",
  },
  input: {
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: "500",
  },
  eyeBtn: { paddingHorizontal: 16, justifyContent: "center" },
  eyeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  btn: {
    borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
  btnArrow: { color: "#fff", fontSize: 20, fontWeight: "300" },

  footer: { marginTop: 40, alignItems: "center", gap: 12 },
  themeToggle: { padding: 8 },
  footerText: { fontSize: 13, fontWeight: "600" },
  versionText: { fontSize: 10, fontWeight: "500", letterSpacing: 0.5 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  errorIcon: { fontSize: 12, fontWeight: "900", color: "#ef4444" },
  errorMsg: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
