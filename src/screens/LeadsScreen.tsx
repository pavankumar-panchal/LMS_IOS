import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Modal, ScrollView, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const { width: W } = Dimensions.get("window");

const STATUS_ACCENTS: Record<string, string> = {
  "Not Viewed": "#3b82f6", "Attended": "#10b981", "In Progress": "#f59e0b",
  "Demo Given": "#8b5cf6", "Order Closed": "#10b981", "Fake": "#ef4444",
  "Not Interested": "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  "Not Viewed": "NEW", "Attended": "ATTENDED", "In Progress": "PENDING",
  "Demo Given": "DEMO", "Order Closed": "WON", "Fake": "FAKE", "Not Interested": "CLOSED",
};

const STATUSES = ["all", "Not Viewed", "Attended", "In Progress", "Demo Given", "Order Closed", "Not Interested"];

function LeadCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { theme } = useTheme();
  const color = STATUS_ACCENTS[item.leadstatus] || theme.textMuted;
  const label = STATUS_LABELS[item.leadstatus] || item.leadstatus;
  const initials = String(item.name || "?")
    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity 
      style={[lS.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[lS.bar, { backgroundColor: color }]} />
      <View style={lS.content}>
        <View style={lS.topRow}>
          <View style={[lS.avatar, { backgroundColor: color + "15" }]}>
            <Text style={[lS.avatarTxt, { color }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[lS.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[lS.phone, { color: theme.textMuted }]}>{item.phone || item.cell || "—"}</Text>
          </View>
          <View style={[lS.badge, { backgroundColor: color + "10", borderColor: color + "30" }]}>
            <Text style={[lS.badgeTxt, { color }]}>{label.toUpperCase()}</Text>
          </View>
        </View>

        <View style={[lS.divider, { backgroundColor: theme.cardBorder }]} />

        <View style={lS.footer}>
          <View style={lS.meta}>
            <Text style={[lS.metaLabel, { color: theme.textMuted }]}>PRODUCT</Text>
            <Text style={[lS.metaVal, { color: theme.textSecondary }]} numberOfLines={1}>{item.productname || "—"}</Text>
          </View>
          <View style={lS.meta}>
            <Text style={[lS.metaLabel, { color: theme.textMuted }]}>LOCATION</Text>
            <Text style={[lS.metaVal, { color: theme.textSecondary }]} numberOfLines={1}>{item.distname || "—"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({ label, value, isLast, accent }: { label: string; value?: string; isLast?: boolean; accent?: string }) {
  const { theme } = useTheme();
  return (
    <>
      <View style={dr.row}>
        <Text style={[dr.label, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[dr.value, { color: accent || theme.text }]}>{value || "—"}</Text>
      </View>
      {!isLast && <View style={[dr.divider, { backgroundColor: theme.cardBorder }]} />}
    </>
  );
}

export default function LeadsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLeads = async (pg = 1, append = false) => {
    pg === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api.post("/leads", {
        submittype: "griddata", page: pg, perPage: 15, search, status: statusFilter,
      });
      if (res?.success) {
        const rows = res.data || [];
        setLeads(append ? p => [...p, ...rows] : rows);
        setTotal(res.total || rows.length);
        setPage(pg);
      }
    } catch {}
    setLoading(false); setLoadingMore(false); setRefreshing(false);
  };

  useEffect(() => { fetchLeads(1); }, [search, statusFilter]);

  const openDetail = async (lead: any) => {
    setSelected(lead); setModalOpen(true); setDetailLoading(true);
    try {
      const res = await api.post("/leads", { submittype: "leaddetail", id: lead.id });
      if (res?.success && res.data) setSelected(res.data);
    } catch {}
    setDetailLoading(false);
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Search Bar */}
      <View style={[s.searchRow, { borderBottomColor: theme.cardBorder }]}>
        <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.searchIcon, { color: theme.textMuted }]}>⚲</Text>
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search records..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={s.clearBtn}>
              <Text style={{ color: theme.textMuted, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterContent}>
          {STATUSES.map(st => (
            <TouchableOpacity 
              key={st} 
              style={[
                s.chip, 
                { borderColor: theme.cardBorder, backgroundColor: theme.card },
                statusFilter === st && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]} 
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[s.chipTxt, { color: theme.textMuted }, statusFilter === st && { color: "#fff" }]}>
                {st === "all" ? "ALL RECORDS" : (STATUS_LABELS[st] || st).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={[s.countTxt, { color: theme.textMuted }]}>
        Showing {leads.length} of {total} records
      </Text>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[s.loadText, { color: theme.textMuted }]}>Synchronizing Data...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <LeadCard item={item} onPress={() => openDetail(item)} />}
          onEndReached={() => { if (!loadingMore && leads.length < total) fetchLeads(page + 1, true); }}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeads(1); }} tintColor={theme.primary} />}
          contentContainerStyle={s.list}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <View style={s.center}>
              <View style={[s.emptyIcon, { borderColor: theme.cardBorder }]}>
                <View style={[s.emptyDot, { backgroundColor: theme.textMuted }]} />
              </View>
              <Text style={[s.emptyTitle, { color: theme.textSecondary }]}>No Records Found</Text>
              <Text style={[s.emptySub, { color: theme.textMuted }]}>Adjust filters or pull to refresh</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={[mS.modal, { backgroundColor: theme.bg }]}>
          <View style={[mS.header, { borderBottomColor: theme.cardBorder, paddingTop: Math.max(insets.top, 20) }]}>
            <View style={mS.headerContent}>
              <Text style={[mS.title, { color: theme.text }]}>{selected?.name || "RECORD DETAIL"}</Text>
              <Text style={[mS.sub, { color: theme.textMuted }]}>Lead ID: #{selected?.id || "—"}</Text>
            </View>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={[mS.closeBtn, { backgroundColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 20 }}>×</Text>
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View style={s.center}><ActivityIndicator color={theme.primary} size="large" /></View>
          ) : selected ? (
            <ScrollView contentContainerStyle={mS.scroll} showsVerticalScrollIndicator={false}>
              <View style={[mS.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <DetailRow label="Current Status" value={STATUS_LABELS[selected.leadstatus] || selected.leadstatus} accent={STATUS_ACCENTS[selected.leadstatus]} />
                <DetailRow label="Phone Number"   value={selected.phone || selected.cell} />
                <DetailRow label="Email Address"  value={selected.emailid || selected.email} />
                <DetailRow label="Product/Service" value={selected.productname} />
                <DetailRow label="Primary City"    value={selected.distname} />
                <DetailRow label="State/Region"    value={selected.statename} />
                <DetailRow label="Assigned Dealer" value={selected.dlrcompanyname} />
                <DetailRow label="Inbound Source"  value={selected.leadsource} />
                <DetailRow label="Company Name"    value={selected.company} />
                <DetailRow label="Timestamp"       value={selected.leaddatetime} />
                <DetailRow label="System Remarks"  value={selected.remarks} isLast />
              </View>
              
              <TouchableOpacity 
                style={[mS.actionBtn, { backgroundColor: theme.primary }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={mS.actionText}>CLOSE PREVIEW</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { padding: 16, borderBottomWidth: 1 },
  searchBox: { 
    flexDirection: "row", alignItems: "center", height: 48, borderRadius: 12, 
    borderWidth: 1, paddingHorizontal: 12, gap: 10 
  },
  searchIcon: { fontSize: 20, fontWeight: "300" },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  clearBtn: { padding: 4 },
  
  filterWrap: { paddingVertical: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: { 
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, 
    borderWidth: 1 
  },
  chipTxt: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  
  countTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 16, marginBottom: 12 },
  
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  loadText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  
  emptyIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyDot: { width: 14, height: 14, borderRadius: 7 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptySub: { fontSize: 12, textAlign: "center" },
});

const lS = StyleSheet.create({
  card: {
    flexDirection: "row", borderRadius: 16, borderWidth: 1, 
    marginBottom: 12, overflow: "hidden",
  },
  bar: { width: 4 },
  content: { flex: 1, padding: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 14, fontWeight: "800" },
  name: { fontSize: 15, fontWeight: "700", flex: 1 },
  phone: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 12 },
  footer: { flexDirection: "row", gap: 20 },
  meta: { flex: 1, gap: 4 },
  metaLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  metaVal: { fontSize: 12, fontWeight: "600" },
});

const mS = StyleSheet.create({
  modal: { flex: 1 },
  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, borderBottomWidth: 1
  },
  headerContent: { flex: 1 },
  title: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  actionBtn: { 
    height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
});

const dr = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", padding: 16, gap: 12 },
  label: { fontSize: 12, fontWeight: "600", width: 100 },
  value: { fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  divider: { height: 1, marginHorizontal: 16 },
});
