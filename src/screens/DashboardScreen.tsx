import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, Animated, Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const { width: W } = Dimensions.get("window");

const ROLE_ACCENTS: Record<string, string> = {
  admin: "#6366f1", subadmin: "#8b5cf6", dealer: "#0ea5e9",
  dealer_member: "#06b6d4", reporting_authority: "#f59e0b",
  manager: "#10b981", sales: "#3b82f6", campaign_master: "#ef4444",
};

const PALETTE = [
  "#6366f1", "#8b5cf6", "#0ea5e9", "#10b981",
  "#f59e0b", "#ef4444", "#06b6d4",
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", subadmin: "Sub-Admin", dealer: "Dealer",
  dealer_member: "Dealer Member", reporting_authority: "LMS RA",
  manager: "Manager", sales: "Sales Rep", campaign_master: "Campaign",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseChange(raw: any): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseFloat(String(raw).replace(/%/g, ""));
  return isNaN(n) ? null : n;
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <View style={secS.wrap}>
      <Text style={[secS.text, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[secS.line, { backgroundColor: theme.cardBorder }]} />
    </View>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, changeRaw, idx }: any) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const change = parseChange(changeRaw);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 420 + idx * 80, useNativeDriver: true,
    }).start();
  }, []);

  const isPositive = change !== null && change >= 0;

  return (
    <Animated.View style={[
      kS.card,
      { backgroundColor: theme.card, borderColor: theme.cardBorder },
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] },
    ]}>
      {/* top accent bar */}
      <View style={[kS.bar, { backgroundColor: color }]} />

      <View style={kS.body}>
        {/* icon dot */}
        <View style={[kS.iconBox, { backgroundColor: color + "18" }]}>
          <View style={[kS.iconDot, { backgroundColor: color }]} />
        </View>

        <Text style={[kS.value, { color }]}>{value ?? "—"}</Text>
        <Text style={[kS.label, { color: theme.textMuted }]} numberOfLines={1}>{label}</Text>

        {change !== null && (
          <View style={[kS.badge, { backgroundColor: isPositive ? "#10b98115" : "#ef444415" }]}>
            <Text style={[kS.badgeTxt, { color: isPositive ? "#10b981" : "#ef4444" }]}>
              {isPositive ? "▲" : "▼"} {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Source Row ───────────────────────────────────────────────────────────────
function SourceRow({ name, count, color, max, isLast }: any) {
  const { theme } = useTheme();
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  return (
    <View style={[srS.wrap, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder }]}>
      <View style={[srS.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <View style={srS.topRow}>
          <Text style={[srS.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
          <Text style={[srS.count, { color }]}>{count}</Text>
        </View>
        <View style={[srS.track, { backgroundColor: color + "18" }]}>
          <View style={[srS.fill, { backgroundColor: color, width: `${pct}%` as any }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ item, accent, isLast }: any) {
  const { theme } = useTheme();
  return (
    <View style={[acS.wrap, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder }]}>
      <View style={[acS.line, { backgroundColor: accent + "40" }]}>
        <View style={[acS.dot, { backgroundColor: accent }]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[acS.title, { color: theme.text }]} numberOfLines={1}>
          {item.leadname || item.lead || item.title || "Activity"}
        </Text>
        {(item.note || item.description) && (
          <Text style={[acS.note, { color: theme.textMuted }]} numberOfLines={1}>
            {item.note || item.description}
          </Text>
        )}
        <Text style={[acS.time, { color: theme.textMuted }]}>{item.time || item.date || ""}</Text>
      </View>
    </View>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { currentUser } = useAuth();
  const { theme, isDark } = useTheme();
  const accent = ROLE_ACCENTS[currentUser?.role || "sales"] || "#6366f1";

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData]           = useState<any>(null);

  const fetch = async () => {
    try {
      const res = await api.post("/dashboard", { submittype: "stats" });
      if (res?.success) setData(res);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, []);
  const onRefresh = () => { setRefreshing(true); fetch(); };

  const kpis       = data?.kpis || [];
  const activities = data?.activities || [];
  const sources    = data?.sourceData || [];
  const maxSource  = sources.length ? Math.max(...sources.map((s: any) => s.count || s.value || 0)) : 1;

  const initials = (currentUser?.name || currentUser?.email || "U")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[currentUser?.role || ""] || String(currentUser?.role || "").replace(/_/g, " ");

  if (loading) {
    return (
      <View style={[g.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={accent} size="large" />
        <Text style={[g.loadTxt, { color: theme.textMuted }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={g.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
    >
      {/* ── Hero ── */}
      <View style={[g.hero, { backgroundColor: isDark ? "#0d1626" : "#f0f4ff", borderColor: accent + "28" }]}>
        {/* glow blob */}
        <View style={[g.glow, { backgroundColor: accent + "14" }]} />

        <View style={g.heroRow}>
          {/* Avatar */}
          <View style={[g.avatar, { backgroundColor: accent + "20", borderColor: accent + "50" }]}>
            <Text style={[g.avatarTxt, { color: accent }]}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[g.greet, { color: theme.textMuted }]}>Welcome back</Text>
            <Text style={[g.name, { color: theme.text }]}>
              {currentUser?.name?.split(" ")[0] || "User"}
            </Text>
          </View>

          <View style={[g.roleBadge, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
            <View style={[g.roleDot, { backgroundColor: accent }]} />
            <Text style={[g.roleText, { color: accent }]}>{roleLabel.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={[g.date, { color: theme.textMuted }]}>{formatDate()}</Text>
      </View>

      {/* ── KPIs ── */}
      {kpis.length > 0 && (
        <>
          <SectionHeader title="Overview" />
          <View style={g.grid}>
            {kpis.map((k: any, i: number) => (
              <KpiCard
                key={i} idx={i}
                label={k.title || k.label}
                value={k.value}
                color={PALETTE[i % PALETTE.length]}
                changeRaw={k.change}
              />
            ))}
          </View>
        </>
      )}

      {/* ── Lead Sources ── */}
      {sources.length > 0 && (
        <>
          <SectionHeader title="Lead Sources" />
          <View style={[g.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {sources.slice(0, 6).map((src: any, i: number) => (
              <SourceRow
                key={i}
                name={src.source || src.name || "Unknown"}
                count={src.count || src.value || 0}
                color={PALETTE[i % PALETTE.length]}
                max={maxSource}
                isLast={i === Math.min(sources.length, 6) - 1}
              />
            ))}
          </View>
        </>
      )}

      {/* ── Recent Activity ── */}
      {activities.length > 0 && (
        <>
          <SectionHeader title="Recent Activity" />
          <View style={[g.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {activities.slice(0, 6).map((a: any, i: number) => (
              <ActivityRow
                key={i}
                item={a}
                accent={accent}
                isLast={i === Math.min(activities.length, 6) - 1}
              />
            ))}
          </View>
        </>
      )}

      {!kpis.length && !activities.length && (
        <View style={g.empty}>
          <Text style={[g.emptyIcon, { color: theme.textMuted }]}>◎</Text>
          <Text style={[g.emptyTitle, { color: theme.text }]}>No data yet</Text>
          <Text style={[g.emptySub, { color: theme.textMuted }]}>Pull down to refresh</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const g = StyleSheet.create({
  scroll:   { padding: 16, paddingBottom: 100 },
  center:   { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  loadTxt:  { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },

  hero: {
    borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 20,
    overflow: "hidden", position: "relative",
  },
  glow: {
    position: "absolute", top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
  },
  heroRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar:    { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 17, fontWeight: "800" },
  greet:     { fontSize: 11, letterSpacing: 0.4, marginBottom: 2 },
  name:      { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  roleDot:   { width: 5, height: 5, borderRadius: 3 },
  roleText:  { fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  date:      { fontSize: 12, letterSpacing: 0.3 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },

  card: { borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: "hidden" },

  empty:      { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptySub:   { fontSize: 12 },
});

const kS = StyleSheet.create({
  card: {
    width: (W - 42) / 2, borderRadius: 16, borderWidth: 1,
    overflow: "hidden", position: "relative",
  },
  bar:     { height: 3, width: "100%" },
  body:    { padding: 14 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  iconDot: { width: 9, height: 9, borderRadius: 5 },
  value:   { fontSize: 26, fontWeight: "900", letterSpacing: -0.8, marginBottom: 3 },
  label:   { fontSize: 11, fontWeight: "500", lineHeight: 15 },
  badge:   { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 8 },
  badgeTxt:{ fontSize: 10, fontWeight: "700" },
});

const secS = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  text: { fontSize: 10, fontWeight: "900", letterSpacing: 2, flexShrink: 0 },
  line: { flex: 1, height: 1 },
});

const srS = StyleSheet.create({
  wrap:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  dot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  name:   { fontSize: 13, fontWeight: "500", flex: 1, marginRight: 8 },
  count:  { fontSize: 13, fontWeight: "800" },
  track:  { height: 4, borderRadius: 2, overflow: "hidden" },
  fill:   { height: 4, borderRadius: 2 },
});

const acS = StyleSheet.create({
  wrap:  { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  line:  { width: 2, borderRadius: 1, alignItems: "center", paddingTop: 5 },
  dot:   { width: 8, height: 8, borderRadius: 4, marginTop: 1 },
  title: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  note:  { fontSize: 11, marginBottom: 2 },
  time:  { fontSize: 10, marginTop: 2 },
});
