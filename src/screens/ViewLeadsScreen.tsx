import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const STATUS_COLOR: Record<string, string> = {
  "not viewed":    "#3b82f6", "attended":     "#10b981", "in progress":  "#f59e0b",
  "demo given":    "#8b5cf6", "order closed": "#22c55e", "fake":         "#ef4444",
  "not interested":"#64748b", "quote sent":   "#06b6d4", "persuing":     "#6366f1",
  "registered":    "#14b8a6",
};
const getColor = (s: string) => STATUS_COLOR[s?.toLowerCase()] || "#64748b";

const TABS = [
  { label: "All",         value: "recent" },
  { label: "New",         value: "not-viewed" },
  { label: "Follow-ups",  value: "follow-ups" },
  { label: "No Activity", value: "zero-follow-ups" },
];

const LIMIT = 20;

export default function ViewLeadsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [leads, setLeads]         = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState("recent");
  const [start, setStart]         = useState(0);
  const [hasMore, setHasMore]     = useState(true);
  const searchTimer               = useRef<any>(null);

  const [selected, setSelected]   = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Fetch list ──
  const fetchLeads = useCallback(async (s: number, q: string, t: string, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await api.post("/leads", {
        submittype: "griddata", start: s, limit: LIMIT,
        searchQuery: q, searchFor: "all", tab: t,
      });
      if (res?.success) {
        const rows = res.data || [];
        setLeads(prev => append ? [...prev, ...rows] : rows);
        setTotal(res.total || 0);
        setHasMore(rows.length === LIMIT);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLeads(0, search, tab); }, [tab]);

  const handleSearch = (q: string) => {
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setStart(0); fetchLeads(0, q, tab); }, 400);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = start + LIMIT;
    setStart(next);
    fetchLeads(next, search, tab, true);
  };

  const onRefresh = () => { setRefreshing(true); setStart(0); fetchLeads(0, search, tab); };

  // ── Open detail ──
  const openDetail = async (lead: any) => {
    setSelected(lead);
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.post("/leads", { submittype: "leaddetail", leadid: lead.id });
      if (res?.success && res.data?.lead) setSelected({ ...res.data.lead, followups: res.data.followups || [] });
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  // ─── List card ───────────────────────────────────────────────────────────────
  const renderCard = ({ item }: any) => {
    const color    = getColor(item.leadstatus);
    const initials = (item.company || item.name || "?").slice(0, 2).toUpperCase();
    return (
      <TouchableOpacity style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => openDetail(item)} activeOpacity={0.75}>
        <View style={[s.bar, { backgroundColor: color }]} />
        <View style={s.cardBody}>
          {/* Top row */}
          <View style={s.cardTop}>
            <View style={[s.avatar, { backgroundColor: color + "18" }]}>
              <Text style={[s.avatarTxt, { color }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.company, { color: theme.text }]} numberOfLines={1}>{item.company || "—"}</Text>
              <Text style={[s.person, { color: theme.textMuted }]} numberOfLines={1}>{item.name}{item.cell ? ` · ${item.cell}` : ""}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: color + "15", borderColor: color + "40" }]}>
              <Text style={[s.statusTxt, { color }]}>{item.leadstatus || "—"}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[s.div, { backgroundColor: theme.cardBorder }]} />

          {/* Meta row */}
          <View style={s.metaRow}>
            <MetaChip label="Product"  value={item.productname}                  theme={theme} color={color} />
            <MetaChip label="Location" value={item.distname || item.statename}   theme={theme} color={color} />
            <MetaChip label="Dealer"   value={item.dealername}                   theme={theme} color={color} />
          </View>

          {/* Date */}
          {!!item.leaddatetime && (
            <Text style={[s.date, { color: theme.textMuted }]}>{item.leaddatetime}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[s.wrap, { backgroundColor: theme.bg }]}>

      {/* Search */}
      <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={{ fontSize: 18, color: theme.textMuted, marginRight: 6 }}>⌕</Text>
        <TextInput style={[s.searchInput, { color: theme.text }]} placeholder="Search company, name, phone..." placeholderTextColor={theme.textMuted} value={search} onChangeText={handleSearch} />
        {search.length > 0 && <TouchableOpacity onPress={() => handleSearch("")}><Text style={{ color: theme.textMuted }}>✕</Text></TouchableOpacity>}
      </View>

      {/* Tabs */}
      <View style={[s.tabWrap, { borderBottomColor: theme.cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {TABS.map(t => {
            const active = tab === t.value;
            return (
              <TouchableOpacity key={t.value} style={[s.tab, active && { borderBottomColor: theme.primary }]} onPress={() => { setTab(t.value); setStart(0); }}>
                <Text style={[s.tabTxt, { color: active ? theme.primary : theme.textMuted }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[s.countPill, { backgroundColor: theme.primary + "15" }]}>
          <Text style={[s.countTxt, { color: theme.primary }]}>{total.toLocaleString()}</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={<View style={s.center}><Text style={{ color: theme.textMuted, marginTop: 60 }}>No leads found</Text></View>}
          renderItem={renderCard}
        />
      )}

      {/* ── Detail Modal ── */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={[s.wrap, { backgroundColor: theme.bg }]}>
          {/* Modal header */}
          <View style={[s.modalHeader, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card, paddingTop: Math.max(insets.top, 20) }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.modalCompany, { color: theme.text }]} numberOfLines={1}>{selected?.company || "Lead Detail"}</Text>
              <Text style={[s.modalId, { color: theme.textMuted }]}>Lead ID: #{selected?.id}</Text>
            </View>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={[s.closeBtn, { backgroundColor: theme.cardBorder }]}>
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <ScrollView contentContainerStyle={s.detailScroll} showsVerticalScrollIndicator={false}>

              {/* Status hero */}
              {selected?.leadstatus && (() => {
                const c = getColor(selected.leadstatus);
                return (
                  <View style={[s.statusHero, { backgroundColor: c + "12", borderColor: c + "30" }]}>
                    <View style={[s.statusDot, { backgroundColor: c }]} />
                    <Text style={[s.statusHeroTxt, { color: c }]}>{selected.leadstatus}</Text>
                  </View>
                );
              })()}

              {/* Company & Contact */}
              <DetailCard title="COMPANY & CONTACT" theme={theme}>
                <DRow label="Company"    value={selected?.company} theme={theme} />
                <DRow label="Contact"    value={selected?.name}    theme={theme} />
                <DRow label="Cell"       value={selected?.cell}    theme={theme} />
                <DRow label="Phone"      value={selected?.phone}   theme={theme} />
                <DRow label="Email"      value={selected?.emailid} theme={theme} />
                <DRow label="Website"    value={selected?.website} theme={theme} />
                <DRow label="Address"    value={selected?.address} theme={theme} />
                <DRow label="Place"      value={selected?.place}   theme={theme} last />
              </DetailCard>

              {/* Location */}
              <DetailCard title="LOCATION" theme={theme}>
                <DRow label="Region"    value={selected?.regionname} theme={theme} />
                <DRow label="District"  value={selected?.distname}   theme={theme} />
                <DRow label="State"     value={selected?.statename}  theme={theme} last />
              </DetailCard>

              {/* Assignment */}
              <DetailCard title="ASSIGNMENT" theme={theme}>
                <DRow label="Product"   value={selected?.productname}  theme={theme} />
                <DRow label="Dealer"    value={selected?.dealername}   theme={theme} />
                <DRow label="Manager"   value={selected?.managername}  theme={theme} />
                <DRow label="Member"    value={selected?.dealermembername} theme={theme} />
                <DRow label="Source"    value={selected?.leadsource || selected?.source} theme={theme} />
                <DRow label="Uploaded By" value={selected?.givenby_name} theme={theme} />
                <DRow label="Date"      value={selected?.leaddatetime} theme={theme} />
                <DRow label="Remarks"   value={selected?.remarks}      theme={theme} last />
              </DetailCard>

              {/* Follow-ups */}
              {selected?.followups?.length > 0 && (
                <DetailCard title={`FOLLOW-UPS (${selected.followups.length})`} theme={theme}>
                  {selected.followups.map((f: any, i: number) => (
                    <View key={i} style={[s.followupRow, { borderBottomColor: theme.cardBorder }, i === selected.followups.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={s.followupTop}>
                        <Text style={[s.followupStatus, { color: getColor(f.leadstatus), backgroundColor: getColor(f.leadstatus) + "15", borderColor: getColor(f.leadstatus) + "30" }]}>{f.leadstatus}</Text>
                        <Text style={[s.followupDate, { color: theme.textMuted }]}>{f.entrydate}</Text>
                      </View>
                      {!!f.remarks && <Text style={[s.followupRemark, { color: theme.text }]}>{f.remarks}</Text>}
                      {f.nextfollowupdate && f.nextfollowupdate !== "---" && (
                        <Text style={[s.followupNext, { color: theme.primary }]}>Next: {f.nextfollowupdate}</Text>
                      )}
                      {!!f.enteredby && <Text style={[s.followupBy, { color: theme.textMuted }]}>By {f.enteredby}</Text>}
                    </View>
                  ))}
                </DetailCard>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function MetaChip({ label, value, theme, color }: any) {
  if (!value) return null;
  return (
    <View style={mc.chip}>
      <Text style={[mc.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[mc.value, { color: theme.textSecondary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function DetailCard({ title, children, theme }: any) {
  return (
    <View style={[dc.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[dc.title, { color: theme.primary }]}>{title}</Text>
      {children}
    </View>
  );
}

function DRow({ label, value, theme, last = false }: any) {
  if (!value || value === "—" || value === "") return null;
  return (
    <View style={[dc.row, !last && { borderBottomColor: theme.cardBorder, borderBottomWidth: 1 }]}>
      <Text style={[dc.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[dc.value, { color: theme.text }]} numberOfLines={3} selectable>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrap:        { flex: 1 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },

  searchBox:   { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14 },

  tabWrap:     { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, paddingRight: 16 },
  tabs:        { paddingHorizontal: 12, gap: 4 },
  tab:         { paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabTxt:      { fontSize: 13, fontWeight: "700" },
  countPill:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginLeft: 4 },
  countTxt:    { fontSize: 11, fontWeight: "700" },

  list:        { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  card:        { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  bar:         { width: 4 },
  cardBody:    { flex: 1, padding: 12 },
  cardTop:     { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar:      { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarTxt:   { fontSize: 13, fontWeight: "800" },
  company:     { fontSize: 14, fontWeight: "700" },
  person:      { fontSize: 11, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusTxt:   { fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },
  div:         { height: 1, marginVertical: 10 },
  metaRow:     { flexDirection: "row", gap: 10 },
  date:        { fontSize: 10, marginTop: 8 },

  modalHeader:  { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalCompany: { fontSize: 16, fontWeight: "800" },
  modalId:      { fontSize: 11, marginTop: 2 },
  closeBtn:     { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginLeft: 12 },

  detailScroll: { padding: 16 },
  statusHero:   { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  statusHeroTxt:{ fontSize: 15, fontWeight: "800" },

  followupRow:  { paddingVertical: 12, borderBottomWidth: 1 },
  followupTop:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  followupStatus:{ fontSize: 10, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, overflow: "hidden" },
  followupDate: { fontSize: 11 },
  followupRemark:{ fontSize: 13, marginBottom: 4 },
  followupNext: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  followupBy:   { fontSize: 10 },
});

const mc = StyleSheet.create({
  chip:  { flex: 1, minWidth: 0 },
  label: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 1 },
  value: { fontSize: 11, fontWeight: "500" },
});

const dc = StyleSheet.create({
  card:  { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  title: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 10 },
  row:   { flexDirection: "row", paddingVertical: 9 },
  label: { fontSize: 11, fontWeight: "700", width: 100, textTransform: "uppercase" },
  value: { flex: 1, fontSize: 13 },
});
