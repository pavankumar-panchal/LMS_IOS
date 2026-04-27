import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TextInput, TouchableOpacity, RefreshControl, Modal, Pressable,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const CATEGORIES = ["All", "SAC", "SARAL GST", "SPP", "STO", "OTHERS"];

const GENERATE_FILTERS = [
  { value: "all",     label: "All"      },
  { value: "having",  label: "Mapped"   },
  { value: "missing", label: "Unmapped" },
];

const CAT_COLOR: Record<string, string> = {
  "SAC":       "#6366f1",
  "SARAL GST": "#f59e0b",
  "SPP":       "#0ea5e9",
  "STO":       "#10b981",
  "OTHERS":    "#64748b",
};

export default function WebLeadsMappingScreen() {
  const { theme } = useTheme();

  const [rows, setRows]               = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("All");
  const [generate, setGenerate]       = useState("all");
  const [offset, setOffset]           = useState(0);
  const [catDropdown, setCatDropdown] = useState(false);
  const LIMIT = 50;

  const fetchData = useCallback(async (reset = true) => {
    const newOffset = reset ? 0 : offset + LIMIT;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api.post("/mapping_api", {
        submittype: "griddata",
        searchtext: search.trim(),
        category:   category === "All" ? "" : category,
        generate,
        startlimit: newOffset,
        limit:      LIMIT,
        orderby:    "region",
      });
      if (res.success) {
        const newRows = res.data || [];
        setRows(reset ? newRows : prev => [...prev, ...newRows]);
        setTotal(res.total || newRows.length);
        setOffset(newOffset);
      }
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, category, generate, offset]);

  useEffect(() => { fetchData(true); }, [search, category, generate]);

  const catColor = category !== "All" ? (CAT_COLOR[category] || theme.primary) : theme.primary;

  return (
    <View style={[s.wrap, { backgroundColor: theme.bg }]}>

      {/* ── Search ── */}
      <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[s.searchIco, { color: theme.textMuted }]}>⌕</Text>
        <TextInput
          style={[s.searchInput, { color: theme.text }]}
          placeholder="Search dealer name..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={[s.clearBtn, { color: theme.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter bar ── */}
      <View style={[s.filterBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Map/Unmapped tabs */}
        <View style={s.tabs}>
          {GENERATE_FILTERS.map(f => {
            const active = generate === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[s.tab, active && { borderBottomColor: theme.primary }]}
                onPress={() => setGenerate(f.value)}
              >
                <Text style={[s.tabTxt, { color: active ? theme.primary : theme.textMuted }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[s.filterDivider, { backgroundColor: theme.cardBorder }]} />

        {/* Category dropdown trigger */}
        <TouchableOpacity
          style={[s.catBtn, { borderColor: catColor + "50", backgroundColor: catColor + "12" }]}
          onPress={() => setCatDropdown(true)}
        >
          {category !== "All" && <View style={[s.catDot, { backgroundColor: catColor }]} />}
          <Text style={[s.catBtnTxt, { color: catColor }]}>{category}</Text>
          <Text style={[s.catArrow, { color: catColor }]}>▾</Text>
        </TouchableOpacity>

        {/* Record count */}
        <View style={[s.countBadge, { backgroundColor: theme.primary + "15" }]}>
          <Text style={[s.countTxt, { color: theme.primary }]}>{total.toLocaleString()}</Text>
        </View>
      </View>

      {/* ── Category dropdown modal ── */}
      <Modal visible={catDropdown} transparent animationType="fade" onRequestClose={() => setCatDropdown(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setCatDropdown(false)}>
          <View style={[s.dropdown, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[s.dropTitle, { color: theme.textMuted }]}>SELECT CATEGORY</Text>
            {CATEGORIES.map(cat => {
              const active = category === cat;
              const color  = cat === "All" ? theme.primary : (CAT_COLOR[cat] || theme.primary);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.dropItem, active && { backgroundColor: color + "12" }, { borderColor: theme.cardBorder }]}
                  onPress={() => { setCategory(cat); setCatDropdown(false); }}
                >
                  <View style={[s.dropDot, { backgroundColor: active ? color : "transparent", borderColor: color }]} />
                  <Text style={[s.dropItemTxt, { color: active ? color : theme.text, fontWeight: active ? "700" : "500" }]}>
                    {cat}
                  </Text>
                  {active && <Text style={[s.checkMark, { color }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* ── List ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[s.loadTxt, { color: theme.textMuted }]}>Loading mappings...</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => `${item.state}-${item.district}-${item.region}-${item.category}-${i}`}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(true); }} tintColor={theme.primary} />}
          onEndReached={() => { if (!loadingMore && rows.length < total) fetchData(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyIco, { color: theme.cardBorder }]}>◎</Text>
              <Text style={[s.emptyTitle, { color: theme.text }]}>No mappings found</Text>
              <Text style={[s.emptySub, { color: theme.textMuted }]}>Try adjusting your filters</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMapped = !!item.company && item.company !== "---";
            const isActive = item.disabled !== "yes";
            const cc       = CAT_COLOR[item.category] || theme.primary;

            return (
              <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

                {/* Breadcrumb row */}
                <View style={s.breadRow}>
                  <Text style={[s.breadTxt, { color: theme.textMuted }]} numberOfLines={1}>
                    {[item.state, item.district, item.region].filter(Boolean).join("  ›  ")}
                  </Text>
                  <View style={[s.statusDot, { backgroundColor: isActive ? "#10b981" : "#ef4444" }]} />
                </View>

                {/* Separator */}
                <View style={[s.sep, { backgroundColor: theme.cardBorder }]} />

                {/* Info row */}
                <View style={s.infoRow}>
                  <View style={[s.catPill, { backgroundColor: cc + "18", borderColor: cc + "40" }]}>
                    <Text style={[s.catPillTxt, { color: cc }]}>{item.category || "—"}</Text>
                  </View>

                  <View style={s.dealerInfo}>
                    {isMapped ? (
                      <>
                        <Text style={[s.dealerName, { color: theme.text }]} numberOfLines={1}>{item.company}</Text>
                        {!!item.person && item.person !== "---" && (
                          <Text style={[s.dealerSub, { color: theme.textMuted }]} numberOfLines={1}>{item.person}</Text>
                        )}
                      </>
                    ) : (
                      <View style={s.notMappedRow}>
                        <View style={s.notMappedDot} />
                        <Text style={s.notMappedTxt}>Not mapped</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:        { flex: 1 },

  searchBox:   { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  searchIco:   { fontSize: 18, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14 },
  clearBtn:    { fontSize: 13, paddingLeft: 8 },

  filterBar:    { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4, gap: 4 },
  tabs:         { flexDirection: "row", flex: 1 },
  tab:          { paddingHorizontal: 10, paddingVertical: 7, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabTxt:       { fontSize: 12, fontWeight: "700" },
  filterDivider:{ width: 1, height: 20, marginHorizontal: 4 },
  catBtn:       { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  catDot:       { width: 6, height: 6, borderRadius: 3 },
  catBtnTxt:    { fontSize: 12, fontWeight: "700" },
  catArrow:     { fontSize: 10 },
  countBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  countTxt:     { fontSize: 11, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "#00000060", justifyContent: "center", alignItems: "center" },
  dropdown:     { width: 260, borderRadius: 16, borderWidth: 1, padding: 8, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10 },
  dropTitle:    { fontSize: 10, fontWeight: "800", letterSpacing: 1, paddingHorizontal: 12, paddingVertical: 8 },
  dropItem:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10, marginBottom: 2, gap: 10 },
  dropDot:      { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  dropItemTxt:  { flex: 1, fontSize: 14 },
  checkMark:    { fontSize: 14, fontWeight: "800" },

  center:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadTxt:      { fontSize: 12 },
  list:         { paddingHorizontal: 16, paddingBottom: 100 },

  card:         { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  breadRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  breadTxt:     { flex: 1, fontSize: 11, fontWeight: "600" },
  statusDot:    { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  sep:          { height: 1, marginHorizontal: 14 },
  infoRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  catPill:      { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  catPillTxt:   { fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  dealerInfo:   { flex: 1 },
  dealerName:   { fontSize: 13, fontWeight: "700" },
  dealerSub:    { fontSize: 11, marginTop: 1 },

  notMappedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notMappedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  notMappedTxt: { fontSize: 12, fontWeight: "700", color: "#ef4444" },

  empty:        { alignItems: "center", paddingVertical: 80, gap: 8 },
  emptyIco:     { fontSize: 40 },
  emptyTitle:   { fontSize: 15, fontWeight: "700" },
  emptySub:     { fontSize: 12 },
});
