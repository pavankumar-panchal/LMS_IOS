import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  "attended":      "#10b981", "order closed":  "#8b5cf6",
  "not viewed":    "#f59e0b", "unattended":    "#ef4444",
  "demo given":    "#3b82f6", "quote sent":    "#06b6d4",
  "not interested":"#f43f5e", "persuing":      "#6366f1",
  "fake":          "#64748b", "registered":    "#14b8a6",
};

// ─── Dealer picker modal ──────────────────────────────────────────────────────
function DealerPicker({ visible, dealers, selected, onSelect, onClose, theme, isDark }: any) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? dealers.filter((d: any) => (d.name || "").toLowerCase().includes(q.toLowerCase()))
    : dealers;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={dp.overlay}>
        <TouchableOpacity style={dp.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[dp.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Handle */}
          <View style={[dp.handle, { backgroundColor: theme.cardBorder }]} />

          {/* Header */}
          <View style={[dp.header, { borderBottomColor: theme.cardBorder }]}>
            <View>
              <Text style={[dp.title, { color: theme.text }]}>Select Dealer</Text>
              <Text style={[dp.sub, { color: theme.textMuted }]}>{dealers.length} dealers available</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[dp.closeBtn, { backgroundColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[dp.searchBox, { backgroundColor: isDark ? "#0d1626" : "#f1f5f9", borderColor: theme.cardBorder }]}>
            <Text style={{ color: theme.textMuted, fontSize: 16, marginRight: 6 }}>⌕</Text>
            <TextInput
              style={[dp.searchInput, { color: theme.text }]}
              placeholder="Search dealers…"
              placeholderTextColor={theme.textMuted}
              value={q}
              onChangeText={setQ}
              autoFocus={visible}
            />
            {q.length > 0 && (
              <TouchableOpacity onPress={() => setQ("")}>
                <Text style={{ color: theme.textMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            ListEmptyComponent={
              <Text style={[dp.empty, { color: theme.textMuted }]}>No dealers found</Text>
            }
            renderItem={({ item }: any) => {
              const isSel = String(item.id) === String(selected);
              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[dp.row, { borderBottomColor: theme.cardBorder }, isSel && { backgroundColor: theme.primary + "10" }]}
                  onPress={() => { onSelect(String(item.id), item.name); onClose(); setQ(""); }}
                >
                  <View style={[dp.avatar, { backgroundColor: isSel ? theme.primary + "25" : theme.cardBorder }]}>
                    <Text style={[dp.avatarTxt, { color: isSel ? theme.primary : theme.textMuted }]}>
                      {(item.name || "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[dp.dealerName, { color: isSel ? theme.primary : theme.text, fontWeight: isSel ? "700" : "500" }]} numberOfLines={1}>
                    {item.name}
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

// ─── Lead card ────────────────────────────────────────────────────────────────
function LeadCard({ item, selected, onToggle, theme }: any) {
  const isSel = selected;
  const statusColor = STATUS_COLORS[item.status?.toLowerCase()] || "#64748b";
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onToggle(item.id)}
      style={[lc.card, { backgroundColor: theme.card, borderColor: isSel ? theme.primary : theme.cardBorder },
        isSel && { backgroundColor: theme.primary + "08" }]}
    >
      {/* left accent */}
      <View style={[lc.strip, { backgroundColor: isSel ? theme.primary : statusColor }]} />

      <View style={lc.body}>
        {/* top row */}
        <View style={lc.topRow}>
          {/* checkbox */}
          <View style={[lc.check, { borderColor: isSel ? theme.primary : theme.textMuted },
            isSel && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
            {isSel && <Text style={lc.tick}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[lc.company, { color: theme.text }]} numberOfLines={1}>{item.company}</Text>
            <Text style={[lc.id, { color: theme.textMuted }]}>ID: {item.id}</Text>
          </View>
          <View style={[lc.badge, { backgroundColor: statusColor + "15", borderColor: statusColor + "35" }]}>
            <Text style={[lc.badgeTxt, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* divider */}
        <View style={[lc.div, { backgroundColor: theme.cardBorder }]} />

        {/* meta grid */}
        <View style={lc.meta}>
          <MetaCol label="CONTACT"  value={`${item.person} · ${item.cell}`} theme={theme} />
          <MetaCol label="PRODUCT"  value={item.product}                     theme={theme} />
        </View>
        <View style={[lc.meta, { marginTop: 6 }]}>
          <MetaCol label="LOCATION" value={item.location} theme={theme} />
          <MetaCol label="DEALER"   value={item.dealer}   theme={theme} highlight />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetaCol({ label, value, theme, highlight = false }: any) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[mc.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[mc.value, { color: highlight ? theme.primary : theme.textSecondary }]} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BulkTransferScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [leads, setLeads]           = useState<any[]>([]);
  const [dealers, setDealers]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);
  const [targetId, setTargetId]     = useState("");
  const [targetName, setTargetName] = useState("");
  const [transferBanner, setTransferBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [dealerPickerOpen, setDealerPickerOpen] = useState(false);
  const searchTimer = useRef<any>(null);

  useEffect(() => { fetchDealers(); fetchLeads(1, true); }, []);

  const fetchDealers = async () => {
    try {
      const res = await api.post("/mapping_api", {
        submittype: "get_dealers",
        search: "",
        page: 1,
        perpage: 9999,
      });
      if (res?.success) setDealers(res.data || []);
    } catch {}
  };

  const fetchLeads = useCallback(async (p: number, clear = false, q?: string) => {
    // q is passed explicitly to avoid stale closure when called from debounced handler
    const query = q !== undefined ? q : search;
    setLoading(true);
    try {
      const res = await api.post("/leads", {
        submittype: "griddata",
        searchQuery: query,
        limit: PAGE_SIZE,
        start: (p - 1) * PAGE_SIZE,
      });
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((l: any) => ({
          id: String(l.id),
          company: l.company || "—",
          person: l.name || "—",
          cell: l.cell || l.phone || "—",
          product: l.productname || "—",
          location: [l.distname, l.statename].filter(Boolean).join(", ") || "—",
          dealer: l.dealername || "Unassigned",
          status: l.leadstatus || "Not Viewed",
        }));
        setLeads(prev => clear ? mapped : [...prev, ...mapped]);
        setHasMore(mapped.length === PAGE_SIZE);
      } else {
        setHasMore(false);
        if (clear) setLeads([]);
      }
    } catch {}
    setLoading(false);
  }, []); // no deps — search is passed explicitly

  const handleSearch = () => { setPage(1); fetchLeads(1, true, search); };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    clearTimeout(searchTimer.current);
    // pass q directly so the debounced call always uses the latest value
    searchTimer.current = setTimeout(() => { setPage(1); fetchLeads(1, true, q); }, 500);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchLeads(next, false, search);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedIds(prev => prev.length === leads.length ? [] : leads.map(l => l.id));

  const handleTransfer = async () => {
    setTransferBanner(null);
    if (!selectedIds.length) { setTransferBanner({ type: "error", msg: "Select at least one lead to transfer." }); return; }
    if (!targetId)           { setTransferBanner({ type: "error", msg: "Please select a destination dealer." }); return; }

    setTransferring(true);
    try {
      const res = await api.post("/leads", {
        submittype:       "bulk_transfer",
        leadids:          selectedIds.map(Number),
        target_dealer_id: Number(targetId),
      });
      if (res?.success) {
        setTransferBanner({ type: "success", msg: res.message || `${selectedIds.length} lead(s) transferred successfully.` });
        setSelectedIds([]);
        setTargetId("");
        setTargetName("");
        setPage(1);
        fetchLeads(1, true, search);
      } else {
        setTransferBanner({ type: "error", msg: res?.message || "Transfer failed. You may not have permission." });
      }
    } catch {
      setTransferBanner({ type: "error", msg: "Network error. Please check your connection and try again." });
    }
    setTransferring(false);
  };

  const bottomH = 88 + Math.max(insets.bottom, 8);

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {/* Search */}
      <View style={[s.searchWrap, { borderBottomColor: theme.cardBorder }]}>
        <View style={[s.searchBox, { backgroundColor: isDark ? "#0d1626" : "#f1f5f9", borderColor: theme.cardBorder }]}>
          <Text style={{ color: theme.textMuted, fontSize: 16, marginRight: 6 }}>⌕</Text>
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search leads…"
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")}>
              <Text style={{ color: theme.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {leads.length > 0 && (
          <TouchableOpacity
            style={[s.selAllBtn, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "40" }]}
            onPress={toggleAll}
          >
            <Text style={[s.selAllTxt, { color: theme.primary }]}>
              {selectedIds.length === leads.length ? "None" : "All"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={leads}
        keyExtractor={item => item.id}
        contentContainerStyle={[s.list, { paddingBottom: bottomH + 8 }]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={loading && page === 1} onRefresh={() => { setPage(1); fetchLeads(1, true, search); }} tintColor={theme.primary} />}
        renderItem={({ item }) => (
          <LeadCard
            item={item}
            selected={selectedIds.includes(item.id)}
            onToggle={toggleSelect}
            theme={theme}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={[s.emptyTxt, { color: theme.textMuted }]}>No leads found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading
            ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} />
            : !hasMore && leads.length > 0
            ? <Text style={[s.endTxt, { color: theme.textMuted }]}>— {leads.length} leads loaded —</Text>
            : null
        }
      />

      {/* Transfer banner */}
      {!!transferBanner && (
        <View style={[s.transferBanner, transferBanner.type === "success"
          ? { backgroundColor: "#10b98115", borderColor: "#10b98140" }
          : { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: transferBanner.type === "success" ? "#10b981" : "#ef4444" }}>
            {transferBanner.type === "success" ? "✓" : "✕"}
          </Text>
          <Text style={[s.transferBannerMsg, { color: transferBanner.type === "success" ? "#10b981" : "#ef4444" }]}>{transferBanner.msg}</Text>
          <TouchableOpacity onPress={() => setTransferBanner(null)}>
            <Text style={{ color: transferBanner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transfer bar */}
      <View style={[s.bar, {
        backgroundColor: theme.card,
        borderTopColor: theme.cardBorder,
        paddingBottom: Math.max(insets.bottom, 8),
        shadowColor: "#000",
      }]}>
        {/* row 1 — selection info + clear */}
        <View style={s.barTop}>
          <Text style={[s.barTitle, { color: theme.text }]}>
            {selectedIds.length > 0
              ? `${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""} selected`
              : "BATCH TRANSFER"}
          </Text>
          {selectedIds.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedIds([])}>
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "800" }}>CLEAR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* row 2 — dealer pick + transfer */}
        <View style={s.barRow}>
          {/* Dealer selector */}
          <TouchableOpacity
            style={[s.dealerPick, {
              backgroundColor: targetId ? theme.primary + "15" : (isDark ? "#0d1626" : "#f1f5f9"),
              borderColor: targetId ? theme.primary + "50" : theme.cardBorder,
              flex: 1,
            }]}
            onPress={() => setDealerPickerOpen(true)}
          >
            <Text style={[s.dealerPickTxt, { color: targetId ? theme.primary : theme.textMuted }]} numberOfLines={1}>
              {targetName || "Select dealer…"}
            </Text>
            <Text style={{ color: targetId ? theme.primary : theme.textMuted, fontSize: 12 }}>▾</Text>
          </TouchableOpacity>

          {/* Transfer button */}
          <TouchableOpacity
            style={[s.transferBtn, { backgroundColor: theme.primary },
              (!selectedIds.length || !targetId) && { opacity: 0.45 }]}
            onPress={handleTransfer}
            disabled={transferring || !selectedIds.length || !targetId}
          >
            {transferring
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.transferTxt}>TRANSFER</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dealer picker */}
      <DealerPicker
        visible={dealerPickerOpen}
        dealers={dealers}
        selected={targetId}
        onSelect={(id: string, name: string) => { setTargetId(id); setTargetName(name); }}
        onClose={() => setDealerPickerOpen(false)}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1 },
  searchBox:  { flex: 1, flexDirection: "row", alignItems: "center", height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 6 },
  searchInput:{ flex: 1, fontSize: 14 },
  selAllBtn:  { paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  selAllTxt:  { fontSize: 12, fontWeight: "800" },

  list:    { padding: 12 },
  empty:   { alignItems: "center", marginTop: 80 },
  emptyTxt:{ fontSize: 14 },
  endTxt:  { textAlign: "center", fontSize: 11, paddingVertical: 16 },

  bar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, elevation: 12,
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  barTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  barTitle:{ fontSize: 11, fontWeight: "900", letterSpacing: 1 },

  barRow:     { flexDirection: "row", gap: 10, alignItems: "center" },
  dealerPick: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  dealerPickTxt:{ flex: 1, fontSize: 13, fontWeight: "600", marginRight: 6 },
  transferBtn:{ height: 46, paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  transferTxt:{ color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  transferBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  transferBannerMsg: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 16 },
});

const dp = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", minHeight: "50%" },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title:    { fontSize: 16, fontWeight: "800" },
  sub:      { fontSize: 11, marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  searchBox:{ flexDirection: "row", alignItems: "center", height: 44, borderRadius: 12, borderWidth: 1, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, gap: 6 },
  searchInput:{ flex: 1, fontSize: 14 },
  row:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1 },
  avatar:   { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  avatarTxt:{ fontSize: 12, fontWeight: "800" },
  dealerName:{ flex: 1, fontSize: 14 },
  empty:    { textAlign: "center", paddingVertical: 30, fontSize: 14 },
});

const lc = StyleSheet.create({
  card: { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  strip:{ width: 3, alignSelf: "stretch" },
  body: { flex: 1, paddingVertical: 12, paddingRight: 12, paddingLeft: 10 },
  topRow:{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  check:{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tick: { color: "#fff", fontSize: 11, fontWeight: "900" },
  company:{ flex: 1, fontSize: 13, fontWeight: "700" },
  id:   { fontSize: 10, marginTop: 1 },
  badge:{ borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTxt:{ fontSize: 9, fontWeight: "800" },
  div:  { height: 1, marginBottom: 8 },
  meta: { flexDirection: "row", gap: 12 },
});

const mc = StyleSheet.create({
  label:{ fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  value:{ fontSize: 11, fontWeight: "500" },
});
