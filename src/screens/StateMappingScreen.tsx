import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const PAGE_SIZE = 25;

// ─── Generic select-sheet picker ─────────────────────────────────────────────
function SelectSheet({ visible, title, options, selected, onSelect, onClose, theme, isDark }: any) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const filtered: string[] = q.trim()
    ? options.filter((o: string) => o.toLowerCase().includes(q.toLowerCase()))
    : options;

  const close = () => { setQ(""); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={sh.overlay}>
        <TouchableOpacity style={sh.backdrop} activeOpacity={1} onPress={close} />
        <View style={[sh.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[sh.handle, { backgroundColor: theme.cardBorder }]} />
          <View style={[sh.header, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[sh.title, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={close} style={[sh.closeBtn, { backgroundColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 17 }}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={[sh.searchBox, { backgroundColor: isDark ? "#0d1626" : "#f1f5f9", borderColor: theme.cardBorder }]}>
            <Text style={{ color: theme.textMuted, fontSize: 15, marginRight: 6 }}>⌕</Text>
            <TextInput
              style={[sh.searchInput, { color: theme.text }]}
              placeholder="Search..."
              placeholderTextColor={theme.textMuted}
              value={q}
              onChangeText={setQ}
            />
            {q.length > 0 && (
              <TouchableOpacity onPress={() => setQ("")}>
                <Text style={{ color: theme.textMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item: string) => item}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            ListEmptyComponent={
              <Text style={[sh.empty, { color: theme.textMuted }]}>No results found</Text>
            }
            renderItem={({ item }: { item: string }) => {
              const isSel = item === selected;
              return (
                <TouchableOpacity
                  style={[sh.row, { borderBottomColor: theme.cardBorder }, isSel && { backgroundColor: theme.primary + "12" }]}
                  onPress={() => { onSelect(item); close(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[sh.rowTxt, { color: isSel ? theme.primary : theme.text, fontWeight: isSel ? "700" : "400" }]}>
                    {item}
                  </Text>
                  {isSel && <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function StateMappingScreen() {
  const { theme, isDark } = useTheme();

  // ── Dealers: load all, filter client-side ──────────────────────────────────
  const [allDealers,   setAllDealers]   = useState<any[]>([]);
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerPage,   setDealerPage]   = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

  // ── Mappings: load all, filter client-side ────────────────────────────────
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [allMappings,    setAllMappings]    = useState<any[]>([]);
  const [mapSearch,      setMapSearch]      = useState("");
  const [mapPage,        setMapPage]        = useState(1);
  const [mapLoading,     setMapLoading]     = useState(false);
  const [mapRefreshing,  setMapRefreshing]  = useState(false);

  const searchTimer = useRef<any>(null);

  // ── Client-side filtered + paginated slices ────────────────────────────────
  const filteredDealers = dealerSearch.trim()
    ? allDealers.filter(d =>
        (d.name          || "").toLowerCase().includes(dealerSearch.toLowerCase()) ||
        (d.contactPerson || "").toLowerCase().includes(dealerSearch.toLowerCase()) ||
        (d.state         || "").toLowerCase().includes(dealerSearch.toLowerCase()) ||
        (d.district      || "").toLowerCase().includes(dealerSearch.toLowerCase()) ||
        (d.cell          || "").toLowerCase().includes(dealerSearch.toLowerCase())
      )
    : allDealers;

  const visibleDealers  = filteredDealers.slice(0, dealerPage * PAGE_SIZE);
  const dealerHasMore   = visibleDealers.length < filteredDealers.length;

  const filteredMappings = mapSearch.trim()
    ? allMappings.filter(m =>
        (m.state      || m.statename  || "").toLowerCase().includes(mapSearch.toLowerCase()) ||
        (m.district   || m.distname   || "").toLowerCase().includes(mapSearch.toLowerCase()) ||
        (m.managedarea|| m.category   || "").toLowerCase().includes(mapSearch.toLowerCase())
      )
    : allMappings;

  const visibleMappings = filteredMappings.slice(0, mapPage * PAGE_SIZE);
  const mapHasMore      = visibleMappings.length < filteredMappings.length;

  // ── Fetch all dealers ──────────────────────────────────────────────────────
  const fetchDealers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.post("/mapping_api", {
        submittype: "get_dealers",
        search: "",
        page: 1,
        perpage: 9999,
      });
      if (res.success && res.data) setAllDealers(res.data as any[]);
      else setAllDealers([]);
    } catch { setAllDealers([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDealers(); }, []);

  // ── Fetch all mappings for a dealer ───────────────────────────────────────
  const fetchMappings = useCallback(async (dealerId: string, silent = false) => {
    if (!silent) setMapLoading(true);
    else setMapRefreshing(true);
    try {
      const res = await api.post("/mapping_api", {
        submittype: "get_dealer_mappings",
        dealerid: dealerId,
        search: "",
        page: 1,
        perpage: 9999,
      });
      if (res.success && res.data) setAllMappings(res.data as any[]);
      else setAllMappings([]);
    } catch { setAllMappings([]); }
    finally { setMapLoading(false); setMapRefreshing(false); }
  }, []);

  const handleSelectDealer = (dealer: any) => {
    setSelectedDealer(dealer);
    setMapSearch(""); setMapPage(1);
    fetchMappings(dealer.id);
  };

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleDealerSearch = (text: string) => {
    setDealerSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDealerPage(1), 100);
  };

  const handleMapSearch = (text: string) => {
    setMapSearch(text);
    setMapPage(1);
  };

  // ── Pagination (client-side chunks) ───────────────────────────────────────
  const loadMoreDealers  = () => { if (dealerHasMore) setDealerPage(p => p + 1); };
  const loadMoreMappings = () => { if (mapHasMore)    setMapPage(p => p + 1); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {!selectedDealer ? (
        // ── Dealer list ──
        <View style={{ flex: 1 }}>
          <View style={[s.searchWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[s.searchIcon, { color: theme.textMuted }]}>⌕</Text>
            <TextInput
              style={[s.searchInput, { color: theme.text }]}
              placeholder="Search by name, location, phone..."
              placeholderTextColor={theme.textMuted}
              value={dealerSearch}
              onChangeText={handleDealerSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {dealerSearch.length > 0 && (
              <TouchableOpacity onPress={() => handleDealerSearch("")}>
                <Text style={[s.clearBtn, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Count pill */}
          {!loading && (
            <View style={s.countRow}>
              <Text style={[s.countLabel, { color: theme.textMuted }]}>
                {dealerSearch ? `${filteredDealers.length} of ${allDealers.length}` : `${allDealers.length}`} dealers
              </Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
          ) : (
            <FlatList
              data={visibleDealers}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={s.list}
              keyboardShouldPersistTaps="handled"
              onRefresh={() => fetchDealers(true)}
              refreshing={refreshing}
              onEndReached={loadMoreDealers}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                    {dealerSearch ? `No dealers match "${dealerSearch}"` : "No dealers found."}
                  </Text>
                </View>
              }
              ListFooterComponent={
                dealerHasMore
                  ? <Text style={[s.moreHint, { color: theme.textMuted }]}>Scroll for more…</Text>
                  : visibleDealers.length > 0
                  ? <Text style={[s.endHint, { color: theme.textMuted }]}>— {filteredDealers.length} dealers —</Text>
                  : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.dealerItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => handleSelectDealer(item)}
                  activeOpacity={0.8}
                >
                  <View style={[s.dealerAvatar, { backgroundColor: theme.primary + "18" }]}>
                    <Text style={[s.dealerAvatarTxt, { color: theme.primary }]}>
                      {(item.name || item.contactPerson || "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dealerName, { color: theme.text }]}>
                      {item.name || item.contactPerson || `Dealer #${item.id}`}
                    </Text>
                    {!!item.contactPerson && item.contactPerson !== item.name && (
                      <Text style={[s.dealerSub, { color: theme.textSecondary }]}>{item.contactPerson}</Text>
                    )}
                    {!!(item.state || item.district) && (
                      <Text style={[s.dealerSub, { color: theme.textMuted }]}>
                        {[item.state, item.district].filter(Boolean).join(", ")}
                      </Text>
                    )}
                  </View>
                  <Text style={[s.arrow, { color: theme.primary }]}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        // ── Mappings for selected dealer ──
        <View style={{ flex: 1 }}>
          <View style={[s.topBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={() => { setSelectedDealer(null); setAllMappings([]); setMapSearch(""); }} style={s.backBtn}>
              <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 13 }}>‹ DEALERS</Text>
            </TouchableOpacity>
            <View style={s.topBarInfo}>
              <Text style={[s.dealerName, { color: theme.text }]} numberOfLines={1}>
                {selectedDealer.name || selectedDealer.contactPerson || `Dealer #${selectedDealer.id}`}
              </Text>
              <Text style={[s.dealerSub, { color: theme.textMuted }]}>
                {mapSearch ? `${filteredMappings.length} of ${allMappings.length}` : allMappings.length} mappings
              </Text>
            </View>
          </View>

          <View style={[s.searchWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginHorizontal: 16, marginTop: 12 }]}>
            <Text style={[s.searchIcon, { color: theme.textMuted }]}>⌕</Text>
            <TextInput
              style={[s.searchInput, { color: theme.text }]}
              placeholder="Search by state, district, area..."
              placeholderTextColor={theme.textMuted}
              value={mapSearch}
              onChangeText={handleMapSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {mapSearch.length > 0 && (
              <TouchableOpacity onPress={() => handleMapSearch("")}>
                <Text style={[s.clearBtn, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {mapLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
          ) : (
            <FlatList
              data={visibleMappings}
              keyExtractor={(item, i) => String(item.id ?? i)}
              contentContainerStyle={s.list}
              keyboardShouldPersistTaps="handled"
              onRefresh={() => fetchMappings(selectedDealer.id, true)}
              refreshing={mapRefreshing}
              onEndReached={loadMoreMappings}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                    {mapSearch ? `No mappings match "${mapSearch}"` : "No mappings found."}
                  </Text>
                </View>
              }
              ListFooterComponent={
                mapHasMore
                  ? <Text style={[s.moreHint, { color: theme.textMuted }]}>Scroll for more…</Text>
                  : visibleMappings.length > 0
                  ? <Text style={[s.endHint, { color: theme.textMuted }]}>— {filteredMappings.length} mappings —</Text>
                  : null
              }
              renderItem={({ item }) => (
                <View style={[s.mapItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[s.mapStrip, { backgroundColor: theme.primary }]} />
                  <View style={{ flex: 1, padding: 14 }}>
                    <View style={s.mapRow}>
                      <Text style={[s.mapLabel, { color: theme.textMuted }]}>STATE</Text>
                      <Text style={[s.mapVal, { color: theme.text }]}>{item.state || item.statename || "—"}</Text>
                    </View>
                    <View style={s.mapRow}>
                      <Text style={[s.mapLabel, { color: theme.textMuted }]}>DISTRICT</Text>
                      <Text style={[s.mapVal, { color: theme.text }]}>{item.district || item.distname || "—"}</Text>
                    </View>
                    <View style={[s.mapRow, { borderBottomWidth: 0 }]}>
                      <Text style={[s.mapLabel, { color: theme.textMuted }]}>MANAGED AREA</Text>
                      <View style={[s.mapBadge, { backgroundColor: theme.primary + "18", borderColor: theme.primary + "30" }]}>
                        <Text style={[s.mapBadgeTxt, { color: theme.primary }]}>
                          {item.managedarea || item.category || "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  list:      { padding: 16 },

  searchWrap:  { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 4, height: 46 },
  searchIcon:  { fontSize: 18, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearBtn:    { fontSize: 14, paddingLeft: 8 },

  countRow:  { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2 },
  countLabel:{ fontSize: 11, fontWeight: "600" },

  dealerItem:      { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  dealerAvatar:    { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dealerAvatarTxt: { fontSize: 14, fontWeight: "800" },
  dealerName:      { fontSize: 14, fontWeight: "700" },
  dealerSub:       { fontSize: 11, marginTop: 2 },
  arrow:           { fontSize: 24, fontWeight: "300" },

  topBar:     { padding: 16, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:    { paddingRight: 8 },
  topBarInfo: { flex: 1 },

  mapItem:     { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  mapStrip:    { width: 3 },
  mapRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#8881" },
  mapLabel:    { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  mapVal:      { fontSize: 13, fontWeight: "600" },
  mapBadge:    { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  mapBadgeTxt: { fontSize: 10, fontWeight: "800" },

  moreHint: { textAlign: "center", fontSize: 12, paddingVertical: 14 },
  endHint:  { textAlign: "center", fontSize: 11, paddingVertical: 18, letterSpacing: 0.5 },
  empty:    { alignItems: "center", marginTop: 60, gap: 14 },
});

// ─── SelectSheet styles ───────────────────────────────────────────────────────
const sh = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: "flex-end" },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", overflow: "hidden" },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title:      { fontSize: 16, fontWeight: "800" },
  closeBtn:   { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  searchBox:  { flexDirection: "row", alignItems: "center", height: 44, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  searchInput:{ flex: 1, fontSize: 14 },
  row:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1 },
  rowTxt:     { fontSize: 14, flex: 1 },
  empty:      { textAlign: "center", paddingVertical: 24, fontSize: 13 },
});
