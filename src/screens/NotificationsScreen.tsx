import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const TYPE_COLORS: Record<string, string> = {
  call:      "#6366f1",
  email:     "#0ea5e9",
  note:      "#8b5cf6",
  status:    "#f59e0b",
  meeting:   "#10b981",
  followup:  "#3b82f6",
  converted: "#10b981",
  system:    "#64748b",
};

const FILTERS = [
  { value: "all",       label: "All" },
  { value: "followup",  label: "Follow-ups" },
  { value: "call",      label: "Calls" },
  { value: "status",    label: "Status" },
  { value: "converted", label: "Converted" },
];

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [items, setItems]         = useState<any[]>([]);
  const [filter, setFilter]       = useState("all");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds]     = useState<Set<string>>(new Set());

  const fetchActivity = useCallback(async () => {
    try {
      const res = await api.post("/activity", { submittype: "list", limit: 60 });
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchActivity(); }, [fetchActivity]));

  const onRefresh = () => { setRefreshing(true); fetchActivity(); };

  const markRead = (id: string) => setReadIds(p => new Set([...p, id]));
  const markAllRead = () => setReadIds(new Set(items.map(i => String(i.id ?? i.activityid))));

  const filtered = filter === "all"
    ? items
    : items.filter(n => (n.type || n.activitytype || "").toLowerCase() === filter);

  const unreadItems = items.filter(i => !readIds.has(String(i.id ?? i.activityid)));
  const unreadCount = unreadItems.length;

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={[s.headerTitle, { color: theme.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[s.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={s.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={[s.markBtn, { borderColor: theme.cardBorder }]}>
            <Text style={[s.markBtnText, { color: theme.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingVertical: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              s.chip,
              { borderColor: theme.cardBorder, backgroundColor: theme.card },
              filter === f.value && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[s.chipText, { color: theme.textMuted }, filter === f.value && { color: "#fff" }]}>
              {f.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item.id ?? item.activityid ?? idx)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIcon, { borderColor: theme.cardBorder }]}>
              <Text style={[s.emptyIconText, { color: theme.textMuted }]}>✓</Text>
            </View>
            <Text style={[s.emptyTitle, { color: theme.textSecondary }]}>All caught up</Text>
            <Text style={[{ color: theme.textMuted, fontSize: 12 }]}>No activity to show</Text>
          </View>
        }
        renderItem={({ item }) => {
          const itemId  = String(item.id ?? item.activityid ?? Math.random());
          const isRead  = readIds.has(itemId);
          const type    = (item.type || item.activitytype || "system").toLowerCase();
          const color   = TYPE_COLORS[type] || theme.primary;
          const title   = item.leadname || item.lead || item.title || "Activity";
          const body    = item.description || item.note || item.remarks || "";
          const time    = item.time || item.eventdatetime || item.date || "";

          return (
            <TouchableOpacity
              style={[
                s.card,
                {
                  backgroundColor: !isRead ? color + "08" : theme.card,
                  borderColor: !isRead ? color + "25" : theme.cardBorder,
                },
              ]}
              onPress={() => markRead(itemId)}
              activeOpacity={0.75}
            >
              <View style={[s.bar, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <View style={s.cardTop}>
                  <View style={[s.typeBadge, { backgroundColor: color + "18" }]}>
                    <Text style={[s.typeText, { color }]}>{type.toUpperCase()}</Text>
                  </View>
                  {!isRead && <View style={[s.dot, { backgroundColor: color }]} />}
                </View>
                <Text style={[s.cardTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                {!!body && (
                  <Text style={[s.cardBody, { color: theme.textMuted }]} numberOfLines={2}>{body}</Text>
                )}
                <Text style={[s.cardTime, { color: theme.textMuted }]}>{timeAgo(time)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center:       { flex: 1, alignItems: "center", justifyContent: "center" },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  headerTitle:  { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  unreadBadge:  { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  unreadText:   { color: "#fff", fontSize: 10, fontWeight: "800" },
  markBtn:      { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  markBtnText:  { fontSize: 12, fontWeight: "700" },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText:     { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  card:         { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  bar:          { width: 3, borderRadius: 2, alignSelf: "stretch", flexShrink: 0 },
  cardTop:      { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  typeBadge:    { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  typeText:     { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  dot:          { width: 6, height: 6, borderRadius: 3 },
  cardTitle:    { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  cardBody:     { fontSize: 12, lineHeight: 17, marginBottom: 5 },
  cardTime:     { fontSize: 10, fontWeight: "600" },
  empty:        { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyIcon:    { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyIconText:{ fontSize: 22 },
  emptyTitle:   { fontSize: 15, fontWeight: "700" },
});
