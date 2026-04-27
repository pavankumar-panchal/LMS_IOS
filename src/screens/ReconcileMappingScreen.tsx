import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

interface ReconcileResult {
  type: "unmapped" | "disabled";
  count: number;
  message: string;
  timestamp: string;
}

export default function ReconcileMappingScreen() {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [loadingUnmapped, setLoadingUnmapped] = useState(false);
  const [loadingDisabled, setLoadingDisabled] = useState(false);
  const [results, setResults] = useState<ReconcileResult[]>([]);

  const reconcile = async (type: "unmapped" | "disabled") => {
    const submittype = type === "unmapped" ? "reconcile_unmapped" : "reconcile_disabled";
    type === "unmapped" ? setLoadingUnmapped(true) : setLoadingDisabled(true);
    try {
      const res = await api.post("/mapping_api", { submittype });
      const count = res.count ?? 0;
      const message = res.message || (res.success ? "Done." : "Failed.");
      setResults(prev => [
        { type, count, message, timestamp: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (e: any) {
      setResults(prev => [
        { type, count: 0, message: e.message || "Network error. Could not connect.", timestamp: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } finally {
      type === "unmapped" ? setLoadingUnmapped(false) : setLoadingDisabled(false);
    }
  };

  const ACTION_CARDS = [
    {
      type: "unmapped" as const,
      title: "Reconcile Unmapped Leads",
      description: "Find leads assigned to the placeholder dealer (ID 999999) and map them to the correct active dealer based on their region and product category.",
      icon: "⟳",
      color: "#6366f1",
      loading: loadingUnmapped,
    },
    {
      type: "disabled" as const,
      title: "Reconcile Disabled Dealer Leads",
      description: "Find leads belonging to disabled dealers and reassign them to active dealers who cover the same region and product category.",
      icon: "⟳",
      color: "#f59e0b",
      loading: loadingDisabled,
    },
  ];

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.bg }]} contentContainerStyle={s.scroll}>
      {/* Info Banner */}
      <View style={[s.banner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[s.bannerTitle, { color: theme.text }]}>Reconcile Mapping</Text>
        <Text style={[s.bannerDesc, { color: theme.textMuted }]}>
          Reconciliation assigns leads to the correct dealer based on region and product category mapping. Run these operations when leads are missing dealer assignments.
        </Text>
        {!isAdmin && (
          <View style={[s.accessBanner, { backgroundColor: "#ef444415", borderColor: "#ef444430" }]}>
            <Text style={[s.accessText, { color: "#ef4444" }]}>Admin privileges required to run reconciliation.</Text>
          </View>
        )}
      </View>

      {/* Action Cards */}
      {ACTION_CARDS.map(card => (
        <View key={card.type} style={[s.actionCard, { backgroundColor: theme.card, borderColor: card.color + "30" }]}>
          <View style={[s.actionBar, { backgroundColor: card.color }]} />
          <View style={s.actionBody}>
            <View style={[s.iconCircle, { backgroundColor: card.color + "18" }]}>
              <Text style={[s.iconText, { color: card.color }]}>{card.icon}</Text>
            </View>
            <Text style={[s.actionTitle, { color: theme.text }]}>{card.title}</Text>
            <Text style={[s.actionDesc, { color: theme.textMuted }]}>{card.description}</Text>

            <TouchableOpacity
              style={[
                s.runBtn,
                { backgroundColor: isAdmin ? card.color : theme.cardBorder },
                (!isAdmin || card.loading) && { opacity: 0.6 },
              ]}
              onPress={() => reconcile(card.type)}
              disabled={!isAdmin || card.loading}
              activeOpacity={0.8}
            >
              {card.loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.runBtnText}>{isAdmin ? "RUN NOW" : "ADMIN ONLY"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Results History */}
      {results.length > 0 && (
        <View style={[s.resultsSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.resultsTitle, { color: theme.textMuted }]}>RECENT RUNS</Text>
          {results.map((r, i) => (
            <View key={i} style={[s.resultRow, i < results.length - 1 && { borderBottomColor: theme.cardBorder, borderBottomWidth: 1 }]}>
              <View style={[s.resultDot, { backgroundColor: r.type === "unmapped" ? "#6366f1" : "#f59e0b" }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.resultMsg, { color: theme.text }]}>{r.message}</Text>
                <Text style={[s.resultMeta, { color: theme.textMuted }]}>
                  {r.type === "unmapped" ? "Unmapped" : "Disabled"} · {r.timestamp}
                </Text>
              </View>
              <View style={[s.countBadge, { backgroundColor: r.count > 0 ? "#10b98120" : "#64748b20" }]}>
                <Text style={[s.countText, { color: r.count > 0 ? "#10b981" : "#64748b" }]}>
                  {r.count} fixed
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 100, gap: 14 },

  banner:       { borderRadius: 16, borderWidth: 1, padding: 18 },
  bannerTitle:  { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  bannerDesc:   { fontSize: 13, lineHeight: 20 },
  accessBanner: { marginTop: 12, borderRadius: 10, borderWidth: 1, padding: 10 },
  accessText:   { fontSize: 12, fontWeight: "700" },

  actionCard:   { borderRadius: 16, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  actionBar:    { width: 4 },
  actionBody:   { flex: 1, padding: 16, gap: 8 },
  iconCircle:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  iconText:     { fontSize: 20 },
  actionTitle:  { fontSize: 15, fontWeight: "800" },
  actionDesc:   { fontSize: 13, lineHeight: 20 },
  runBtn:       { marginTop: 8, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  runBtnText:   { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  resultsSection: { borderRadius: 16, borderWidth: 1, padding: 16 },
  resultsTitle:   { fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 12 },
  resultRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  resultDot:      { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  resultMsg:      { fontSize: 13, fontWeight: "600" },
  resultMeta:     { fontSize: 10, marginTop: 2 },
  countBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countText:      { fontSize: 11, fontWeight: "700" },
});
