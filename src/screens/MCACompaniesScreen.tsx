import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, ScrollView, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const CLASS_FILTERS = [
  { label: "All",     value: "" },
  { label: "Private", value: "PRIV" },
  { label: "Public",  value: "PUB" },
];

// ─── State dropdown (top-level modal, no nesting) ─────────────────────────────
function StatePickerModal({ visible, states, value, onSelect, onClose, theme, insets }: any) {
  const [q, setQ] = useState("");
  const filtered = q ? states.filter((s: any) => s.name.toLowerCase().includes(q.toLowerCase())) : states;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[pk.wrap, { backgroundColor: theme.bg }]}>
        <View style={[pk.header, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card, paddingTop: Math.max(insets.top, 14) }]}>
          <TouchableOpacity onPress={onClose} style={pk.backBtn}>
            <Text style={[pk.backTxt, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[pk.title, { color: theme.text }]}>Select State</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={[pk.searchRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[pk.searchIcon, { color: theme.textMuted }]}>S</Text>
          <TextInput style={[pk.searchInput, { color: theme.text }]} placeholder="Search states..." placeholderTextColor={theme.textMuted} value={q} onChangeText={setQ} autoFocus />
          {q.length > 0 && <TouchableOpacity onPress={() => setQ("")}><Text style={{ color: theme.textMuted, fontSize: 16 }}>×</Text></TouchableOpacity>}
        </View>
        <FlatList
          data={[{ id: "", name: "All States" }, ...filtered]}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }: any) => {
            const sel = String(item.id) === String(value);
            return (
              <TouchableOpacity
                style={[pk.item, { borderColor: sel ? theme.primary + "60" : theme.cardBorder, backgroundColor: sel ? theme.primary + "08" : theme.card }]}
                onPress={() => { onSelect(item.id); onClose(); setQ(""); }}
              >
                <Text style={[pk.itemTxt, { color: sel ? theme.primary : theme.text, fontWeight: sel ? "700" : "500" }]}>{item.name}</Text>
                {sel && <View style={[pk.check, { backgroundColor: theme.primary }]}><Text style={pk.checkTxt}>✓</Text></View>}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MCACompaniesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [companies, setCompanies]     = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]           = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [stateFilterName, setStateFilterName] = useState("All States");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const searchTimer                   = useRef<any>(null);

  const [mcaStates, setMcaStates]     = useState<any[]>([]);
  const [statePickerOpen, setStatePickerOpen] = useState(false);

  const [detail, setDetail]           = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);

  const [convertModal, setConvertModal] = useState(false);
  const [products, setProducts]       = useState<any[]>([]);
  const [convertForm, setConvertForm] = useState({ productId: "", productName: "", remarks: "", name: "", cell: "", email: "" });
  const [converting, setConverting]   = useState(false);
  const [convertBanner, setConvertBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchStates(); fetchProducts(); fetchList("", "", "", 1);
  }, []);

  const fetchStates = async () => {
    const res = await api.get("/mca_api?submittype=states");
    if (res.success) setMcaStates(res.data);
  };

  const fetchProducts = async () => {
    const res = await api.get("/masters?submittype=products");
    if (res.success) setProducts(res.data);
  };

  const fetchList = useCallback(async (q: string, st: string, cl: string, pg: number, append = false) => {
    if (append) setLoadingMore(true); else { if (pg === 1) setLoading(true); }
    try {
      const res = await api.post("/mca_api", { submittype: "list", search: q, state: st, class: cl, page: pg, limit: 20 });
      if (res.success) {
        setCompanies(prev => append ? [...prev, ...(res.data || [])] : (res.data || []));
        setTotal(res.total || 0);
        setHasMore((res.data || []).length === 20);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); setRefreshing(false); }
  }, []);

  const handleSearch = (q: string) => {
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchList(q, stateFilter, classFilter, 1); }, 400);
  };

  const applyStateFilter = (id: string, name: string) => {
    setStateFilter(id); setStateFilterName(name || "All States"); setPage(1);
    fetchList(search, id, classFilter, 1);
  };

  const applyClassFilter = (cl: string) => {
    setClassFilter(cl); setPage(1);
    fetchList(search, stateFilter, cl, 1);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1; setPage(next);
    fetchList(search, stateFilter, classFilter, next, true);
  };

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchList(search, stateFilter, classFilter, 1); };

  const openDetail = async (id: string) => {
    setDetailVisible(true); setDetail(null); setDetailLoading(true);
    try {
      const res = await api.post("/mca_api", { submittype: "detail", id });
      if (res.success) setDetail(res.data);
    } finally { setDetailLoading(false); }
  };

  const resetConvert = () => {
    setConvertForm({ productId: "", productName: "", remarks: "", name: "", cell: "", email: "" });
    setConvertBanner(null);
  };

  const handleConvert = async () => {
    setConvertBanner(null);
    if (!convertForm.productId) { setConvertBanner({ type: "error", msg: "Please select a product." }); return; }
    setConverting(true);
    try {
      const res = await api.post("/mca_api", {
        submittype: "convert_lead",
        company_id: detail.id,
        productid:  convertForm.productId,
        remarks:    convertForm.remarks,
        name:       convertForm.name || detail.addname || "",
        company:    detail.company,
        address:    detail.addaddress || detail.address,
        place:      detail.addplace || detail.city,
        phone:      detail.addphone || "",
        cell:       convertForm.cell || detail.addcell || "",
        email:      convertForm.email || detail.addemailid || detail.emailid,
        source:     "MCA Registry",
        dealerid:   "mapping",
      });
      if (res.success) {
        setConvertBanner({ type: "success", msg: `Lead #${res.leadid || ""} created successfully!` });
        setTimeout(() => { setConvertModal(false); resetConvert(); }, 1500);
      } else setConvertBanner({ type: "error", msg: res.message || "Failed to convert." });
    } finally { setConverting(false); }
  };

  // ─── List card ───────────────────────────────────────────────────────────────
  const renderCard = ({ item }: any) => {
    const isPrivate = item.class === "PRIV";
    const typeColor = isPrivate ? "#6366f1" : "#10b981";
    const location  = [item.city, item.state].filter(Boolean).join(", ");
    const capital   = item.paidupcapital ? `₹ ${Number(item.paidupcapital).toLocaleString("en-IN")}` : null;
    return (
      <TouchableOpacity
        style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => openDetail(item.id)}
        activeOpacity={0.75}
      >
        <View style={[s.cardAccent, { backgroundColor: typeColor }]} />
        <View style={s.cardBody}>
          <View style={s.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={[s.companyName, { color: theme.text }]} numberOfLines={2}>{item.company}</Text>
              <Text style={[s.cinTxt, { color: theme.textMuted }]}>{item.cin}</Text>
            </View>
            <View style={[s.typeBadge, { backgroundColor: typeColor + "15", borderColor: typeColor + "30" }]}>
              <Text style={[s.typeTxt, { color: typeColor }]}>{isPrivate ? "PVT" : "PUB"}</Text>
            </View>
          </View>
          {(location || capital || item.incorporateddate) && (
            <View style={[s.cardFooter, { borderTopColor: theme.cardBorder }]}>
              {!!location && (
                <View style={s.metaChip}>
                  <View style={[s.metaDot, { backgroundColor: theme.textMuted + "60" }]} />
                  <Text style={[s.metaTxt, { color: theme.textMuted }]} numberOfLines={1}>{location}</Text>
                </View>
              )}
              {!!capital && (
                <View style={s.metaChip}>
                  <View style={[s.metaDot, { backgroundColor: theme.textMuted + "60" }]} />
                  <Text style={[s.metaTxt, { color: theme.textMuted }]}>{capital}</Text>
                </View>
              )}
              {!!item.incorporateddate && (
                <View style={s.metaChip}>
                  <View style={[s.metaDot, { backgroundColor: theme.textMuted + "60" }]} />
                  <Text style={[s.metaTxt, { color: theme.textMuted }]}>{item.incorporateddate}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <View style={[s.wrap, { backgroundColor: theme.bg }]}>

      {/* ── Search ── */}
      <View style={[s.searchWrap, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: theme.cardBorder }]}>
        <Text style={[s.searchIconTxt, { color: theme.textMuted }]}>Search</Text>
        <TextInput
          style={[s.searchInput, { color: theme.text }]}
          placeholder="Company, CIN, email..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")} style={s.clearBtn}>
            <Text style={{ color: theme.textMuted, fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filters ── */}
      <View style={s.filterRow}>
        {/* State picker button */}
        <TouchableOpacity
          style={[s.stateBtn, { borderColor: stateFilter ? theme.primary + "60" : theme.cardBorder, backgroundColor: stateFilter ? theme.primary + "08" : theme.card }]}
          onPress={() => setStatePickerOpen(true)}
        >
          <Text style={[s.stateBtnTxt, { color: stateFilter ? theme.primary : theme.textMuted }]} numberOfLines={1}>{stateFilterName}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 10, marginLeft: 4 }}>▾</Text>
        </TouchableOpacity>

        {/* Class filters */}
        <View style={s.classRow}>
          {CLASS_FILTERS.map(f => {
            const active = classFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[s.classChip, { borderColor: active ? theme.primary : theme.cardBorder, backgroundColor: active ? theme.primary : theme.card }]}
                onPress={() => applyClassFilter(f.value)}
              >
                <Text style={[s.classChipTxt, { color: active ? "#fff" : theme.textMuted }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Count */}
        <View style={[s.countBadge, { backgroundColor: theme.primary + "15" }]}>
          <Text style={[s.countTxt, { color: theme.primary }]}>{total.toLocaleString()}</Text>
        </View>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[s.loadTxt, { color: theme.textMuted }]}>Loading MCA Registry...</Text>
        </View>
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCard}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[s.emptyIconTxt, { color: theme.textMuted }]}>MCA</Text>
              </View>
              <Text style={[s.emptyTitle, { color: theme.text }]}>No companies found</Text>
              <Text style={[s.emptySub, { color: theme.textMuted }]}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}

      {/* ── State Picker Modal ── */}
      <StatePickerModal
        visible={statePickerOpen}
        states={mcaStates}
        value={stateFilter}
        onSelect={(id: string) => {
          const found = mcaStates.find((s: any) => String(s.id) === String(id));
          applyStateFilter(id, id ? (found?.name || id) : "All States");
        }}
        onClose={() => setStatePickerOpen(false)}
        theme={theme}
        insets={insets}
      />

      {/* ── Detail Modal ── */}
      <Modal visible={detailVisible} animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={[s.wrap, { backgroundColor: theme.bg }]}>
          <View style={[s.modalNav, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card, paddingTop: Math.max(insets.top, 14) }]}>
            <TouchableOpacity onPress={() => setDetailVisible(false)} style={s.navBack}>
              <Text style={[s.navBackTxt, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[s.navTitle, { color: theme.text }]}>Company Detail</Text>
            {detail ? (
              <TouchableOpacity style={[s.navAction, { backgroundColor: "#10b981" }]} onPress={() => setConvertModal(true)}>
                <Text style={s.navActionTxt}>Convert</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 70 }} />}
          </View>

          {detailLoading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[s.loadTxt, { color: theme.textMuted }]}>Loading details...</Text>
            </View>
          ) : detail ? (
            <ScrollView contentContainerStyle={s.detailScroll} showsVerticalScrollIndicator={false}>
              {/* Hero */}
              <View style={[s.detailHero, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[s.heroAccent, { backgroundColor: detail.class === "PRIV" ? "#6366f1" : "#10b981" }]} />
                <View style={s.heroContent}>
                  <Text style={[s.heroName, { color: theme.text }]}>{detail.company}</Text>
                  <Text style={[s.heroCin, { color: theme.textMuted }]}>CIN  {detail.cin}</Text>
                  <View style={s.heroBadges}>
                    {!!detail.class && (
                      <View style={[s.badge, { backgroundColor: "#6366f115", borderColor: "#6366f130" }]}>
                        <Text style={[s.badgeTxt, { color: "#6366f1" }]}>{detail.class}</Text>
                      </View>
                    )}
                    {!!detail.listingtype && (
                      <View style={[s.badge, { backgroundColor: theme.primary + "12", borderColor: theme.primary + "25" }]}>
                        <Text style={[s.badgeTxt, { color: theme.primary }]}>{detail.listingtype}</Text>
                      </View>
                    )}
                    {!!detail.category && (
                      <View style={[s.badge, { backgroundColor: "#f59e0b15", borderColor: "#f59e0b30" }]}>
                        <Text style={[s.badgeTxt, { color: "#f59e0b" }]}>{detail.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <SectionCard title="REGISTRATION" theme={theme}>
                <DataRow label="ROC Code"      value={detail.roccode}            theme={theme} />
                <DataRow label="Reg. Number"   value={detail.registrationnumber} theme={theme} />
                <DataRow label="Subcategory"   value={detail.subcategory}        theme={theme} />
                <DataRow label="Incorporated"  value={detail.incorporateddate}   theme={theme} />
                <DataRow label="AGM Date"      value={detail.agmdate}            theme={theme} />
                <DataRow label="Balance Sheet" value={detail.balancesheetdate}   theme={theme} last />
              </SectionCard>

              <SectionCard title="FINANCIALS" theme={theme}>
                <DataRow label="Authorised Capital" value={detail.authorisedcapital ? `₹ ${Number(detail.authorisedcapital).toLocaleString("en-IN")}` : null} theme={theme} />
                <DataRow label="Paid-up Capital"    value={detail.paidupcapital    ? `₹ ${Number(detail.paidupcapital).toLocaleString("en-IN")}` : null} theme={theme} last />
              </SectionCard>

              <SectionCard title="REGISTERED ADDRESS" theme={theme}>
                <DataRow label="Address" value={[detail.address1, detail.address2].filter(Boolean).join(" ") || detail.address} theme={theme} />
                <DataRow label="City"    value={detail.city}    theme={theme} />
                <DataRow label="State"   value={detail.state}   theme={theme} />
                <DataRow label="Pincode" value={detail.pincode} theme={theme} />
                <DataRow label="Email"   value={detail.emailid} theme={theme} last />
              </SectionCard>

              {detail.directors?.length > 0 && (
                <SectionCard title={`DIRECTORS  (${detail.directors.length})`} theme={theme}>
                  {detail.directors.map((d: any, i: number) => (
                    <View key={i} style={[s.dirItem, { borderBottomColor: theme.cardBorder }, i === detail.directors.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[s.dirName, { color: theme.text }]}>{d.dinname || "—"}</Text>
                      <View style={s.dirMeta}>
                        <View style={[s.badge, { backgroundColor: theme.primary + "10", borderColor: theme.primary + "20" }]}>
                          <Text style={[s.badgeTxt, { color: theme.primary }]}>{d.designation}</Text>
                        </View>
                        <Text style={[s.dirSub, { color: theme.textMuted }]}>DIN {d.din}</Text>
                        {!!d.appointmentdate && <Text style={[s.dirSub, { color: theme.textMuted }]}>{d.appointmentdate}</Text>}
                      </View>
                    </View>
                  ))}
                </SectionCard>
              )}

              {(detail.addname || detail.addcell || detail.addemailid) && (
                <SectionCard title="VERIFIED CONTACT" theme={theme} accent="#10b981">
                  <DataRow label="Contact"  value={detail.addname}     theme={theme} />
                  <DataRow label="Cell"     value={detail.addcell}     theme={theme} />
                  <DataRow label="Phone"    value={detail.addphone}    theme={theme} />
                  <DataRow label="Email"    value={detail.addemailid}  theme={theme} />
                  <DataRow label="Address"  value={detail.addaddress}  theme={theme} />
                  <DataRow label="Place"    value={detail.addplace}    theme={theme} />
                  <DataRow label="State"    value={detail.addstate}    theme={theme} />
                  <DataRow label="District" value={detail.adddistrict} theme={theme} last />
                </SectionCard>
              )}

              <View style={{ height: 48 }} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* ── Product Picker Modal (top-level, avoids nested Modal) ── */}
      <Modal visible={productPickerOpen} animationType="slide" onRequestClose={() => setProductPickerOpen(false)}>
        <View style={[s.wrap, { backgroundColor: theme.bg }]}>
          <View style={[s.modalNav, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card, paddingTop: Math.max(insets.top, 14) }]}>
            <TouchableOpacity onPress={() => setProductPickerOpen(false)} style={s.navBack}>
              <Text style={[s.navBackTxt, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[s.navTitle, { color: theme.text }]}>Select Product</Text>
            <View style={{ width: 70 }} />
          </View>
          <View style={[pk.searchRow, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: theme.cardBorder }]}>
            <Text style={[pk.searchIcon, { color: theme.textMuted }]}>S</Text>
            <TextInput style={[pk.searchInput, { color: theme.text }]} placeholder="Search products..." placeholderTextColor={theme.textMuted} value={productSearch} onChangeText={setProductSearch} autoFocus />
            {productSearch.length > 0 && <TouchableOpacity onPress={() => setProductSearch("")}><Text style={{ color: theme.textMuted, fontSize: 16 }}>×</Text></TouchableOpacity>}
          </View>
          <FlatList
            data={products.filter(p => !productSearch || (p.name || "").toLowerCase().includes(productSearch.toLowerCase()))}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }: any) => {
              const sel = String(item.id) === String(convertForm.productId);
              return (
                <TouchableOpacity
                  style={[pk.item, { borderColor: sel ? theme.primary + "60" : theme.cardBorder, backgroundColor: sel ? theme.primary + "08" : theme.card }]}
                  onPress={() => { setConvertForm(f => ({ ...f, productId: String(item.id), productName: item.name })); setProductPickerOpen(false); }}
                >
                  <Text style={[pk.itemTxt, { color: sel ? theme.primary : theme.text, fontWeight: sel ? "700" : "500" }]}>{item.name}</Text>
                  {sel && <View style={[pk.check, { backgroundColor: theme.primary }]}><Text style={pk.checkTxt}>✓</Text></View>}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={{ color: theme.textMuted, textAlign: "center", marginTop: 40, fontSize: 14 }}>No products found</Text>}
          />
        </View>
      </Modal>

      {/* ── Convert to Lead Modal ── */}
      <Modal visible={convertModal} animationType="slide" onRequestClose={() => { setConvertModal(false); resetConvert(); }}>
        <View style={[s.wrap, { backgroundColor: theme.bg }]}>
          <View style={[s.modalNav, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card, paddingTop: Math.max(insets.top, 14) }]}>
            <TouchableOpacity onPress={() => { setConvertModal(false); resetConvert(); }} style={s.navBack}>
              <Text style={[s.navBackTxt, { color: theme.primary }]}>← Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.navTitle, { color: theme.text }]}>Convert to Lead</Text>
            <View style={{ width: 70 }} />
          </View>

          <ScrollView contentContainerStyle={s.convertScroll} keyboardShouldPersistTaps="handled">
            {/* Company card */}
            <View style={[s.convertHero, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[s.heroAccent, { backgroundColor: "#10b981" }]} />
              <View style={s.heroContent}>
                <Text style={[s.heroName, { color: theme.text, fontSize: 15 }]}>{detail?.company}</Text>
                <Text style={[s.heroCin, { color: theme.textMuted }]}>CIN  {detail?.cin}</Text>
              </View>
            </View>

            {/* Banner */}
            {!!convertBanner && (
              <View style={[s.banner, convertBanner.type === "success"
                ? { backgroundColor: "#10b98112", borderColor: "#10b98135" }
                : { backgroundColor: "#ef444412", borderColor: "#ef444435" }]}>
                <View style={[s.bannerDot, { backgroundColor: convertBanner.type === "success" ? "#10b981" : "#ef4444" }]} />
                <Text style={[s.bannerMsg, { color: convertBanner.type === "success" ? "#10b981" : "#ef4444" }]}>{convertBanner.msg}</Text>
                <TouchableOpacity onPress={() => setConvertBanner(null)}>
                  <Text style={{ color: convertBanner.type === "success" ? "#10b981" : "#ef4444", fontSize: 18, lineHeight: 20 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[s.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[s.formCardTop, { backgroundColor: "#10b981" }]} />
              <View style={s.formCardBody}>
                {/* Product selector */}
                <View style={s.fieldWrap}>
                  <Text style={[s.fieldLabel, { color: theme.textMuted }]}>PRODUCT</Text>
                  <TouchableOpacity
                    style={[s.selectBtn, { borderColor: convertForm.productId ? theme.primary + "60" : theme.cardBorder, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}
                    onPress={() => { setProductSearch(""); setProductPickerOpen(true); }}
                  >
                    <Text style={[s.selectBtnTxt, { color: convertForm.productId ? theme.text : theme.textMuted }]} numberOfLines={1}>
                      {convertForm.productName || "Tap to select product..."}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>▾</Text>
                  </TouchableOpacity>
                </View>

                <FormField label="CONTACT PERSON" value={convertForm.name} onChange={(t: string) => setConvertForm(f => ({ ...f, name: t }))} placeholder={detail?.addname || "Full name..."} theme={theme} isDark={isDark} />
                <FormField label="CELL / MOBILE" value={convertForm.cell} onChange={(t: string) => setConvertForm(f => ({ ...f, cell: t }))} placeholder={detail?.addcell || "Mobile number..."} theme={theme} isDark={isDark} keyboard="phone-pad" />
                <FormField label="EMAIL" value={convertForm.email} onChange={(t: string) => setConvertForm(f => ({ ...f, email: t }))} placeholder={detail?.addemailid || detail?.emailid || "Email address..."} theme={theme} isDark={isDark} keyboard="email-address" />
                <FormField label="REMARKS" value={convertForm.remarks} onChange={(t: string) => setConvertForm(f => ({ ...f, remarks: t }))} placeholder="Notes or comments..." theme={theme} isDark={isDark} multiline />
              </View>
            </View>

            <TouchableOpacity
              style={[s.convertBtn, { backgroundColor: "#10b981" }, converting && { opacity: 0.6 }]}
              onPress={handleConvert}
              disabled={converting}
            >
              {converting ? <ActivityIndicator color="#fff" /> : <Text style={s.convertBtnTxt}>Create Lead</Text>}
            </TouchableOpacity>
            <View style={{ height: 48 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionCard({ title, children, theme, accent }: any) {
  return (
    <View style={[sc.card, { backgroundColor: theme.card, borderColor: accent ? accent + "30" : theme.cardBorder }]}>
      <Text style={[sc.title, { color: accent || theme.primary }]}>{title}</Text>
      {children}
    </View>
  );
}

function DataRow({ label, value, theme, last = false }: any) {
  if (!value) return null;
  return (
    <View style={[sc.row, !last && { borderBottomColor: theme.cardBorder, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[sc.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[sc.value, { color: theme.text }]} selectable>{value}</Text>
    </View>
  );
}

function FormField({ label, value, onChange, placeholder, theme, isDark, keyboard = "default", multiline = false }: any) {
  return (
    <View style={ff.wrap}>
      <Text style={[ff.label, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        style={[ff.input, { borderColor: theme.cardBorder, backgroundColor: isDark ? "#0f172a" : "#f8fafc", color: theme.text, height: multiline ? 80 : 48, textAlignVertical: multiline ? "top" : "center" }]}
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
  wrap:        { flex: 1 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadTxt:     { fontSize: 13, fontWeight: "500" },

  searchWrap:  { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 46 },
  searchIconTxt:{ fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  clearBtn:    { paddingHorizontal: 4 },

  filterRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  stateBtn:    { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 130 },
  stateBtnTxt: { fontSize: 12, fontWeight: "600", flex: 1 },
  classRow:    { flexDirection: "row", gap: 6 },
  classChip:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  classChipTxt:{ fontSize: 11, fontWeight: "700" },
  countBadge:  { marginLeft: "auto" as any, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  countTxt:    { fontSize: 11, fontWeight: "800" },

  list:        { paddingHorizontal: 16, paddingBottom: 100 },

  card:        { borderRadius: 14, borderWidth: 1, marginBottom: 10, flexDirection: "row", overflow: "hidden" },
  cardAccent:  { width: 4 },
  cardBody:    { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardHead:    { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  companyName: { fontSize: 14, fontWeight: "700", marginBottom: 3, lineHeight: 20 },
  cinTxt:      { fontSize: 11, fontWeight: "500", letterSpacing: 0.3 },
  typeBadge:   { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  typeTxt:     { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  cardFooter:  { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  metaChip:    { flexDirection: "row", alignItems: "center", gap: 5 },
  metaDot:     { width: 4, height: 4, borderRadius: 2 },
  metaTxt:     { fontSize: 11, fontWeight: "500" },

  empty:       { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyIconTxt:{ fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  emptyTitle:  { fontSize: 16, fontWeight: "700" },
  emptySub:    { fontSize: 13 },

  modalNav:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  navBack:     { minWidth: 70 },
  navBackTxt:  { fontSize: 15, fontWeight: "700" },
  navTitle:    { fontSize: 16, fontWeight: "700" },
  navAction:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  navActionTxt:{ color: "#fff", fontSize: 13, fontWeight: "800" },

  detailScroll:{ padding: 16 },
  detailHero:  { borderRadius: 14, borderWidth: 1, marginBottom: 12, flexDirection: "row", overflow: "hidden" },
  heroAccent:  { width: 4 },
  heroContent: { flex: 1, padding: 14 },
  heroName:    { fontSize: 17, fontWeight: "800", marginBottom: 6, lineHeight: 24 },
  heroCin:     { fontSize: 12, fontWeight: "500", letterSpacing: 0.3, marginBottom: 10 },
  heroBadges:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge:       { borderRadius: 5, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:    { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },

  dirItem:     { paddingVertical: 12, borderBottomWidth: 1 },
  dirName:     { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  dirMeta:     { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  dirSub:      { fontSize: 11, fontWeight: "500" },

  convertScroll: { padding: 16 },
  convertHero: { borderRadius: 14, borderWidth: 1, marginBottom: 14, flexDirection: "row", overflow: "hidden" },

  banner:      { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
  bannerDot:   { width: 8, height: 8, borderRadius: 4 },
  bannerMsg:   { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  formCard:    { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  formCardTop: { height: 3 },
  formCardBody:{ padding: 16 },
  fieldWrap:   { marginBottom: 14 },
  fieldLabel:  { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 6 },
  selectBtn:   { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  selectBtnTxt:{ flex: 1, fontSize: 14, fontWeight: "500" },

  convertBtn:  { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  convertBtnTxt:{ color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
});

const sc = StyleSheet.create({
  card:  { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  title: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 10 },
  row:   { flexDirection: "row", paddingVertical: 10 },
  label: { fontSize: 11, fontWeight: "700", width: 110, textTransform: "uppercase", letterSpacing: 0.3 },
  value: { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 18 },
});

const pk = StyleSheet.create({
  wrap:      { flex: 1 },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:   { minWidth: 60 },
  backTxt:   { fontSize: 15, fontWeight: "700" },
  title:     { fontSize: 16, fontWeight: "700" },
  searchRow: { flexDirection: "row", alignItems: "center", margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 46 },
  searchIcon:{ fontSize: 11, fontWeight: "900", letterSpacing: 0.5, marginRight: 10 },
  searchInput:{ flex: 1, fontSize: 14 },
  item:      { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  itemTxt:   { flex: 1, fontSize: 14, lineHeight: 20 },
  check:     { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  checkTxt:  { color: "#fff", fontSize: 11, fontWeight: "900" },
});

const ff = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14, fontWeight: "500", paddingTop: 12 },
});
