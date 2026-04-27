import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

function PasswordField({ label, value, onChange, theme, isDark, error, inputRef, onSubmitEditing, returnKeyType }: any) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.fieldWrap}>
      <Text style={[f.label, { color: error ? "#ef4444" : theme.textMuted }]}>{label.toUpperCase()}</Text>
      <View style={[
        f.inputRow,
        {
          backgroundColor: isDark ? "#1e293b" : "#fff",
          borderColor: error ? "#ef4444" : focused ? theme.primary : theme.cardBorder,
        },
      ]}>
        <TextInput
          ref={inputRef}
          style={[f.input, { color: theme.text }]}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={returnKeyType || "next"}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={() => setShow(v => !v)} style={f.eyeBtn}>
          <Text style={[f.eyeText, { color: show ? theme.primary : theme.textMuted }]}>
            {show ? "HIDE" : "SHOW"}
          </Text>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={f.errMsg}>{error}</Text>}
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { theme, isDark } = useTheme();
  const [oldPassword,     setOldPassword]     = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [banner,   setBanner]   = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const oldRef  = useRef<TextInput>(null);
  const newRef  = useRef<TextInput>(null);
  const confRef = useRef<TextInput>(null);

  const clearErr = (f: string) => setErrors(prev => { const n = { ...prev }; delete n[f]; return n; });

  const handleUpdate = async () => {
    setBanner(null);
    const errs: Record<string, string> = {};
    if (!oldPassword)                        errs.old     = "Current password is required.";
    if (!newPassword)                        errs.new     = "New password is required.";
    else if (newPassword.length < 6)         errs.new     = "Password must be at least 6 characters.";
    else if (newPassword === oldPassword)    errs.new     = "New password must differ from current.";
    if (!confirmPassword)                    errs.confirm = "Please confirm your new password.";
    else if (newPassword !== confirmPassword) errs.confirm = "Passwords do not match.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await api.post("/users", {
        submittype:   "changepassword",
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (res?.success) {
        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
        setErrors({});
        setBanner({ type: "success", msg: "Password updated successfully!" });
      } else {
        setBanner({ type: "error", msg: res?.message || "Incorrect current password. Please try again." });
      }
    } catch {
      setBanner({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Icon */}
      <View style={[s.iconWrap, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}>
        <View style={[s.iconInner, { backgroundColor: theme.primary }]}>
          <Text style={s.iconText}>🔑</Text>
        </View>
      </View>
      <Text style={[s.title, { color: theme.text }]}>Update Password</Text>
      <Text style={[s.sub, { color: theme.textMuted }]}>
        Change your password to keep your account secure
      </Text>

      {/* Inline banner */}
      {banner && (
        <View style={[
          s.banner,
          banner.type === "success"
            ? { backgroundColor: "#10b98118", borderColor: "#10b98140" }
            : { backgroundColor: "#ef444418", borderColor: "#ef444440" },
        ]}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: banner.type === "success" ? "#10b981" : "#ef4444" }}>
            {banner.type === "success" ? "✓" : "✕"}
          </Text>
          <Text style={[s.bannerMsg, { color: banner.type === "success" ? "#10b981" : "#ef4444" }]}>
            {banner.msg}
          </Text>
          <TouchableOpacity onPress={() => setBanner(null)}>
            <Text style={{ color: banner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form Card */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[s.cardTop, { backgroundColor: theme.primary }]} />
        <View style={s.cardBody}>
          <PasswordField
            label="Current Password"
            value={oldPassword}
            onChange={(v: string) => { setOldPassword(v); clearErr("old"); }}
            theme={theme}
            isDark={isDark}
            error={errors.old}
            inputRef={oldRef}
            onSubmitEditing={() => newRef.current?.focus()}
          />
          <View style={[s.divider, { backgroundColor: theme.cardBorder }]} />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={(v: string) => { setNewPassword(v); clearErr("new"); }}
            theme={theme}
            isDark={isDark}
            error={errors.new}
            inputRef={newRef}
            onSubmitEditing={() => confRef.current?.focus()}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(v: string) => { setConfirmPassword(v); clearErr("confirm"); }}
            theme={theme}
            isDark={isDark}
            error={errors.confirm}
            inputRef={confRef}
            returnKeyType="done"
            onSubmitEditing={handleUpdate}
          />

          {/* Strength bar */}
          {newPassword.length > 0 && (
            <View style={[s.strengthRow, { backgroundColor: theme.cardBorder + "40" }]}>
              {[1,2,3,4].map(i => (
                <View
                  key={i}
                  style={[
                    s.strengthBar,
                    {
                      backgroundColor:
                        newPassword.length < 6  ? "#ef4444" :
                        newPassword.length < 8  ? "#f59e0b" :
                        newPassword.length < 12 ? "#10b981" : "#6366f1",
                      opacity: newPassword.length >= i * 3 ? 1 : 0.2,
                    },
                  ]}
                />
              ))}
              <Text style={[s.strengthLabel, { color: theme.textMuted }]}>
                {newPassword.length < 6 ? "Weak" : newPassword.length < 8 ? "Fair" : newPassword.length < 12 ? "Good" : "Strong"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[s.btn, { backgroundColor: theme.primary }, loading && s.btnDisabled]}
        onPress={handleUpdate}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>Update Password</Text>
        }
      </TouchableOpacity>

      <Text style={[s.notice, { color: theme.textMuted }]}>
        Updating your password will require re-login on all devices.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { padding: 24, paddingBottom: 60, alignItems: "center" },
  iconWrap:     { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 20, marginTop: 10 },
  iconInner:    { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  iconText:     { fontSize: 24 },
  title:        { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginBottom: 8, textAlign: "center" },
  sub:          { fontSize: 12, letterSpacing: 0.2, textAlign: "center", lineHeight: 18, marginBottom: 16, paddingHorizontal: 16 },
  banner:       { width: "100%", flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  bannerMsg:    { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  card:         { width: "100%", borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  cardTop:      { height: 3 },
  cardBody:     { padding: 24 },
  divider:      { height: 1, marginVertical: 20 },
  strengthRow:  { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, marginTop: 8 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:{ fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginLeft: 4 },
  btn:          { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  notice:       { fontSize: 10, textAlign: "center", letterSpacing: 0.5, lineHeight: 16, paddingHorizontal: 20 },
});

const f = StyleSheet.create({
  fieldWrap: { marginBottom: 16 },
  label:     { fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 },
  inputRow:  { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, overflow: "hidden" },
  input:     { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: "500" },
  eyeBtn:    { paddingHorizontal: 14, paddingVertical: 14 },
  eyeText:   { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  errMsg:    { fontSize: 11, color: "#ef4444", marginTop: 5, fontWeight: "600" },
});
