import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Switch,
  Modal, FlatList, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const REFERENCES = [
  "Manual Upload", "Online", "Ref-Customer",
  "Seminar", "Exhibition", "Direct", "Other",
];

// ─── Reusable searchable dropdown ────────────────────────────────────────────
function Dropdown({
  label, value, placeholder, options, onSelect,
  disabled = false, loading = false,
  searchable = false, onSearch, searchValue = "",
  onEndReached, loadingMore = false, required = false,
}: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = options.find((o: any) => String(o.id ?? o) === String(value));
  const displayName = selected
    ? (selected.name || selected.productname || selected.label || selected)
    : null;

  return (
    <View style={[dd.wrap, disabled && { opacity: 0.45 }]}>
      <Text style={[dd.label, { color: theme.textMuted }]}>
        {label}{required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>

      <TouchableOpacity
        disabled={disabled}
        style={[dd.btn, { borderColor: value ? theme.primary + "70" : theme.cardBorder, backgroundColor: theme.card }]}
        onPress={() => setOpen(true)}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
        ) : (
          <Text style={[dd.btnTxt, { color: displayName ? theme.text : theme.textMuted }]} numberOfLines={1}>
            {displayName ?? placeholder ?? `Select ${label}...`}
          </Text>
        )}
        <Text style={[dd.arrow, { color: theme.textMuted }]}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[dd.modal, { backgroundColor: theme.bg }]}>
          {/* Modal header */}
          <View style={[dd.modalHeader, { borderBottomColor: theme.cardBorder, paddingTop: Math.max(insets.top, 16) }]}>
            <Text style={[dd.modalTitle, { color: theme.text }]}>Select {label}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 15 }}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          {searchable && (
            <View style={[dd.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={{ fontSize: 16, color: theme.textMuted, marginRight: 6 }}>⌕</Text>
              <TextInput
                style={[dd.searchInput, { color: theme.text }]}
                placeholder={`Search ${label}...`}
                placeholderTextColor={theme.textMuted}
                value={searchValue}
                onChangeText={onSearch}
                autoFocus
              />
              {searchValue?.length > 0 && (
                <TouchableOpacity onPress={() => onSearch?.("")}>
                  <Text style={{ color: theme.textMuted }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <FlatList
            data={options}
            keyExtractor={(item: any, i) => String(item.id ?? item ?? i)}
            contentContainerStyle={{ padding: 16 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore
              ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
              : null
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Text style={{ color: theme.textMuted }}>No options found</Text>
              </View>
            }
            renderItem={({ item }: any) => {
              const id   = item.id ?? item;
              const name = item.name || item.productname || item.label || item;
              const sel  = String(id) === String(value);
              return (
                <TouchableOpacity
                  style={[dd.item, { borderColor: sel ? theme.primary + "60" : theme.cardBorder, backgroundColor: sel ? theme.primary + "10" : theme.card }]}
                  onPress={() => { onSelect(id, item); setOpen(false); }}
                >
                  <Text style={[dd.itemTxt, { color: sel ? theme.primary : theme.text, fontWeight: sel ? "700" : "500" }]} numberOfLines={2}>
                    {name}
                  </Text>
                  {sel && <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function UploadLeadsScreen() {
  const { theme } = useTheme();
  const { currentUser } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Data lists
  const [states, setStates]       = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions]     = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [dealers, setDealers]     = useState<any[]>([]);
  const [dealerPage, setDealerPage]   = useState(1);
  const [dealerMore, setDealerMore]   = useState(true);
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerLoading, setDealerLoading] = useState(false);
  const [dealerLoadingMore, setDealerLoadingMore] = useState(false);
  const dealerTimer = useRef<any>(null);

  // Loading flags
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingRegions, setLoadingRegions]     = useState(false);

  // Form
  const emptyForm = {
    companyName: "", contactPerson: "", address: "",
    state: "", stateName: "",
    district: "", districtName: "",
    regionid: "", regionName: "",
    place: "", stdCode: "", landline: "", cell: "",
    email: "", productId: "", productName: "",
    reference: "Manual Upload",
    asPerMapping: true, dealerId: "", dealerName: "",
    remarks: "", website: "",
  };
  const [form, setForm] = useState({ ...emptyForm });

  // ── Initial load ──
  useEffect(() => {
    Promise.all([
      api.get("/mapping_api?submittype=getstates"),
      api.get("/masters?submittype=products"),
    ]).then(([sRes, pRes]) => {
      if (sRes.success) setStates(sRes.data);
      if (pRes.success) setProducts(pRes.data);
    });
    loadDealers("", 1);
  }, []);

  // ── Load districts when state changes ──
  useEffect(() => {
    if (!form.state) { setDistricts([]); setRegions([]); return; }
    setLoadingDistricts(true);
    api.get(`/mapping_api?submittype=getdistricts&statecode=${form.state}`)
      .then(res => { if (res.success) setDistricts(res.data); })
      .finally(() => setLoadingDistricts(false));
  }, [form.state]);

  // ── Load regions when district changes ──
  useEffect(() => {
    if (!form.district) { setRegions([]); return; }
    setLoadingRegions(true);
    api.get(`/mapping_api?submittype=get_regions&distcode=${form.district}`)
      .then(res => { if (res.success) setRegions(res.data); })
      .finally(() => setLoadingRegions(false));
  }, [form.district]);

  // ── Dealers with search + pagination ──
  const loadDealers = async (q: string, pg: number, append = false) => {
    if (append) setDealerLoadingMore(true); else setDealerLoading(true);
    try {
      const res = await api.post("/mapping_api", {
        submittype: "get_dealers", search: q, page: pg, perpage: 25,
      });
      if (res.success && res.data) {
        setDealers(prev => append ? [...prev, ...res.data] : res.data);
        setDealerMore(res.data.length === 25);
      }
    } finally {
      setDealerLoading(false);
      setDealerLoadingMore(false);
    }
  };

  const handleDealerSearch = (q: string) => {
    setDealerSearch(q);
    clearTimeout(dealerTimer.current);
    dealerTimer.current = setTimeout(() => {
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

  // ── Submit ──
  const handleSubmit = async () => {
    setBanner(null);
    if (!form.companyName || !form.contactPerson || !form.cell || !form.productId) {
      setBanner({ type: "error", msg: "Please fill required fields: Company, Contact, Cell, and Product." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/leads", {
        submittype: "save",
        company:   form.companyName,
        name:      form.contactPerson,
        email:     form.email,
        cell:      form.cell,
        address:   form.address,
        regionid:  form.regionid,
        state:     form.state,
        district:  form.district,
        place:     form.place,
        productid: form.productId,
        source:    form.reference,
        refer:     form.reference,
        dealerid:  form.asPerMapping ? "mapping" : form.dealerId,
        remarks:   form.remarks,
        phone:     form.landline,
        stdcode:   form.stdCode,
        website:   form.website,
      });
      if (res.success) {
        setBanner({ type: "success", msg: `Lead created successfully! ID: ${res.leadid || ""}` });
        setForm({ ...emptyForm });
        setDistricts([]);
        setRegions([]);
      } else {
        setBanner({ type: "error", msg: res.message || "Failed to create lead." });
      }
    } catch {
      setBanner({ type: "error", msg: "Network request failed." });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[s.wrap, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Basic Info ── */}
        <SectionCard title="BASIC INFORMATION" theme={theme}>
          <Field label="Company Name" required value={form.companyName} onChange={t => setForm({ ...form, companyName: t })} placeholder="e.g. Acme Corp" theme={theme} />
          <Field label="Contact Person" required value={form.contactPerson} onChange={t => setForm({ ...form, contactPerson: t })} placeholder="John Doe" theme={theme} />
          <Field label="Address" value={form.address} onChange={t => setForm({ ...form, address: t })} placeholder="Full address" theme={theme} />

          <Dropdown
            label="State" required
            value={form.state}
            options={states}
            onSelect={(_: any, item: any) => setForm({ ...form, state: String(item.id), stateName: item.name, district: "", districtName: "", regionid: "", regionName: "" })}
            searchable
          />

          <Dropdown
            label="District"
            value={form.district}
            options={districts}
            disabled={!form.state}
            loading={loadingDistricts}
            onSelect={(_: any, item: any) => setForm({ ...form, district: String(item.id), districtName: item.name, regionid: "", regionName: "" })}
            searchable
          />

          <Dropdown
            label="Region / Sub-District"
            value={form.regionid}
            options={regions}
            disabled={!form.district}
            loading={loadingRegions}
            onSelect={(_: any, item: any) => setForm({ ...form, regionid: String(item.id), regionName: item.name })}
            searchable
          />

          <Field label="Place / Locality" value={form.place} onChange={t => setForm({ ...form, place: t })} placeholder="Specific area" theme={theme} />
        </SectionCard>

        {/* ── Contact Details ── */}
        <SectionCard title="CONTACT DETAILS" theme={theme}>
          <View style={s.row}>
            <View style={{ width: 80, marginRight: 10 }}>
              <Field label="STD" value={form.stdCode} onChange={t => setForm({ ...form, stdCode: t })} placeholder="080" theme={theme} keyboard="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Landline" value={form.landline} onChange={t => setForm({ ...form, landline: t })} placeholder="2319XXXX" theme={theme} keyboard="number-pad" />
            </View>
          </View>
          <Field label="Mobile / Cell" required value={form.cell} onChange={t => setForm({ ...form, cell: t })} placeholder="9449XXXXXX" theme={theme} keyboard="phone-pad" />
          <Field label="Email" value={form.email} onChange={t => setForm({ ...form, email: t })} placeholder="example@mail.com" theme={theme} keyboard="email-address" />
          <Field label="Website" value={form.website} onChange={t => setForm({ ...form, website: t })} placeholder="https://..." theme={theme} keyboard="url" />
        </SectionCard>

        {/* ── Assignment ── */}
        <SectionCard title="ASSIGNMENT" theme={theme}>
          <Dropdown
            label="Product" required
            value={form.productId}
            options={products}
            onSelect={(_: any, item: any) => setForm({ ...form, productId: String(item.id), productName: item.productname || item.name })}
            searchable
          />

          <Dropdown
            label="Reference Source"
            value={form.reference}
            options={REFERENCES.map(r => ({ id: r, name: r }))}
            onSelect={(id: string) => setForm({ ...form, reference: id })}
          />

          <View style={[s.switchRow, { borderTopColor: theme.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.switchLabel, { color: theme.text }]}>Auto-assign as per mapping</Text>
              <Text style={[s.switchSub, { color: theme.textMuted }]}>Assign dealer based on region</Text>
            </View>
            <Switch
              value={form.asPerMapping}
              onValueChange={v => setForm({ ...form, asPerMapping: v, dealerId: "", dealerName: "" })}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#fff"
            />
          </View>

          {!form.asPerMapping && (
            <Dropdown
              label="Dealer"
              value={form.dealerId}
              options={dealers}
              loading={dealerLoading}
              loadingMore={dealerLoadingMore}
              onSelect={(_: any, item: any) => setForm({ ...form, dealerId: String(item.id), dealerName: item.name || item.contactPerson })}
              searchable
              searchValue={dealerSearch}
              onSearch={handleDealerSearch}
              onEndReached={loadMoreDealers}
            />
          )}

          <Field label="Internal Remarks" value={form.remarks} onChange={t => setForm({ ...form, remarks: t })} placeholder="Any notes..." theme={theme} multiline />
        </SectionCard>

        {/* ── Banner ── */}
        {!!banner && (
          <View style={[s.banner, banner.type === "success"
            ? { backgroundColor: "#10b98115", borderColor: "#10b98140" }
            : { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: banner.type === "success" ? "#10b981" : "#ef4444" }}>
              {banner.type === "success" ? "✓" : "✕"}
            </Text>
            <Text style={[s.bannerMsg, { color: banner.type === "success" ? "#10b981" : "#ef4444" }]}>{banner.msg}</Text>
            <TouchableOpacity onPress={() => setBanner(null)}>
              <Text style={{ color: banner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <TouchableOpacity style={[s.resetBtn, { borderColor: theme.cardBorder }]} onPress={() => { setForm({ ...emptyForm }); setDistricts([]); setRegions([]); setBanner(null); }}>
            <Text style={[s.resetTxt, { color: theme.textMuted }]}>RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.submitBtn, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.submitTxt}>SAVE LEAD</Text>
            }
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionCard({ title, children, theme }: any) {
  return (
    <View style={[sc.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[sc.title, { color: theme.primary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, theme, keyboard = "default", required = false, multiline = false }: any) {
  return (
    <View style={fi.wrap}>
      <Text style={[fi.label, { color: theme.textMuted }]}>
        {label}{required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <TextInput
        style={[fi.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg, height: multiline ? 80 : 46, textAlignVertical: multiline ? "top" : "center" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboard}
        multiline={multiline}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrap:       { flex: 1 },
  scroll:     { padding: 16, paddingBottom: 40 },
  row:        { flexDirection: "row" },
  switchRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, marginTop: 4, gap: 12 },
  switchLabel:{ fontSize: 14, fontWeight: "600" },
  switchSub:  { fontSize: 11, marginTop: 2 },
  banner:     { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  bannerMsg:  { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  footer:     { flexDirection: "row", gap: 12, marginTop: 8 },
  resetBtn:   { flex: 1, height: 52, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  resetTxt:   { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  submitBtn:  { flex: 2, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", elevation: 3 },
  submitTxt:  { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
});

const sc = StyleSheet.create({
  card:  { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14, gap: 2 },
  title: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 14 },
});

const fi = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, paddingTop: 12 },
});

const dd = StyleSheet.create({
  wrap:        { marginBottom: 14 },
  label:       { fontSize: 11, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  btn:         { flexDirection: "row", alignItems: "center", height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12 },
  btnTxt:      { flex: 1, fontSize: 14 },
  arrow:       { fontSize: 11, marginLeft: 6 },
  modal:       { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 17, fontWeight: "700" },
  searchBox:   { flexDirection: "row", alignItems: "center", margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14 },
  item:        { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  itemTxt:     { flex: 1, fontSize: 14 },
});
