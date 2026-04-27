import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { STATES_DATA } from "../lib/statesData";

const PAGE_SIZE = 20;
const MANAGED_AREAS = ["Bengaluru", "CSD", "KKG"];

// ─── SelectSheet ──────────────────────────────────────────────────────────────
function SelectSheet({ visible, title, options, selected, onSelect, onClose, theme, isDark }: any) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const filtered: string[] = q.trim()
    ? options.filter((o: string) => o.toLowerCase().includes(q.toLowerCase()))
    : options;

  const close = () => { setQ(""); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={ss.overlay}>
        <TouchableOpacity style={ss.backdrop} activeOpacity={1} onPress={close} />
        <View style={[ss.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[ss.handle, { backgroundColor: theme.cardBorder }]} />
          <View style={[ss.header, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[ss.title, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={close} style={[ss.closeBtn, { backgroundColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 17 }}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={[ss.searchBox, { backgroundColor: isDark ? "#0d1626" : "#f1f5f9", borderColor: theme.cardBorder }]}>
            <Text style={{ color: theme.textMuted, fontSize: 15, marginRight: 6 }}>⌕</Text>
            <TextInput
              style={[ss.searchInput, { color: theme.text }]}
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
              <Text style={[ss.empty, { color: theme.textMuted }]}>No results</Text>
            }
            renderItem={({ item }: { item: string }) => {
              const isSel = item === selected;
              return (
                <TouchableOpacity
                  style={[ss.row, { borderBottomColor: theme.cardBorder }, isSel && { backgroundColor: theme.primary + "12" }]}
                  onPress={() => { onSelect(item); close(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[ss.rowTxt, { color: isSel ? theme.primary : theme.text, fontWeight: isSel ? "700" : "400" }]}>
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

// ─── Region card ──────────────────────────────────────────────────────────────
function RegionCard({ item, onEdit, theme, accent }: any) {
  const initials = (item.statename || "?").slice(0, 2).toUpperCase();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[rc.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onPress={() => onEdit(item)}
    >
      <View style={[rc.strip, { backgroundColor: accent }]} />
      <View style={[rc.avatar, { backgroundColor: accent + "18" }]}>
        <Text style={[rc.avatarTxt, { color: accent }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rc.state, { color: theme.text }]} numberOfLines={1}>{item.statename}</Text>
        <Text style={[rc.dist, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.distname}{item.subdistname ? ` · ${item.subdistname}` : ""}
        </Text>
      </View>
      {!!item.managedarea && (
        <View style={[rc.badge, { backgroundColor: accent + "15", borderColor: accent + "35" }]}>
          <Text style={[rc.badgeTxt, { color: accent }]}>{item.managedarea}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RegionMasterScreen() {
  const { theme, isDark } = useTheme();
  const accent = theme.primary;

  const [all,        setAll]        = useState<any[]>([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [loadingMore,setLoadingMore]= useState(false);

  // Form
  const [formOpen,    setFormOpen]    = useState(true);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [stateName,   setStateName]   = useState("");
  const [distName,    setDistName]    = useState("");
  const [regionName,  setRegionName]  = useState("");
  const [managedArea, setManagedArea] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [banner,      setBanner]      = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // Sheet visibility
  const [stateSheet, setStateSheet] = useState(false);
  const [distSheet,  setDistSheet]  = useState(false);
  const [areaSheet,  setAreaSheet]  = useState(false);

  const searchTimer  = useRef<any>(null);
  const regionRef    = useRef<TextInput>(null);

  const stateNames    = STATES_DATA.map(s => s.statename);
  const districtNames = STATES_DATA.find(s => s.statename === stateName)?.districts.map(d => d.distname) ?? [];

  // ── filtered & paginated ──────────────────────────────────────────────────
  const filtered = search.trim()
    ? all.filter(r =>
        (r.statename   || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.distname    || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.subdistname || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.managedarea || "").toLowerCase().includes(search.toLowerCase())
      )
    : all;

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.post("/masters", { submittype: "regions" });
      if (res?.success) setAll(res.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchData(true); };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => { setPage(p => p + 1); setLoadingMore(false); }, 200);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 300);
  };

  // ── form helpers ──────────────────────────────────────────────────────────
  const clearErr = (field: string) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const resetForm = () => {
    setStateName(""); setDistName(""); setRegionName(""); setManagedArea("");
    setEditingId(null); setErrors({}); setBanner(null);
  };

  const handleEdit = (r: any) => {
    setStateName(r.statename || "");
    setDistName(r.distname || "");
    setRegionName(r.subdistname || "");
    setManagedArea(r.managedarea || "");
    setEditingId(r.slno);
    setErrors({}); setBanner(null);
    setFormOpen(true);
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setBanner(null);
    const errs: Record<string, string> = {};
    if (!stateName)        errs.state  = "Please select a state.";
    if (!distName)         errs.dist   = "Please select a district.";
    if (!regionName.trim())errs.region = "Region / Sub-district name is required.";
    if (!managedArea)      errs.area   = "Please select a managed area.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const res = await api.post("/masters", {
        submittype:  "save_region",
        slno:        editingId || "",
        statename:   stateName,
        distname:    distName,
        subdistname: regionName.trim(),
        managedarea: managedArea,
      });
      if (res?.success) {
        setBanner({ type: "success", msg: editingId ? "Region updated successfully." : "Region added successfully." });
        resetForm();
        fetchData(true);
      } else {
        setBanner({ type: "error", msg: res?.message || "Failed to save. Please try again." });
      }
    } catch {
      setBanner({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ── palette per state ─────────────────────────────────────────────────────
  const PALETTE = ["#6366f1","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899"];
  const stateColor = (name: string) => PALETTE[(name?.charCodeAt(0) || 0) % PALETTE.length];

  // ── SelectField ───────────────────────────────────────────────────────────
  const SelectField = ({ label, value, placeholder, onPress, disabled, errKey }: any) => (
    <View style={f.fieldWrap}>
      <Text style={[f.label, { color: errors[errKey] ? "#ef4444" : theme.textMuted }]}>{label}</Text>
      <TouchableOpacity
        style={[
          f.selectBtn,
          {
            backgroundColor: isDark ? "#0d1626" : "#f8fafc",
            borderColor: errors[errKey] ? "#ef4444" : theme.cardBorder,
          },
          disabled && { opacity: 0.5 },
        ]}
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={[f.selectTxt, { color: value ? theme.text : theme.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 11 }}>▼</Text>
      </TouchableOpacity>
      {!!errors[errKey] && <Text style={f.errMsg}>{errors[errKey]}</Text>}
    </View>
  );

  // ── render ────────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Form card */}
      <View style={[s.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={s.formTitleRow} activeOpacity={0.8} onPress={() => setFormOpen(o => !o)}>
          <View style={[s.formIcon, { backgroundColor: accent + "18" }]}>
            <Text style={{ color: accent, fontSize: 14 }}>{editingId ? "✎" : "+"}</Text>
          </View>
          <Text style={[s.formTitle, { color: accent }]}>
            {editingId ? "EDIT REGION" : "ADD NEW REGION"}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 18 }}>{formOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {formOpen && (
          <View style={{ marginTop: 14 }}>
            {/* Banner */}
            {banner && (
              <View style={[
                s.banner,
                banner.type === "success"
                  ? { backgroundColor: "#10b98118", borderColor: "#10b98140" }
                  : { backgroundColor: "#ef444418", borderColor: "#ef444440" },
              ]}>
                <Text style={{ fontWeight: "800", color: banner.type === "success" ? "#10b981" : "#ef4444", fontSize: 14 }}>
                  {banner.type === "success" ? "✓" : "✕"}
                </Text>
                <Text style={[s.bannerMsg, { color: banner.type === "success" ? "#10b981" : "#ef4444" }]}>
                  {banner.msg}
                </Text>
                <TouchableOpacity onPress={() => setBanner(null)}>
                  <Text style={{ color: banner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* State */}
            <SelectField
              label="STATE"
              value={stateName}
              placeholder="Select state..."
              onPress={() => setStateSheet(true)}
              errKey="state"
            />

            {/* District */}
            <SelectField
              label="DISTRICT"
              value={distName}
              placeholder={stateName ? "Select district..." : "Select state first"}
              onPress={() => setDistSheet(true)}
              disabled={!stateName}
              errKey="dist"
            />

            {/* Region / Sub-district (free text) */}
            <View style={f.fieldWrap}>
              <Text style={[f.label, { color: errors.region ? "#ef4444" : theme.textMuted }]}>
                REGION / SUB-DISTRICT
              </Text>
              <TextInput
                ref={regionRef}
                style={[
                  f.input,
                  {
                    backgroundColor: isDark ? "#0d1626" : "#f8fafc",
                    color: theme.text,
                    borderColor: errors.region ? "#ef4444" : theme.cardBorder,
                  },
                ]}
                placeholder="e.g. Haveli, Mulshi..."
                placeholderTextColor={theme.textMuted}
                value={regionName}
                onChangeText={v => { setRegionName(v); clearErr("region"); }}
                returnKeyType="done"
                autoCapitalize="words"
              />
              {!!errors.region && <Text style={f.errMsg}>{errors.region}</Text>}
            </View>

            {/* Managed area */}
            <SelectField
              label="MANAGED AREA"
              value={managedArea}
              placeholder="Select managed area..."
              onPress={() => setAreaSheet(true)}
              errKey="area"
            />

            <View style={s.btnRow}>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: accent }, saving && { opacity: 0.65 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveTxt}>{editingId ? "UPDATE" : "SAVE REGION"}</Text>}
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={[s.cancelBtn, { borderColor: theme.cardBorder }]} onPress={resetForm}>
                  <Text style={{ color: theme.textMuted, fontWeight: "700", fontSize: 13 }}>CANCEL</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Search + count */}
      <View style={s.searchRow}>
        <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={{ color: theme.textMuted, fontSize: 16, marginRight: 6 }}>⌕</Text>
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search state, district, region…"
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Text style={{ color: theme.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[s.countPill, { backgroundColor: accent + "15" }]}>
          <Text style={[s.countTxt, { color: accent }]}>{filtered.length.toLocaleString()}</Text>
        </View>
      </View>

      <View style={s.sectionRow}>
        <Text style={[s.sectionTxt, { color: theme.textMuted }]}>REGION DIRECTORY</Text>
        <View style={[s.sectionLine, { backgroundColor: theme.cardBorder }]} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[s.loadTxt, { color: theme.textMuted }]}>Loading regions…</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, i) => `${item.slno ?? i}`}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={accent} style={{ marginVertical: 16 }} />
              : hasMore
              ? <Text style={[s.moreHint, { color: theme.textMuted }]}>Scroll for more…</Text>
              : visible.length > 0
              ? <Text style={[s.endTxt, { color: theme.textMuted }]}>— {filtered.length.toLocaleString()} regions —</Text>
              : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyIcon, { color: theme.textMuted }]}>◎</Text>
              <Text style={[s.emptyTxt, { color: theme.textMuted }]}>
                {search ? "No regions match your search" : "No regions found"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RegionCard item={item} onEdit={handleEdit} theme={theme} accent={stateColor(item.statename)} />
          )}
        />
      )}

      <SelectSheet
        visible={stateSheet}
        title="Select State"
        options={stateNames}
        selected={stateName}
        onSelect={(v: string) => { setStateName(v); setDistName(""); clearErr("state"); }}
        onClose={() => setStateSheet(false)}
        theme={theme}
        isDark={isDark}
      />
      <SelectSheet
        visible={distSheet}
        title="Select District"
        options={districtNames}
        selected={distName}
        onSelect={(v: string) => { setDistName(v); clearErr("dist"); }}
        onClose={() => setDistSheet(false)}
        theme={theme}
        isDark={isDark}
      />
      <SelectSheet
        visible={areaSheet}
        title="Select Managed Area"
        options={MANAGED_AREAS}
        selected={managedArea}
        onSelect={(v: string) => { setManagedArea(v); clearErr("area"); }}
        onClose={() => setAreaSheet(false)}
        theme={theme}
        isDark={isDark}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadTxt: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  list:    { padding: 14, paddingBottom: 100 },

  formCard:     { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  formTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  formIcon:     { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  formTitle:    { flex: 1, fontSize: 11, fontWeight: "900", letterSpacing: 1.8 },

  banner:    { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  bannerMsg: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 17 },

  btnRow:    { flexDirection: "row", gap: 10, marginTop: 4 },
  saveBtn:   { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn: { paddingHorizontal: 18, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  saveTxt:   { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },

  searchRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  searchBox:  { flex: 1, flexDirection: "row", alignItems: "center", height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 6 },
  searchInput:{ flex: 1, fontSize: 14 },
  countPill:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  countTxt:   { fontSize: 12, fontWeight: "800" },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTxt: { fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  sectionLine:{ flex: 1, height: 1 },

  moreHint: { textAlign: "center", fontSize: 12, paddingVertical: 14 },
  endTxt:   { textAlign: "center", fontSize: 11, paddingVertical: 20, letterSpacing: 0.5 },
  empty:    { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyIcon:{ fontSize: 36 },
  emptyTxt: { fontSize: 14, fontWeight: "500" },
});

const f = StyleSheet.create({
  fieldWrap: { marginBottom: 12 },
  label:     { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 5 },
  input:     { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  selectBtn: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectTxt: { fontSize: 14, flex: 1 },
  errMsg:    { fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: "600" },
});

const rc = StyleSheet.create({
  card:      { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, marginBottom: 8, paddingRight: 12, paddingVertical: 12, overflow: "hidden", gap: 10 },
  strip:     { width: 3, alignSelf: "stretch", borderRadius: 2, marginRight: 2 },
  avatar:    { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 13, fontWeight: "800" },
  state:     { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  dist:      { fontSize: 12, fontWeight: "400" },
  badge:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTxt:  { fontSize: 10, fontWeight: "800" },
});

const ss = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: "flex-end" },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%", overflow: "hidden" },
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
