import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  "attended":      "#10b981",
  "order closed":  "#8b5cf6",
  "not viewed":    "#f59e0b",
  "unattended":    "#ef4444",
  "demo given":    "#3b82f6",
  "quote sent":    "#06b6d4",
  "not interested":"#f43f5e",
  "persuing":      "#6366f1",
  "fake":          "#64748b",
  "registered":    "#14b8a6",
};

export default function UpdateLeadsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("followup");

  // Follow-up form
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [followupBanner, setFollowupBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetchLeads(1, true);
  }, []);

  const fetchLeads = async (p: number, clear = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post("/leads", {
        submittype: "griddata",
        searchQuery: search,
        limit: PAGE_SIZE,
        start: (p - 1) * PAGE_SIZE,
      });

      if (res.success && Array.isArray(res.data)) {
        setLeads(prev => clear ? res.data : [...prev, ...res.data]);
        setHasMore(res.data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
        if (clear) setLeads([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchLeads(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchLeads(next);
    }
  };

  const openDetail = async (lead: any) => {
    setSelectedLead(lead);
    setDetailModal(true);
    setDetailLoading(true);
    setActiveTab("followup");
    try {
      const res = await api.get(`/leads?submittype=leaddetail&leadid=${lead.id}`);
      if (res.success) {
        setSelectedLead({
          ...lead,
          ...res.data.lead,
          followups: res.data.followups || [],
          logs: res.data.logs || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveFollowup = async () => {
    setFollowupBanner(null);
    if (!remarks) {
      setFollowupBanner({ type: "error", msg: "Please enter follow-up remarks." });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/leads", {
        submittype: "followup",
        leadid: selectedLead.id,
        remarks,
      });
      if (res.success) {
        setRemarks("");
        setFollowupBanner({ type: "success", msg: "Interaction saved successfully." });
        openDetail(selectedLead);
      } else {
        setFollowupBanner({ type: "error", msg: res.message || "Failed to save follow-up." });
      }
    } catch (e) {
      setFollowupBanner({ type: "error", msg: "Network request failed." });
    } finally {
      setSaving(false);
    }
  };

  const renderLead = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.leadstatus?.toLowerCase()] || "#64748b";
    return (
      <TouchableOpacity 
        onPress={() => openDetail(item)}
        style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      >
        <View style={s.cardTop}>
          <Text style={[s.company, { color: theme.text }]} numberOfLines={1}>{item.company}</Text>
          <View style={[s.badge, { backgroundColor: statusColor + "15", borderColor: statusColor + "30" }]}>
            <Text style={[s.badgeText, { color: statusColor }]}>{item.leadstatus?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[s.cardDivider, { backgroundColor: theme.cardBorder }]} />
        <View style={s.cardBody}>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: theme.textMuted }]}>CONTACT</Text>
              <Text style={[s.metaVal, { color: theme.textSecondary }]} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: theme.textMuted }]}>PRODUCT</Text>
              <Text style={[s.metaVal, { color: theme.textSecondary }]} numberOfLines={1}>{item.productname || "—"}</Text>
            </View>
          </View>
          <View style={[s.metaRow, { marginTop: 6 }]}>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: theme.textMuted }]}>DATE</Text>
              <Text style={[s.metaVal, { color: theme.textMuted }]}>{item.leaddatetime?.split(" ")[0] || "—"}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: theme.textMuted }]}>LOCATION</Text>
              <Text style={[s.metaVal, { color: theme.textMuted }]} numberOfLines={1}>{item.distname || "—"}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <View style={[s.header, { borderBottomColor: theme.cardBorder }]}>
        <TextInput
          style={[s.search, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", color: theme.text }]}
          placeholder="Search Leads by ID, Company, Contact..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => { setPage(1); fetchLeads(1, true); }}
        />
      </View>

      <FlatList
        data={leads}
        renderItem={renderLead}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} /> : <View style={{height: 100}} />}
      />

      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={s.modalWrap}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject as any} activeOpacity={1} onPress={() => setDetailModal(false)} />
          <View style={[s.modalContent, { backgroundColor: theme.card }]}>
            {/* Drag handle */}
            <View style={[s.handle, { backgroundColor: theme.cardBorder }]} />

            <View style={[s.modalHeader, { borderBottomColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.modalTitle, { color: theme.text }]}>{selectedLead?.company}</Text>
                <Text style={[s.modalId, { color: theme.textMuted }]}>ID: {selectedLead?.id} · {selectedLead?.productname}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModal(false)} style={[s.closeBtn, { backgroundColor: theme.cardBorder }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={s.tabBar}>
              {["followup", "logs"].map(t => (
                <TouchableOpacity 
                  key={t} 
                  onPress={() => setActiveTab(t)}
                  style={[s.tab, activeTab === t && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                >
                  <Text style={[s.tabText, { color: activeTab === t ? theme.primary : theme.textMuted }]}>
                    {t === "followup" ? "FOLLOW UP" : "UPDATE LOGS"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView contentContainerStyle={[s.modalScroll, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {detailLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
              ) : (
                <>
                  {activeTab === "followup" ? (
                    <View style={s.tabContent}>
                      <View style={[s.form, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <Text style={[s.formLabel, { color: theme.textSecondary }]}>Add Interaction Remark</Text>
                        {!!followupBanner && (
                          <View style={[s.inlineBanner, followupBanner.type === "success"
                            ? { backgroundColor: "#10b98115", borderColor: "#10b98140" }
                            : { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
                            <Text style={{ fontSize: 13, fontWeight: "800", color: followupBanner.type === "success" ? "#10b981" : "#ef4444" }}>
                              {followupBanner.type === "success" ? "✓" : "✕"}
                            </Text>
                            <Text style={[s.bannerMsg, { color: followupBanner.type === "success" ? "#10b981" : "#ef4444" }]}>{followupBanner.msg}</Text>
                            <TouchableOpacity onPress={() => setFollowupBanner(null)}>
                              <Text style={{ color: followupBanner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        <TextInput
                          style={[s.textarea, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", color: theme.text, borderColor: theme.cardBorder }]}
                          multiline
                          numberOfLines={4}
                          value={remarks}
                          onChangeText={setRemarks}
                          placeholder="Type remarks here..."
                          placeholderTextColor={theme.textMuted}
                        />
                        <TouchableOpacity 
                          style={[s.saveBtn, { backgroundColor: theme.primary }]} 
                          onPress={handleSaveFollowup}
                          disabled={saving}
                        >
                          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>SAVE INTERACTION</Text>}
                        </TouchableOpacity>
                      </View>

                      <Text style={[s.historyTitle, { color: theme.textMuted }]}>HISTORY</Text>
                      {(selectedLead?.followups || []).map((f: any, i: number) => (
                        <View key={i} style={[s.logItem, { borderLeftColor: theme.primary }]}>
                          <View style={s.logHead}>
                            <Text style={[s.logDate, { color: theme.textSecondary }]}>{f.entrydate}</Text>
                            <Text style={[s.logUser, { color: theme.textMuted }]}>{f.enteredby}</Text>
                          </View>
                          <Text style={[s.logText, { color: theme.text }]}>{f.remarks}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={s.tabContent}>
                      {(selectedLead?.logs || []).map((l: any, i: number) => (
                        <View key={i} style={[s.statusLog, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                          <View style={s.statusLogHead}>
                            <Text style={[s.statusLogStatus, { color: theme.primary }]}>{l.leadstatus}</Text>
                            <Text style={[s.statusLogDate, { color: theme.textMuted }]}>{l.updatetime}</Text>
                          </View>
                          <Text style={[s.statusLogUser, { color: theme.textSecondary }]}>Updated by: {l.enteredby}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  search: { height: 44, borderRadius: 12, paddingHorizontal: 16, fontSize: 14 },
  
  list: { padding: 16 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  company: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: "800" },
  cardDivider: { height: 1, marginHorizontal: 14 },
  cardBody: { paddingHorizontal: 14, paddingVertical: 10 },
  metaRow: { flexDirection: "row", gap: 10 },
  metaItem: { flex: 1, minWidth: 0 },
  metaLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  metaVal: { fontSize: 12, fontWeight: "500" },

  modalWrap: { flex: 1, justifyContent: "flex-end" },
  modalContent: { height: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalId: { fontSize: 11, marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  tabBar: { flexDirection: "row", paddingHorizontal: 20 },
  tab: { paddingVertical: 14, marginRight: 24 },
  tabText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },

  modalScroll: { padding: 20 },
  tabContent: { gap: 20 },
  
  form: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  formLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  inlineBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  bannerMsg: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 16 },
  textarea: { height: 100, borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: "top" },
  saveBtn: { height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  
  historyTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 10 },
  logItem: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 4, marginBottom: 12 },
  logHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  logDate: { fontSize: 11, fontWeight: "700" },
  logUser: { fontSize: 10, fontWeight: "600" },
  logText: { fontSize: 13, lineHeight: 18 },

  statusLog: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  statusLogHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusLogStatus: { fontSize: 13, fontWeight: "800" },
  statusLogDate: { fontSize: 11 },
  statusLogUser: { fontSize: 11 },
});
