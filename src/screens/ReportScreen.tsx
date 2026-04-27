import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView, TextInput,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

// Generic report list screen for all report pages
// Pass `title`, `endpoint`, `submittype`, `columns` as route params

export default function ReportScreen({ route }: any) {
  const { theme } = useTheme();
  const { title = "Report", endpoint = "/reports", submittype = "list", columns = ["Name", "Value"] } = route?.params || {};

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetch = async (pg = 1, append = false) => {
    pg === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api.post(endpoint, { submittype, page: pg, perPage: 20, search });
      if (res?.success) {
        const rows = res.data || [];
        setData(append ? p => [...p, ...rows] : rows);
        setTotal(res.total || rows.length);
        setPage(pg);
      }
    } catch {}
    setLoading(false); setLoadingMore(false); setRefreshing(false);
  };

  useEffect(() => { fetch(1); }, [search]);

  // Extract columns from first row
  const keys = data.length > 0 ? Object.keys(data[0]).slice(0, 5) : columns;

  const renderRow = ({ item, index }: any) => (
    <View style={[rS.row, index % 2 === 0 && { backgroundColor: theme.primary + "05" }, { borderBottomColor: theme.cardBorder }]}>
      {keys.map((k: string) => (
        <Text key={k} style={[rS.cell, { color: theme.textSecondary }]} numberOfLines={1}>
          {String(item[k] ?? "—")}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Search */}
      <View style={[s.searchRow, { borderBottomColor: theme.cardBorder }]}>
        <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.searchIcon, { color: theme.textMuted }]}>⚲</Text>
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder={`Search ${title}...`}
            placeholderTextColor={theme.textMuted}
            value={search} onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: theme.textMuted, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count */}
      <Text style={[s.count, { color: theme.textMuted }]}>{total} records found</Text>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            {data.length > 0 && (
              <View style={[rS.header, { backgroundColor: theme.primary + "12", borderBottomColor: theme.primary + "30" }]}>
                {keys.map((k: string) => (
                  <Text key={k} style={[rS.headerCell, { color: theme.primary }]} numberOfLines={1}>
                    {String(k).replace(/_/g, " ").toUpperCase()}
                  </Text>
                ))}
              </View>
            )}

            <FlatList
              data={data}
              keyExtractor={(_, i) => String(i)}
              renderItem={renderRow}
              onEndReached={() => { if (!loadingMore && data.length < total) fetch(page + 1, true); }}
              onEndReachedThreshold={0.4}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(1); }} tintColor={theme.primary} />}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ margin: 16 }} /> : null}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "700", marginBottom: 6 }}>No Data Found</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center" }}>Pull down to refresh or check your filters</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  searchRow:  { padding: 16, borderBottomWidth: 1 },
  searchBox:  { flexDirection: "row", alignItems: "center", height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 10 },
  searchIcon: { fontSize: 20, fontWeight: "300" },
  searchInput:{ flex: 1, fontSize: 14, fontWeight: "500" },
  count:      { fontSize: 10, fontWeight: "700", letterSpacing: 1, padding: 16, paddingBottom: 8 },
});

const rS = StyleSheet.create({
  header:     { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 12 },
  headerCell: { width: 140, paddingHorizontal: 14, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  row:        { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 13 },
  cell:       { width: 140, paddingHorizontal: 14, fontSize: 12, fontWeight: "500" },
});
