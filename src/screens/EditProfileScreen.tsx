import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, FlatList,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { STATES_DATA } from "../lib/statesData";

// ─── Select-sheet picker ──────────────────────────────────────────────────────
function SelectSheet({ visible, title, options, selected, onSelect, onClose, theme, isDark }: any) {
  const [q, setQ] = useState("");
  const filtered: string[] = q.trim()
    ? options.filter((o: string) => o.toLowerCase().includes(q.toLowerCase()))
    : options;

  const close = () => { setQ(""); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={ss.overlay}>
        <TouchableOpacity style={ss.backdrop} activeOpacity={1} onPress={close} />
        <View style={[ss.sheet, { backgroundColor: theme.card }]}>
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

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { theme, isDark } = useTheme();
  const { currentUser, updateUser } = useAuth();

  const locParts = (currentUser?.location ?? "").split(" / ");

  const [name,             setName]             = useState(currentUser?.name ?? "");
  const [cell,             setCell]             = useState(currentUser?.cell ?? "");
  const [selectedState,    setSelectedState]    = useState(locParts[0] ?? "");
  const [selectedDistrict, setSelectedDistrict] = useState(locParts[1] ?? "");

  const [saving,    setSaving]    = useState(false);
  const [banner,    setBanner]    = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [stateSheet, setStateSheet] = useState(false);
  const [distSheet,  setDistSheet]  = useState(false);

  const nameRef = useRef<TextInput>(null);
  const cellRef = useRef<TextInput>(null);

  const stateNames    = STATES_DATA.map(s => s.statename);
  const districtNames = STATES_DATA.find(s => s.statename === selectedState)?.districts.map(d => d.distname) ?? [];

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())                            errs.name = "Full name is required.";
    if (cell.trim() && !/^\+?[\d\s\-]{7,15}$/.test(cell.trim()))
                                                  errs.cell = "Enter a valid mobile number.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setBanner(null);
    if (!validate()) return;

    setSaving(true);
    const location = [selectedState, selectedDistrict].filter(Boolean).join(" / ");
    const result = await updateUser(currentUser!.id, {
      name: name.trim(),
      cell: cell.trim(),
      location,
    });
    setSaving(false);

    if (result.success) {
      setBanner({ type: "success", msg: "Profile updated successfully." });
    } else {
      setBanner({ type: "error", msg: result.error || "Failed to update profile. Please try again." });
    }
  };

  const handleReset = () => {
    setName(currentUser?.name ?? "");
    setCell(currentUser?.cell ?? "");
    const loc = currentUser?.location ?? "";
    const parts = loc.split(" / ");
    setSelectedState(parts[0] ?? "");
    setSelectedDistrict(parts[1] ?? "");
    setErrors({});
    setBanner(null);
  };

  // ── Field helpers ────────────────────────────────────────────────────────
  const hasErr = (f: string) => !!errors[f];

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Inline banner ── */}
        {banner && (
          <View style={[
            s.banner,
            banner.type === "success"
              ? { backgroundColor: "#10b98118", borderColor: "#10b98140" }
              : { backgroundColor: "#ef444418", borderColor: "#ef444440" },
          ]}>
            <Text style={[s.bannerIcon]}>
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

        {/* ── Account info (read-only) ── */}
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.sectionTitle, { color: theme.primary }]}>ACCOUNT INFO</Text>

          <View style={s.field}>
            <Text style={[s.label, { color: theme.textMuted }]}>EMAIL ADDRESS <Text style={s.ro}>READ ONLY</Text></Text>
            <View style={[s.inputBox, { backgroundColor: isDark ? "#0f172a" : "#f1f5f9", borderColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>{currentUser?.email ?? "—"}</Text>
            </View>
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: theme.textMuted }]}>ROLE <Text style={s.ro}>READ ONLY</Text></Text>
            <View style={[s.inputBox, { backgroundColor: isDark ? "#0f172a" : "#f1f5f9", borderColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                {String(currentUser?.role ?? "—").replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Personal details ── */}
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.sectionTitle, { color: theme.primary }]}>PERSONAL DETAILS</Text>

          {/* Name */}
          <View style={s.field}>
            <Text style={[s.label, { color: hasErr("name") ? "#ef4444" : theme.textMuted }]}>
              FULL NAME <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <TextInput
              ref={nameRef}
              style={[
                s.inputText,
                {
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  color: theme.text,
                  borderColor: hasErr("name") ? "#ef4444" : theme.cardBorder,
                },
              ]}
              value={name}
              onChangeText={v => { setName(v); clearError("name"); }}
              placeholder="Your full name"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => cellRef.current?.focus()}
              blurOnSubmit={false}
            />
            {hasErr("name") && <Text style={s.errMsg}>{errors.name}</Text>}
          </View>

          {/* Cell */}
          <View style={s.field}>
            <Text style={[s.label, { color: hasErr("cell") ? "#ef4444" : theme.textMuted }]}>
              MOBILE NUMBER
            </Text>
            <TextInput
              ref={cellRef}
              style={[
                s.inputText,
                {
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  color: theme.text,
                  borderColor: hasErr("cell") ? "#ef4444" : theme.cardBorder,
                },
              ]}
              value={cell}
              onChangeText={v => { setCell(v); clearError("cell"); }}
              placeholder="e.g. 9876543210"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              maxLength={15}
              returnKeyType="done"
            />
            {hasErr("cell") && <Text style={s.errMsg}>{errors.cell}</Text>}
          </View>
        </View>

        {/* ── Location ── */}
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.sectionTitle, { color: theme.primary }]}>LOCATION</Text>

          {/* State */}
          <View style={s.field}>
            <Text style={[s.label, { color: theme.textMuted }]}>STATE</Text>
            <TouchableOpacity
              style={[s.selectBtn, { backgroundColor: isDark ? "#1e293b" : "#fff", borderColor: theme.cardBorder }]}
              onPress={() => setStateSheet(true)}
              activeOpacity={0.8}
            >
              <Text style={[s.selectTxt, { color: selectedState ? theme.text : theme.textMuted }]} numberOfLines={1}>
                {selectedState || "Select state..."}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* District */}
          <View style={s.field}>
            <Text style={[s.label, { color: theme.textMuted }]}>DISTRICT</Text>
            <TouchableOpacity
              style={[
                s.selectBtn,
                {
                  backgroundColor: selectedState ? (isDark ? "#1e293b" : "#fff") : (isDark ? "#0f172a" : "#f1f5f9"),
                  borderColor: theme.cardBorder,
                  opacity: selectedState ? 1 : 0.55,
                },
              ]}
              onPress={() => { if (selectedState) setDistSheet(true); }}
              activeOpacity={selectedState ? 0.8 : 1}
            >
              <Text style={[s.selectTxt, { color: selectedDistrict ? theme.text : theme.textMuted }]} numberOfLines={1}>
                {selectedDistrict || (selectedState ? "Select district..." : "Select a state first")}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Footer buttons ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.resetBtn, { borderColor: theme.cardBorder }]}
            onPress={handleReset}
            disabled={saving}
          >
            <Text style={[s.resetText, { color: theme.textSecondary }]}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.submitText}>SAVE CHANGES</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SelectSheet
        visible={stateSheet}
        title="Select State"
        options={stateNames}
        selected={selectedState}
        onSelect={(v: string) => { setSelectedState(v); setSelectedDistrict(""); }}
        onClose={() => setStateSheet(false)}
        theme={theme}
        isDark={isDark}
      />
      <SelectSheet
        visible={distSheet}
        title="Select District"
        options={districtNames}
        selected={selectedDistrict}
        onSelect={setSelectedDistrict}
        onClose={() => setDistSheet(false)}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1 },
  scroll:     { padding: 20, paddingBottom: 40 },

  banner:     {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  bannerIcon: { fontSize: 16, fontWeight: "800" },
  bannerMsg:  { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  card:         { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 16 },

  field:     { marginBottom: 16 },
  label:     { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" },
  ro:        { fontSize: 8, fontWeight: "600", opacity: 0.5 },

  inputBox:  { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, justifyContent: "center" },
  inputText: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  selectBtn: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectTxt: { fontSize: 14, flex: 1 },

  errMsg:    { fontSize: 11, color: "#ef4444", marginTop: 5, fontWeight: "600" },

  footer:     { flexDirection: "row", gap: 12, marginTop: 8 },
  resetBtn:   { flex: 1, height: 52, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  resetText:  { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  submitBtn:  { flex: 2, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
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
