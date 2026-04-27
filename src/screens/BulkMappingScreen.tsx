import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const CATEGORIES = ["SAC", "SARAL GST", "SPP", "STO", "OTHERS"];
const CAT_COLOR: Record<string, string> = {
  "SAC": "#6366f1", "SARAL GST": "#f59e0b",
  "SPP": "#0ea5e9", "STO": "#10b981", "OTHERS": "#64748b",
};

type Region = { id: string; name: string };

export default function BulkMappingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // ── Step state ──
  const [dealer, setDealer]       = useState<any>(null);
  const [category, setCategory]   = useState<string>("");

  // ── Dealer picker ──
  const [dealerModal, setDealerModal] = useState(false);
  const [dealers, setDealers]         = useState<any[]>([]);
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerPage, setDealerPage]   = useState(1);
  const [dealerMore, setDealerMore]   = useState(true);
  const [dealerLoading, setDealerLoading] = useState(false);
  const [dealerLoadingMore, setDealerLoadingMore] = useState(false);
  const dealerSearchTimer = useRef<any>(null);

  // ── Regions state ──
  const [activeTab, setActiveTab]       = useState<"available" | "assigned">("available");
  const [unassigned, setUnassigned]     = useState<Region[]>([]);
  const [assigned, setAssigned]         = useState<Region[]>([]);
  const [regionSearch, setRegionSearch] = useState("");
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveBanner, setSaveBanner]     = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ─── Load dealers ───────────────────────────────────────────────────────────
  const loadDealers = async (q: string, pg: number, append = false) => {
    if (append) setDealerLoadingMore(true); else setDealerLoading(true);
    try {
      const res = await api.post("/mapping_api", {
        submittype: "get_dealers", search: q, page: pg, perpage: 25,
      });
      if (res.success && res.data) {
        const d = res.data as any[];
        setDealers(prev => append ? [...prev, ...d] : d);
        setDealerMore(d.length === 25);
      }
    } finally {
      setDealerLoading(false);
      setDealerLoadingMore(false);
    }
  };

  const openDealerModal = () => {
    setDealerSearch("");
    setDealerPage(1);
    setDealerMore(true);
    loadDealers("", 1);
    setDealerModal(true);
  };

  const handleDealerSearch = (q: string) => {
    setDealerSearch(q);
    clearTimeout(dealerSearchTimer.current);
    dealerSearchTimer.current = setTimeout(() => {
      setDealerPage(1);
      loadDealers(q, 1);
    }, 400);
  };

  const loadMoreDealers = () => {
    if (dealerLoadingMore || !dealerMore) return;
    const next = dealerPage + 1;
    setDealerPage(next);
    loadDealers(dealerSearch, next, true);
  };

  const pickDealer = (d: any) => {
    setDealer(d);
    setDealerModal(false);
    setAssigned([]);
    setUnassigned([]);
    setCategory("");
  };

  // ─── Load regions when dealer + category ready ───────────────────────────────
  useEffect(() => {
    if (!dealer || !category) return;
    loadRegions();
  }, [dealer, category]);

  const loadRegions = async () => {
    setRegionsLoading(true);
    setAssigned([]);
    setUnassigned([]);
    try {
      const [uRes, aRes] = await Promise.all([
        api.post("/mapping_api", { submittype: "unassignedlist", category }),
        api.post("/mapping_api", { submittype: "assignedlist", dealerid: dealer.id, category }),
      ]);
      if (uRes.success) setUnassigned(uRes.data || []);
      if (aRes.success) setAssigned(aRes.data || []);
    } finally {
      setRegionsLoading(false);
    }
  };

  // ─── Move region between lists ───────────────────────────────────────────────
  const moveToAssigned = (region: Region) => {
    setUnassigned(prev => prev.filter(r => r.id !== region.id));
    setAssigned(prev => [...prev, region]);
  };

  const moveToUnassigned = (region: Region) => {
    setAssigned(prev => prev.filter(r => r.id !== region.id));
    setUnassigned(prev => [...prev, region]);
  };

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveBanner(null);
    setSaving(true);
    try {
      const res = await api.post("/mapping_api", {
        submittype: "bulk_save",
        dealerid: dealer.id,
        category,
        regionids: assigned.map(r => r.id),
      });
      if (res.success) {
        setSaveBanner({ type: "success", msg: res.message || "Mapping updated successfully." });
        loadRegions();
      } else {
        setSaveBanner({ type: "error", msg: res.message || "Failed to save." });
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Filtered lists ──────────────────────────────────────────────────────────
  const q = regionSearch.toLowerCase();
  const filteredUnassigned = q ? unassigned.filter(r => r.name.toLowerCase().includes(q)) : unassigned;
  const filteredAssigned   = q ? assigned.filter(r => r.name.toLowerCase().includes(q))   : assigned;
  const activeList         = activeTab === "available" ? filteredUnassigned : filteredAssigned;

  const catColor = category ? (CAT_COLOR[category] || theme.primary) : theme.primary;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[s.wrap, { backgroundColor: theme.bg }]}>

      {/* ── Header: Dealer selector + category ── */}
      <View style={[s.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        {/* Dealer button */}
        <TouchableOpacity
          style={[s.dealerBtn, { borderColor: dealer ? theme.primary + "60" : theme.cardBorder, backgroundColor: dealer ? theme.primary + "10" : theme.bg }]}
          onPress={openDealerModal}
        >
          <View style={{ flex: 1 }}>
            {dealer ? (
              <>
                <Text style={[s.dealerBtnLabel, { color: theme.textMuted }]}>DEALER</Text>
                <Text style={[s.dealerBtnName, { color: theme.primary }]} numberOfLines={1}>
                  {dealer.name || dealer.contactPerson}
                </Text>
              </>
            ) : (
              <Text style={[s.dealerBtnPlaceholder, { color: theme.textMuted }]}>Select a dealer...</Text>
            )}
          </View>
          <Text style={[s.dealerBtnArrow, { color: theme.textMuted }]}>▾</Text>
        </TouchableOpacity>

        {/* Category pills */}
        {dealer && (
          <View style={s.catRow}>
            {CATEGORIES.map(cat => {
              const active = category === cat;
              const cc = CAT_COLOR[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.catPill, { borderColor: active ? cc : theme.cardBorder, backgroundColor: active ? cc + "18" : "transparent" }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[s.catPillTxt, { color: active ? cc : theme.textMuted }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Content area ── */}
      {!dealer ? (
        <View style={s.center}>
          <Text style={[s.hint, { color: theme.textMuted }]}>↑  Select a dealer to start mapping</Text>
        </View>
      ) : !category ? (
        <View style={s.center}>
          <Text style={[s.hint, { color: theme.textMuted }]}>Select a category above</Text>
        </View>
      ) : regionsLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[s.hint, { color: theme.textMuted }]}>Loading regions...</Text>
        </View>
      ) : (
        <>
          {/* Tabs + search */}
          <View style={[s.tabBar, { borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={[s.tabBtn, activeTab === "available" && { borderBottomColor: catColor }]}
              onPress={() => setActiveTab("available")}
            >
              <Text style={[s.tabTxt, { color: activeTab === "available" ? catColor : theme.textMuted }]}>
                Available
              </Text>
              <View style={[s.tabCount, { backgroundColor: catColor + (activeTab === "available" ? "25" : "12") }]}>
                <Text style={[s.tabCountTxt, { color: catColor }]}>{filteredUnassigned.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.tabBtn, activeTab === "assigned" && { borderBottomColor: "#10b981" }]}
              onPress={() => setActiveTab("assigned")}
            >
              <Text style={[s.tabTxt, { color: activeTab === "assigned" ? "#10b981" : theme.textMuted }]}>
                Assigned
              </Text>
              <View style={[s.tabCount, { backgroundColor: activeTab === "assigned" ? "#10b98125" : "#10b98112" }]}>
                <Text style={[s.tabCountTxt, { color: "#10b981" }]}>{filteredAssigned.length}</Text>
              </View>
            </TouchableOpacity>

            {/* Search */}
            <View style={[s.regionSearch, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
              <TextInput
                style={[s.regionSearchInput, { color: theme.text }]}
                placeholder="Search..."
                placeholderTextColor={theme.textMuted}
                value={regionSearch}
                onChangeText={setRegionSearch}
              />
              {regionSearch.length > 0 && (
                <TouchableOpacity onPress={() => setRegionSearch("")}>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={activeList}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={[s.hint, { color: theme.textMuted }]}>
                  {regionSearch ? "No results" : activeTab === "available" ? "All regions assigned" : "No regions assigned yet"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.regionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => activeTab === "available" ? moveToAssigned(item) : moveToUnassigned(item)}
              >
                <View style={[s.regionIcon, {
                  backgroundColor: activeTab === "available" ? catColor + "18" : "#10b98118",
                  borderColor:     activeTab === "available" ? catColor + "40" : "#10b98140",
                }]}>
                  <Text style={{ fontSize: 12, color: activeTab === "available" ? catColor : "#10b981" }}>
                    {activeTab === "available" ? "+" : "−"}
                  </Text>
                </View>
                <Text style={[s.regionName, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Save banner */}
          {!!saveBanner && (
            <View style={[s.saveBanner, saveBanner.type === "success"
              ? { backgroundColor: "#10b98115", borderColor: "#10b98140" }
              : { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: saveBanner.type === "success" ? "#10b981" : "#ef4444" }}>
                {saveBanner.type === "success" ? "✓" : "✕"}
              </Text>
              <Text style={[s.saveBannerMsg, { color: saveBanner.type === "success" ? "#10b981" : "#ef4444" }]}>{saveBanner.msg}</Text>
              <TouchableOpacity onPress={() => setSaveBanner(null)}>
                <Text style={{ color: saveBanner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Save bar */}
          <View style={[s.saveBar, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
            <View>
              <Text style={[s.saveLabel, { color: theme.textMuted }]}>ASSIGNED REGIONS</Text>
              <Text style={[s.saveCount, { color: theme.text }]}>{assigned.length} region{assigned.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: catColor }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.saveBtnTxt}>Save Mapping</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Dealer picker modal ── */}
      <Modal visible={dealerModal} animationType="slide" onRequestClose={() => setDealerModal(false)}>
        <View style={[s.modalWrap, { backgroundColor: theme.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: theme.cardBorder, paddingTop: Math.max(insets.top, 16) }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Select Dealer</Text>
            <TouchableOpacity onPress={() => setDealerModal(false)}>
              <Text style={{ color: theme.primary, fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.modalSearch, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={{ fontSize: 16, color: theme.textMuted, marginRight: 6 }}>⌕</Text>
            <TextInput
              style={[s.modalSearchInput, { color: theme.text }]}
              placeholder="Search dealers..."
              placeholderTextColor={theme.textMuted}
              value={dealerSearch}
              onChangeText={handleDealerSearch}
              autoFocus
            />
            {dealerSearch.length > 0 && (
              <TouchableOpacity onPress={() => handleDealerSearch("")}>
                <Text style={{ color: theme.textMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {dealerLoading ? (
            <View style={s.center}><ActivityIndicator color={theme.primary} /></View>
          ) : (
            <FlatList
              data={dealers}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={{ padding: 16 }}
              onEndReached={loadMoreDealers}
              onEndReachedThreshold={0.3}
              ListFooterComponent={dealerLoadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} /> : null}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.dealerItem, { backgroundColor: theme.card, borderColor: dealer?.id === item.id ? theme.primary : theme.cardBorder }]}
                  onPress={() => pickDealer(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dealerItemName, { color: theme.text }]}>
                      {item.name || item.contactPerson || `Dealer #${item.id}`}
                    </Text>
                    {!!item.contactPerson && item.contactPerson !== item.name && (
                      <Text style={[s.dealerItemSub, { color: theme.textMuted }]}>{item.contactPerson}</Text>
                    )}
                    {!!(item.state || item.district) && (
                      <Text style={[s.dealerItemSub, { color: theme.textMuted }]}>
                        {[item.state, item.district].filter(Boolean).join(", ")}
                      </Text>
                    )}
                  </View>
                  {dealer?.id === item.id && (
                    <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 16 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:   { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  hint:   { fontSize: 13 },

  header:           { padding: 14, borderBottomWidth: 1, gap: 12 },
  dealerBtn:        { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  dealerBtnLabel:   { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 2 },
  dealerBtnName:    { fontSize: 14, fontWeight: "700" },
  dealerBtnPlaceholder: { fontSize: 14 },
  dealerBtnArrow:   { fontSize: 12, marginLeft: 8 },
  catRow:           { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catPill:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  catPillTxt:       { fontSize: 11, fontWeight: "800" },

  tabBar:           { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, paddingHorizontal: 14, paddingTop: 6, gap: 4 },
  tabBtn:           { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: 2, borderBottomColor: "transparent", gap: 6, marginRight: 4 },
  tabTxt:           { fontSize: 13, fontWeight: "700" },
  tabCount:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabCountTxt:      { fontSize: 11, fontWeight: "800" },
  regionSearch:     { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, height: 32, marginLeft: 4 },
  regionSearchInput:{ flex: 1, fontSize: 12 },

  list:             { padding: 14, paddingBottom: 100 },
  regionRow:        { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  regionIcon:       { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  regionName:       { flex: 1, fontSize: 13, fontWeight: "500" },

  saveBar:          { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8 },
  saveLabel:        { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  saveCount:        { fontSize: 16, fontWeight: "700", marginTop: 2 },
  saveBtn:          { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  saveBtnTxt:       { color: "#fff", fontSize: 14, fontWeight: "800" },
  saveBanner:       { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  saveBannerMsg:    { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 16 },

  modalWrap:        { flex: 1 },
  modalHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle:       { fontSize: 17, fontWeight: "700" },
  modalSearch:      { flexDirection: "row", alignItems: "center", margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  modalSearchInput: { flex: 1, fontSize: 14 },
  dealerItem:       { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  dealerItemName:   { fontSize: 14, fontWeight: "700" },
  dealerItemSub:    { fontSize: 11, marginTop: 2 },
});
