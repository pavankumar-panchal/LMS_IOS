import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const TYPE_ACCENTS: Record<string, string> = {
  call: "#3b82f6",
  email: "#6366f1",
  note: "#f59e0b",
  status: "#8b5cf6",
  meeting: "#10b981",
  followup: "#0ea5e9",
  converted: "#10b981",
};

const TYPE_LABELS: Record<string, string> = {
  call: "Call", email: "Email", note: "Note", status: "Status",
  meeting: "Meeting", followup: "Follow-up", converted: "Converted",
};

function ActivityCard({ item }: { item: any }) {
  const { theme } = useTheme();
  const type = String(item.type || "").toLowerCase();
  const color = TYPE_ACCENTS[type] || theme.primary;
  const label = TYPE_LABELS[type] || item.type || "";

  return (
    <View style={[ac.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Left color bar */}
      <View style={[ac.bar, { backgroundColor: color }]} />

      <View style={ac.content}>
        <View style={ac.topRow}>
          <Text style={[ac.lead, { color: theme.text }]} numberOfLines={1}>
            {item.leadname || item.lead || item.title || "Activity"}
          </Text>
          {label ? (
            <View style={[ac.badge, { backgroundColor: color + "18", borderColor: color + "35" }]}>
              <Text style={[ac.badgeText, { color }]}>{label}</Text>
            </View>
          ) : null}
        </View>

        {(item.note || item.description) ? (
          <Text style={[ac.note, { color: theme.textMuted }]} numberOfLines={2}>
            {item.note || item.description}
          </Text>
        ) : null}

        <View style={ac.footer}>
          <View style={[ac.dot, { backgroundColor: color }]} />
          <Text style={[ac.time, { color: theme.textMuted }]}>
            {item.time || item.date || item.createdat || "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const { theme } = useTheme();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.post("/activity", { submittype: "list", limit: 50 });
      if (res?.success) setActivities(res.data || []);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[s.loadText, { color: theme.textMuted }]}>Loading activity...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(_, i) => String(i)}
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={s.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={theme.primary}
        />
      }
      ListHeaderComponent={
        <Text style={[s.header, { color: theme.textMuted }]}>
          {activities.length} {activities.length === 1 ? "record" : "records"}
        </Text>
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <View style={[s.emptyIcon, { borderColor: theme.cardBorder }]}>
            <View style={[s.emptyDot, { backgroundColor: theme.textMuted }]} />
          </View>
          <Text style={[s.emptyTitle, { color: theme.textSecondary }]}>No activities</Text>
          <Text style={[s.emptySub, { color: theme.textMuted }]}>Pull down to refresh</Text>
        </View>
      }
      renderItem={({ item }) => <ActivityCard item={item} />}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadText: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
  list: { padding: 16, paddingBottom: 110, gap: 0 },
  header: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyDot: { width: 12, height: 12, borderRadius: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptySub: { fontSize: 12 },
});

const ac = StyleSheet.create({
  card: {
    flexDirection: "row", borderRadius: 14, borderWidth: 1,
    marginBottom: 10, overflow: "hidden",
  },
  bar: { width: 3 },
  content: { flex: 1, padding: 14, gap: 0 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  lead: { fontSize: 14, fontWeight: "700", flex: 1, letterSpacing: 0.1 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  note: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  time: { fontSize: 11, letterSpacing: 0.2 },
});
