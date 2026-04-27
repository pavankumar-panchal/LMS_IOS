import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const TYPE_COLORS: Record<string, string> = {
  "Sub Admin": "#3b82f6",
  "Reporting Authority": "#a855f7",
  "Dealer": "#f97316",
};

export default function MasterSearchScreen() {
  const { theme, isDark } = useTheme();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.post("/masters", {
        submittype: "master_search",
        query: query.trim()
      });
      if (res.success && Array.isArray(res.data)) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const typeColor = TYPE_COLORS[item.type] || theme.primary;
    return (
      <TouchableOpacity 
        style={[s.item, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        activeOpacity={0.85}
      >
        <View style={s.itemHead}>
          <View style={[s.avatar, { backgroundColor: typeColor + "20" }]}>
            <Text style={[s.avatarText, { color: typeColor }]}>{item.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={s.itemInfo}>
            <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[s.itemSub, { color: theme.textMuted }]}>{item.username} · {item.type}</Text>
          </View>
          <View style={[s.typeBadge, { backgroundColor: typeColor + "15", borderColor: typeColor + "30" }]}>
            <Text style={[s.typeText, { color: typeColor }]}>{item.type?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={s.itemBody}>
          <Text style={[s.detail, { color: theme.textSecondary }]}>📧 {item.email || "N/A"}</Text>
          <Text style={[s.detail, { color: theme.textSecondary }]}>📞 {item.cell || "N/A"}</Text>
          {item.location && <Text style={[s.detail, { color: theme.textSecondary }]}>📍 {item.location}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <View style={[s.header, { borderBottomColor: theme.cardBorder }]}>
        <TextInput
          style={[s.search, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", color: theme.text }]}
          placeholder="Search name, email, phone..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={[s.searchBtn, { backgroundColor: theme.primary }]} onPress={handleSearch} disabled={loading}>
          <Text style={s.searchBtnText}>SEARCH</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={s.empty}>
              <Text style={{ color: theme.textMuted }}>No records found matching "{query}"</Text>
            </View>
          ) : !searched ? (
            <View style={s.empty}>
              <Text style={{ color: theme.textMuted }}>Enter keywords to search the master database</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} /> : <View style={{height: 100}} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, flexDirection: "row", gap: 10 },
  search: { flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 16, fontSize: 14 },
  searchBtn: { paddingHorizontal: 16, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  
  list: { padding: 16 },
  item: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, elevation: 1 },
  itemHead: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: "700" },
  itemSub: { fontSize: 11, marginTop: 2 },
  
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  typeText: { fontSize: 9, fontWeight: "800" },
  
  itemBody: { gap: 6, paddingLeft: 52 },
  detail: { fontSize: 12, fontWeight: "500" },
  
  empty: { flex: 1, alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
});
