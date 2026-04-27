import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

export default function UnmappedLeadsScreen() {
  const { theme } = useTheme();
  const [data, setData]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Correct endpoint: get_unmapped_contacts (not get_unmapped_leads)
      const res = await api.post("/mapping_api", { submittype: "get_unmapped_contacts" });
      if (res.success && Array.isArray(res.data)) {
        setData(res.data);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const toggle = (id: string) => setExpanded(p => (p === id ? null : id));

  const CATEGORY_COLORS: Record<string, string> = {
    "SAC": "#6366f1", "SARAL GST": "#8b5cf6", "SPP": "#0ea5e9",
    "STO": "#10b981", "OTHERS": "#f59e0b",
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[s.loadText, { color: theme.textMuted }]}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Summary bar */}
      <View style={[s.summaryBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <Text style={[s.summaryText, { color: theme.textMuted }]}>
          <Text style={[s.summaryCount, { color: theme.primary }]}>{data.length}</Text>
          {"  "}unmapped contact{data.length !== 1 ? "s" : ""} found
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIcon, { borderColor: theme.cardBorder }]}>
              <Text style={[s.emptyIconText, { color: theme.textMuted }]}>✓</Text>
            </View>
            <Text style={[s.emptyTitle, { color: theme.textSecondary }]}>All Clear</Text>
            <Text style={[s.emptySub, { color: theme.textMuted }]}>No unmapped contacts found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isOpen  = expanded === String(item.id);
          const catColor = CATEGORY_COLORS[item.category] || theme.primary;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => toggle(String(item.id))}
            >
              {/* Top row */}
              <View style={s.cardTop}>
                <View style={[s.catBadge, { backgroundColor: catColor + "18", borderColor: catColor + "35" }]}>
                  <Text style={[s.catText, { color: catColor }]}>{item.category || "UNKNOWN"}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.companyName, { color: theme.text }]} numberOfLines={1}>
                    {item.companyName || "No Company"}
                  </Text>
                  <Text style={[s.personName, { color: theme.textMuted }]} numberOfLines={1}>
                    {item.contactPerson || "—"}
                  </Text>
                </View>
                <Text style={[s.chevron, { color: theme.textMuted, transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }]}>›</Text>
              </View>

              {/* Region */}
              <View style={s.regionRow}>
                <Text style={[s.regionLabel, { color: theme.textMuted }]}>Region</Text>
                <Text style={[s.regionVal, { color: theme.textSecondary }]}>{item.region || "—"}</Text>
              </View>

              {/* Expanded details */}
              {isOpen && (
                <View style={[s.details, { borderTopColor: theme.cardBorder }]}>
                  {[
                    { label: "Address",  value: item.address },
                    { label: "Phone",    value: item.phone },
                    { label: "Cell",     value: item.cell },
                    { label: "Email",    value: item.email },
                    { label: "Category", value: item.category },
                  ].filter(r => r.value).map((row, i) => (
                    <View key={i} style={s.detailRow}>
                      <Text style={[s.detailLabel, { color: theme.textMuted }]}>{row.label}</Text>
                      <Text style={[s.detailVal, { color: theme.text }]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadText:    { fontSize: 12, letterSpacing: 1 },
  summaryBar:  { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  summaryText: { fontSize: 12, fontWeight: "600" },
  summaryCount:{ fontSize: 18, fontWeight: "800" },
  list:        { padding: 16, paddingBottom: 100 },

  card:        { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardTop:     { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  catBadge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText:     { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  companyName: { fontSize: 14, fontWeight: "700" },
  personName:  { fontSize: 11, marginTop: 2 },
  chevron:     { fontSize: 22, fontWeight: "300" },

  regionRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  regionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  regionVal:   { fontSize: 12, fontWeight: "500" },

  details:     { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  detailRow:   { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 11, fontWeight: "600" },
  detailVal:   { fontSize: 11, fontWeight: "500", maxWidth: "60%", textAlign: "right" },

  empty:       { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyIcon:   { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyIconText:{ fontSize: 22 },
  emptyTitle:  { fontSize: 16, fontWeight: "700" },
  emptySub:    { fontSize: 12 },
});
