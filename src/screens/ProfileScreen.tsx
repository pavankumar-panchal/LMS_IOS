import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const { width: W } = Dimensions.get("window");

const ROLE_ACCENTS: Record<string, string> = {
  admin: "#6366f1", subadmin: "#8b5cf6", dealer: "#0ea5e9",
  dealer_member: "#06b6d4", reporting_authority: "#f59e0b",
  manager: "#10b981", sales: "#3b82f6", campaign_master: "#ef4444",
};

function SectionLabel({ text }: { text: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[sl.text, { color: theme.textMuted }]}>{text}</Text>
  );
}

function InfoRow({ label, value, isLast, accent }: { label: string; value?: string; isLast?: boolean; accent?: string }) {
  const { theme } = useTheme();
  if (!value) return null;
  return (
    <>
      <View style={ir.row}>
        <Text style={[ir.label, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[ir.value, { color: accent || theme.text }]} numberOfLines={1}>{value}</Text>
      </View>
      {!isLast && <View style={[ir.divider, { backgroundColor: theme.cardBorder }]} />}
    </>
  );
}

function ActionRow({ label, danger, onPress, isLast }: { label: string; danger?: boolean; onPress?: () => void; isLast?: boolean }) {
  const { theme } = useTheme();
  return (
    <>
      <TouchableOpacity style={ar.row} activeOpacity={0.65} onPress={onPress}>
        <Text style={[ar.label, { color: danger ? "#ef4444" : theme.textSecondary }]}>{label}</Text>
        <Text style={[ar.chevron, { color: danger ? "#ef4444" : theme.textMuted }]}>›</Text>
      </TouchableOpacity>
      {!isLast && <View style={[ar.divider, { backgroundColor: theme.cardBorder }]} />}
    </>
  );
}

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();
  const accent = ROLE_ACCENTS[currentUser?.role || "sales"] || "#6366f1";
  const roleName = String(currentUser?.role || "")
    .split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={[s.hero, { backgroundColor: theme.card, borderColor: accent + "25" }]}>
        <View style={[s.heroGlow, { backgroundColor: accent + "10" }]} />

        <View style={[s.avatarRing, { borderColor: accent + "50" }]}>
          <View style={[s.avatar, { backgroundColor: accent + "20" }]}>
            <Text style={[s.avatarText, { color: accent }]}>
              {(currentUser?.avatar || currentUser?.name?.[0] || "U").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[s.heroName, { color: theme.text }]}>
          {currentUser?.name || "User"}
        </Text>
        <View style={[s.roleBadge, { backgroundColor: accent + "15", borderColor: accent + "40" }]}>
          <Text style={[s.roleText, { color: accent }]}>
            {roleName.toUpperCase()}
          </Text>
        </View>
        <Text style={[s.heroEmail, { color: theme.textMuted }]}>
          {currentUser?.email || ""}
        </Text>
      </View>

      {/* ── Account Info ── */}
      <SectionLabel text="ACCOUNT" />
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <InfoRow label="Full Name" value={currentUser?.name} />
        <InfoRow label="Email"     value={currentUser?.email} />
        <InfoRow label="Role"      value={roleName} accent={accent} />
        <InfoRow label="User ID"   value={currentUser ? `#${currentUser.id}` : undefined} />
        <InfoRow
          label="Status"
          value={currentUser?.status === "active" ? "Active" : "Disabled"}
          accent={currentUser?.status === "active" ? "#10b981" : "#ef4444"}
          isLast
        />
      </View>

      {/* ── Quick Actions ── */}
      <SectionLabel text="MANAGE" />
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <ActionRow label="Edit Profile"     onPress={() => navigation.navigate("EditProfile")} />
        <ActionRow label="Change Password"  onPress={() => navigation.navigate("ChangePassword")} isLast />
      </View>

      {/* ── Preferences ── */}
      <SectionLabel text="PREFERENCES" />
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={pref.row}>
          <Text style={[pref.label, { color: theme.textSecondary }]}>
            {isDark ? "Dark Mode" : "Light Mode"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#e2e8f0", true: accent }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* ── App Info ── */}
      <SectionLabel text="APP INFO" />
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <InfoRow label="Version"  value="1.0.0" />
        <InfoRow label="Mode"     value="Live" accent="#10b981" isLast />
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity
        style={[s.signOut, { borderColor: "#ef444435", backgroundColor: "#ef444410" }]}
        activeOpacity={0.75}
        onPress={() => logout()}
      >
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 100, gap: 0 },

  hero: {
    borderRadius: 20, borderWidth: 1, padding: 24,
    alignItems: "center", marginBottom: 28, overflow: "hidden",
    position: "relative",
  },
  heroGlow: {
    position: "absolute", width: W, height: W,
    borderRadius: W / 2, top: -W / 2,
  },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 2,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 30, fontWeight: "800" },
  heroName:   { fontSize: 22, fontWeight: "800", letterSpacing: -0.3, marginBottom: 10 },
  roleBadge:  {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10,
  },
  roleText:   { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  heroEmail:  { fontSize: 13, letterSpacing: 0.2 },

  card: {
    borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: "hidden",
  },
  signOut: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 4, marginBottom: 20,
  },
  signOutText: { color: "#ef4444", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
});

const sl = StyleSheet.create({
  text: { fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 10, marginLeft: 2 },
});

const ir = StyleSheet.create({
  row:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  label:   { fontSize: 13, fontWeight: "500" },
  value:   { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  divider: { height: 1, marginHorizontal: 16 },
});

const ar = StyleSheet.create({
  row:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  label:   { fontSize: 14, fontWeight: "600" },
  chevron: { fontSize: 22, fontWeight: "300" },
  divider: { height: 1, marginHorizontal: 16 },
});

const pref = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontSize: 14, fontWeight: "600" },
});
