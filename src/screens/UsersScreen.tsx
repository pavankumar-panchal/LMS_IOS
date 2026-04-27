import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, ScrollView, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

// ─── Reusable searchable dropdown (local) ─────────────────────────────────────
function DropdownField({ label, value, displayValue, placeholder, options, onSelect, disabled = false, loading = false, required = false }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? options.filter((o: any) => (o.name || "").toLowerCase().includes(q.toLowerCase()))
    : options;
  return (
    <View style={{ opacity: disabled ? 0.45 : 1 }}>
      <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>
        {label}{required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        style={[cS.input, { justifyContent: "space-between", flexDirection: "row", alignItems: "center", borderColor: value ? theme.primary + "70" : theme.cardBorder, backgroundColor: theme.card }]}
        onPress={() => { setQ(""); setOpen(true); }}
      >
        {loading
          ? <ActivityIndicator size="small" color={theme.primary} />
          : <Text style={{ color: displayValue ? theme.text : theme.textMuted + "99", fontSize: 14, flex: 1 }} numberOfLines={1}>{displayValue || placeholder || `Select ${label}…`}</Text>}
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={[df.header, { borderBottomColor: theme.cardBorder, paddingTop: Math.max(insets.top, 16) }]}>
            <Text style={[df.title, { color: theme.text }]}>Select {label}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 15 }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={[df.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={{ color: theme.textMuted, marginRight: 6 }}>⌕</Text>
            <TextInput style={[df.searchInput, { color: theme.text }]}
              placeholder={`Search ${label}…`} placeholderTextColor={theme.textMuted}
              value={q} onChangeText={setQ} autoFocus />
            {q.length > 0 && <TouchableOpacity onPress={() => setQ("")}><Text style={{ color: theme.textMuted }}>✕</Text></TouchableOpacity>}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item: any, i) => String(item.id ?? i)}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<View style={{ alignItems: "center", marginTop: 60 }}><Text style={{ color: theme.textMuted }}>No results</Text></View>}
            renderItem={({ item }: any) => {
              const sel = String(item.id) === String(value);
              return (
                <TouchableOpacity
                  style={[df.item, { borderColor: sel ? theme.primary + "60" : theme.cardBorder, backgroundColor: sel ? theme.primary + "10" : theme.card }]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={{ color: sel ? theme.primary : theme.text, fontWeight: sel ? "700" : "500", fontSize: 14 }} numberOfLines={2}>{item.name}</Text>
                  {sel && <Text style={{ color: theme.primary, fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
const df = StyleSheet.create({
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  title:     { fontSize: 17, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, gap: 6 },
  searchInput:{ flex: 1, fontSize: 14 },
  item:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});

const ROLE_COLORS: Record<string, string> = {
  admin: "#6366f1", subadmin: "#8b5cf6", dealer: "#f97316",
  dealer_member: "#06b6d4", reporting_authority: "#f59e0b",
  manager: "#8b5cf6", sales: "#10b981", campaign_master: "#ef4444",
};
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", subadmin: "Sub-Admin", dealer: "Dealer",
  dealer_member: "Dealer Member", reporting_authority: "LMS RA",
  manager: "Manager", sales: "Sales Rep", campaign_master: "Campaign Master",
};

const CREATABLE_ROLES = [
  { value: "admin",               label: "Admin" },
  { value: "subadmin",            label: "Sub-Admin" },
  { value: "reporting_authority", label: "Reporting Authority" },
  { value: "manager",             label: "Manager" },
  { value: "dealer",              label: "Dealer" },
  { value: "dealer_member",       label: "Dealer Member" },
  { value: "sales",               label: "Sales Rep" },
  { value: "campaign_master",     label: "Campaign Master" },
];

function UserCard({ user, onPress, onToggle, canEdit, currentUserId }: any) {
  const { theme } = useTheme();
  const color    = ROLE_COLORS[user.role] || theme.primary;
  const label    = ROLE_LABELS[user.role] || user.role;
  const isActive = user.status === "active";
  const isDealer = user.role === "dealer" || user.role === "dealer_member";

  // Role-aware display fields
  const displayName    = isDealer ? (user.company || user.name || "—") : (user.name || "—");
  const displaySub     = isDealer ? (user.dlrname || user.email || "—") : (user.email || "—");
  const footerCol1Lbl  = isDealer ? "STATE"  : "DEPT";
  const footerCol1Val  = isDealer ? (user.state    || "—") : (user.department || "—");
  const footerCol2Lbl  = isDealer ? "DISTRICT" : "BRANCH";
  const footerCol2Val  = isDealer ? (user.district || "—") : (user.branch     || "—");
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <TouchableOpacity
      style={[uS.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[uS.bar, { backgroundColor: color }]} />
      <View style={uS.content}>
        <View style={uS.top}>
          <View style={[uS.avatar, { backgroundColor: color + "18" }]}>
            <Text style={[uS.avatarText, { color }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[uS.name, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
              {user.id === currentUserId && (
                <View style={[uS.youBadge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
                  <Text style={[uS.youText, { color }]}>YOU</Text>
                </View>
              )}
            </View>
            <Text style={[uS.email, { color: theme.textMuted }]} numberOfLines={1}>{displaySub}</Text>
          </View>
          <View style={[uS.roleBadge, { backgroundColor: color + "15", borderColor: color + "30" }]}>
            <Text style={[uS.roleText, { color }]}>{label.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[uS.footer, { borderTopColor: theme.cardBorder }]}>
          <View style={uS.metaItem}>
            <Text style={[uS.metaLabel, { color: theme.textMuted }]}>{footerCol1Lbl}</Text>
            <Text style={[uS.metaVal, { color: theme.textSecondary }]} numberOfLines={1}>{footerCol1Val}</Text>
          </View>
          <View style={uS.metaItem}>
            <Text style={[uS.metaLabel, { color: theme.textMuted }]}>{footerCol2Lbl}</Text>
            <Text style={[uS.metaVal, { color: theme.textSecondary }]} numberOfLines={1}>{footerCol2Val}</Text>
          </View>
          <View style={uS.statusRow}>
            <Switch
              value={isActive}
              onValueChange={() => canEdit && user.id !== currentUserId && onToggle(user.id)}
              trackColor={{ false: "#e2e8f0", true: "#10b981" }}
              thumbColor="#fff"
              disabled={!canEdit || user.id === currentUserId}
            />
            <Text style={[uS.statusText, { color: isActive ? "#10b981" : "#ef4444" }]}>
              {isActive ? "Active" : "Disabled"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
const EMPTY_FIELDS = {
  name:"", profileEmail:"", cell:"", phone:"", company:"", address:"", website:"",
  stateName:"", stateid:"", districtName:"", districtid:"",
  location:"", branch:"", managedarea:"", managedStateName:"", managedStateid:"",
  dealerid:"", dealerName:"", remarks:"",
};

function CreateUserModal({ visible, onClose, onCreated, theme, isDark }: any) {
  const insets = useSafeAreaInsets();
  const [email, setEmail]     = useState("");
  const [password, setPw]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole]       = useState("sales");
  const [showPw, setShowPw]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [formBanner, setFormBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [f, setF]             = useState({ ...EMPTY_FIELDS });

  // State / District lists
  const [states, setStates]           = useState<any[]>([]);
  const [districts, setDistricts]     = useState<any[]>([]);
  const [loadingStates, setLoadingStates]   = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Dealer picker for dealer_member
  const [showDlrPicker, setShowDlrPicker] = useState(false);
  const [dlrSearch, setDlrSearch]         = useState("");
  const [dlrList, setDlrList]             = useState<any[]>([]);
  const [dlrLoading, setDlrLoading]       = useState(false);
  const dlrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fld = (updates: Partial<typeof EMPTY_FIELDS>) => setF(p => ({ ...p, ...updates }));

  // Load states once when modal opens
  useEffect(() => {
    if (!visible) return;
    setLoadingStates(true);
    api.get("/mapping_api?submittype=getstates")
      .then((res: any) => setStates(res?.data || res?.states || []))
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, [visible]);

  // Load districts when state changes
  useEffect(() => {
    if (!f.stateid) { setDistricts([]); return; }
    setLoadingDistricts(true);
    api.get(`/mapping_api?submittype=getdistricts&statecode=${f.stateid}`)
      .then((res: any) => setDistricts(res?.data || res?.districts || []))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [f.stateid]);

  const fetchDealers = async (q = "") => {
    setDlrLoading(true);
    try {
      const res = await api.get(`/users?limit=20&offset=0&search=${encodeURIComponent(q)}&role=dealer`);
      if (res?.success) setDlrList(res.data || []);
    } catch {}
    setDlrLoading(false);
  };

  useEffect(() => {
    if (!showDlrPicker) return;
    if (dlrTimer.current) clearTimeout(dlrTimer.current);
    dlrTimer.current = setTimeout(() => fetchDealers(dlrSearch), 400);
  }, [dlrSearch, showDlrPicker]);

  const reset = () => {
    setEmail(""); setPw(""); setConfirm(""); setRole("sales"); setShowPw(false);
    setF({ ...EMPTY_FIELDS }); setDistricts([]);
  };

  const handleCreate = async () => {
    setFormBanner(null);
    if (!email.trim() || !password) { setFormBanner({ type: "error", msg: "Login email and password are required." }); return; }
    if (password.length < 6) { setFormBanner({ type: "error", msg: "Password must be at least 6 characters." }); return; }
    if (password !== confirm) { setFormBanner({ type: "error", msg: "Passwords do not match." }); return; }
    if (role === "dealer" && !f.company.trim()) { setFormBanner({ type: "error", msg: "Company name is required for Dealer." }); return; }
    if (role === "dealer_member" && !f.dealerid) { setFormBanner({ type: "error", msg: "Please select a Dealer for this member." }); return; }

    setSaving(true);
    try {
      const payload: any = {
        email: email.trim(), password, role, status: "active",
        name: f.name, profile_email: f.profileEmail, cell: f.cell, phone: f.phone,
        company: f.company, address: f.address, website: f.website,
        state: f.stateName, stateid: f.stateid,
        district: f.districtName, districtid: f.districtid,
        location: f.location, branch: f.branch,
        managedarea: f.managedarea, branchhead: f.branchhead,
        dealerid: f.dealerid, remarks: f.remarks,
      };
      const res = await api.post("/users", payload);
      if (res.success) {
        setFormBanner({ type: "success", msg: "User account created successfully." });
        setTimeout(() => { reset(); onCreated(res.data); onClose(); }, 1000);
      } else {
        setFormBanner({ type: "error", msg: res.message || "Failed to create user." });
      }
    } catch (e: any) {
      setFormBanner({ type: "error", msg: e.message || "Network error." });
    }
    setSaving(false);
  };

  const inp = [cS.input, { backgroundColor: isDark ? "#1e293b" : "#fff", color: theme.text, borderColor: theme.cardBorder }];
  const isDealer   = role === "dealer";
  const isDlrMbr   = role === "dealer_member";
  const isMgr      = role === "manager" || role === "reporting_authority";
  const isSubAdmin  = role === "subadmin";
  const hasProfile  = isDealer || isDlrMbr || isMgr || isSubAdmin;
  const roleColor  = ROLE_COLORS[role] || theme.primary;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Header */}
        <View style={[cS.modalHeader, { borderBottomColor: theme.cardBorder, paddingTop: Math.max(insets.top, 20) }]}>
          <View>
            <Text style={[cS.modalTitle, { color: theme.text }]}>Create User</Text>
            <Text style={[cS.modalSub, { color: theme.textMuted }]}>Add a new user account</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[cS.closeBtn, { backgroundColor: theme.cardBorder }]}>
            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={cS.modalBody} keyboardShouldPersistTaps="handled">

          {/* ── Banner ── */}
          {!!formBanner && (
            <View style={[cS.banner, formBanner.type === "success"
              ? { backgroundColor: "#10b98115", borderColor: "#10b98140" }
              : { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: formBanner.type === "success" ? "#10b981" : "#ef4444" }}>
                {formBanner.type === "success" ? "✓" : "✕"}
              </Text>
              <Text style={[cS.bannerMsg, { color: formBanner.type === "success" ? "#10b981" : "#ef4444" }]}>{formBanner.msg}</Text>
              <TouchableOpacity onPress={() => setFormBanner(null)}>
                <Text style={{ color: formBanner.type === "success" ? "#10b981" : "#ef4444", fontSize: 16 }}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Login Credentials ── */}
          <View style={[cS.section, { borderColor: theme.cardBorder }]}>
            <Text style={[cS.sectionTitle, { color: theme.textMuted }]}>LOGIN CREDENTIALS</Text>

            <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>LOGIN EMAIL / USERNAME</Text>
            <TextInput style={inp} value={email} onChangeText={setEmail} placeholder="login@example.com"
              placeholderTextColor={theme.textMuted + "80"} keyboardType="email-address" autoCapitalize="none" />

            <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>PASSWORD</Text>
            <View style={cS.pwRow}>
              <TextInput style={[inp, { flex: 1 }]} value={password} onChangeText={setPw}
                placeholder="Min. 6 characters" placeholderTextColor={theme.textMuted + "80"} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={[cS.eyeBtn, { borderColor: theme.cardBorder, backgroundColor: isDark ? "#1e293b" : "#fff" }]}>
                <Text style={{ color: theme.textMuted, fontSize: 16 }}>{showPw ? "🙈" : "👁"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>CONFIRM PASSWORD</Text>
            <TextInput style={inp} value={confirm} onChangeText={setConfirm}
              placeholder="Repeat password" placeholderTextColor={theme.textMuted + "80"} secureTextEntry={!showPw} />
          </View>

          {/* ── Role ── */}
          <View style={[cS.section, { borderColor: theme.cardBorder }]}>
            <Text style={[cS.sectionTitle, { color: theme.textMuted }]}>ROLE</Text>
            <View style={cS.roleGrid}>
              {CREATABLE_ROLES.map(r => {
                const sel = role === r.value;
                const rc  = ROLE_COLORS[r.value] || theme.primary;
                return (
                  <TouchableOpacity key={r.value}
                    style={[cS.roleChip, { borderColor: sel ? rc : theme.cardBorder, backgroundColor: sel ? rc + "15" : theme.card }]}
                    onPress={() => setRole(r.value)}>
                    <Text style={[cS.roleChipText, { color: sel ? rc : theme.textMuted }]}>{r.label.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Profile Fields (role-specific) ── */}
          {hasProfile && (
            <View style={[cS.section, { borderColor: roleColor + "40", backgroundColor: roleColor + "05" }]}>
              <Text style={[cS.sectionTitle, { color: roleColor }]}>
                {isDealer ? "DEALER PROFILE" : isDlrMbr ? "MEMBER PROFILE" : isMgr ? "MANAGER PROFILE" : "SUB-ADMIN PROFILE"}
              </Text>

              {/* Company Name — Dealer only */}
              {isDealer && (<>
                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>COMPANY NAME <Text style={{ color: "#ef4444" }}>*</Text></Text>
                <TextInput style={inp} value={f.company} onChangeText={v => fld({ company: v })} placeholder="Company / Firm name" placeholderTextColor={theme.textMuted + "80"} />
              </>)}

              {/* Full Name */}
              <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>{isDealer ? "CONTACT PERSON NAME" : "FULL NAME"}</Text>
              <TextInput style={inp} value={f.name} onChangeText={v => fld({ name: v })}
                placeholder="Full name" placeholderTextColor={theme.textMuted + "80"} />

              {/* Profile Email */}
              <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>PROFILE EMAIL</Text>
              <TextInput style={inp} value={f.profileEmail} onChangeText={v => fld({ profileEmail: v })}
                placeholder="Contact email" placeholderTextColor={theme.textMuted + "80"}
                keyboardType="email-address" autoCapitalize="none" />

              {/* Cell */}
              <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>MOBILE / CELL</Text>
              <TextInput style={inp} value={f.cell} onChangeText={v => fld({ cell: v })}
                placeholder="Mobile number" placeholderTextColor={theme.textMuted + "80"} keyboardType="phone-pad" />

              {/* Dealer-only fields */}
              {isDealer && (<>
                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>PHONE (OFFICE)</Text>
                <TextInput style={inp} value={f.phone} onChangeText={v => fld({ phone: v })}
                  placeholder="Office phone" placeholderTextColor={theme.textMuted + "80"} keyboardType="phone-pad" />

                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>ADDRESS</Text>
                <TextInput style={[inp, { height: 80, paddingTop: 12, textAlignVertical: "top" }]}
                  value={f.address} onChangeText={v => fld({ address: v })}
                  placeholder="Full address" placeholderTextColor={theme.textMuted + "80"} multiline />

                {/* State dropdown */}
                <DropdownField
                  label="State" required
                  value={f.stateid} displayValue={f.stateName}
                  options={states} loading={loadingStates}
                  placeholder="Select state…"
                  onSelect={(item: any) => fld({ stateid: String(item.id), stateName: item.name, districtid: "", districtName: "" })}
                />

                {/* District dropdown — cascades from state */}
                <DropdownField
                  label="District"
                  value={f.districtid} displayValue={f.districtName}
                  options={districts} loading={loadingDistricts}
                  disabled={!f.stateid}
                  placeholder={f.stateid ? "Select district…" : "Select state first"}
                  onSelect={(item: any) => fld({ districtid: String(item.id), districtName: item.name })}
                />

                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>WEBSITE</Text>
                <TextInput style={inp} value={f.website} onChangeText={v => fld({ website: v })}
                  placeholder="https://example.com" placeholderTextColor={theme.textMuted + "80"} keyboardType="url" autoCapitalize="none" />
              </>)}

              {/* Manager / RA fields */}
              {isMgr && (<>
                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>LOCATION / CITY</Text>
                <TextInput style={inp} value={f.location} onChangeText={v => fld({ location: v })} placeholder="City / Location" placeholderTextColor={theme.textMuted + "80"} />

                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>BRANCH</Text>
                <TextInput style={inp} value={f.branch} onChangeText={v => fld({ branch: v })} placeholder="Branch name" placeholderTextColor={theme.textMuted + "80"} />

                {/* State dropdown for RA/Manager */}
                <DropdownField
                  label="State (Managed)"
                  value={f.managedStateid} displayValue={f.managedStateName}
                  options={states} loading={loadingStates}
                  placeholder="Select state…"
                  onSelect={(item: any) => fld({ managedStateid: String(item.id), managedStateName: item.name, managedarea: item.name })}
                />

                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>MANAGED AREA (details)</Text>
                <TextInput style={inp} value={f.managedarea} onChangeText={v => fld({ managedarea: v })} placeholder="e.g. North Karnataka" placeholderTextColor={theme.textMuted + "80"} />
              </>)}

              {/* Dealer Member fields */}
              {isDlrMbr && (<>
                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>SELECT DEALER <Text style={{ color: "#ef4444" }}>*</Text></Text>
                <TouchableOpacity
                  style={[inp, { justifyContent: "space-between", flexDirection: "row", alignItems: "center", borderColor: f.dealerid ? theme.primary + "70" : theme.cardBorder, backgroundColor: theme.card }]}
                  onPress={() => { setDlrSearch(""); fetchDealers(""); setShowDlrPicker(true); }}>
                  <Text style={{ color: f.dealerName ? theme.text : theme.textMuted + "99", fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {f.dealerName || "Tap to select dealer…"}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>▾</Text>
                </TouchableOpacity>

                <Text style={[cS.fieldLabel, { color: theme.textMuted }]}>REMARKS</Text>
                <TextInput style={inp} value={f.remarks} onChangeText={v => fld({ remarks: v })} placeholder="Optional remarks" placeholderTextColor={theme.textMuted + "80"} />
              </>)}
            </View>
          )}

          {/* Actions */}
          <View style={cS.actions}>
            <TouchableOpacity style={[cS.cancelBtn, { borderColor: theme.cardBorder }]} onPress={onClose} disabled={saving}>
              <Text style={[cS.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cS.createBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.7 }]}
              onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={cS.createText}>CREATE USER</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Dealer picker modal */}
      <Modal visible={showDlrPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDlrPicker(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={[cS.modalHeader, { borderBottomColor: theme.cardBorder, paddingTop: Math.max(insets.top, 20) }]}>
            <Text style={[cS.modalTitle, { color: theme.text }]}>Select Dealer</Text>
            <TouchableOpacity onPress={() => setShowDlrPicker(false)} style={[cS.closeBtn, { backgroundColor: theme.cardBorder }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 20 }}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 12 }}>
            <TextInput
              style={[inp, { marginBottom: 0 }]}
              value={dlrSearch}
              onChangeText={setDlrSearch}
              placeholder="Search dealer..."
              placeholderTextColor={theme.textMuted + "80"}
              autoFocus
            />
          </View>
          {dlrLoading
            ? <ActivityIndicator color={theme.primary} style={{ margin: 20 }} />
            : <FlatList
                data={dlrList}
                keyExtractor={i => String(i.id)}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[cS.dlrItem, { borderBottomColor: theme.cardBorder }]}
                    onPress={() => { fld({ dealerid: String(item.id), dealerName: item.company || item.name || item.email }); setShowDlrPicker(false); }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: "700" }}>{item.company || item.name}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{item.email}</Text>
                  </TouchableOpacity>
                )}
              />}
        </View>
      </Modal>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function UsersScreen() {
  const { theme, isDark } = useTheme();
  const { currentUser }   = useAuth();
  const insets = useSafeAreaInsets();
  const canEdit   = ["admin", "manager", "subadmin"].includes(currentUser?.role || "");
  const canCreate = ["admin"].includes(currentUser?.role || "");

  const [users, setUsers]           = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected]     = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const ROLE_FILTERS = [
    { value: "all",                 label: "All Roles" },
    { value: "admin",               label: "Admin" },
    { value: "subadmin",            label: "Sub-Admin" },
    { value: "reporting_authority", label: "Reporting Authority" },
    { value: "dealer",              label: "Dealer" },
    { value: "dealer_member",       label: "Dealer Member" },
    { value: "manager",             label: "Manager" },
    { value: "sales",               label: "Sales Rep" },
    { value: "campaign_master",     label: "Campaign Master" },
  ];

  const fetchUsers = async (offset = 0, append = false, searchVal = search, roleVal = roleFilter) => {
    offset === 0 ? setLoading(true) : setLoadingMore(true);
    try {
      const roleQ = roleVal === "all" ? "" : roleVal;
      const res = await api.get(
        `/users?limit=15&offset=${offset}&search=${encodeURIComponent(searchVal)}&role=${roleQ}`
      );
      if (res?.success) {
        const rows = res.data || [];
        setUsers(append ? p => [...p, ...rows] : rows);
        setTotal(res.total || rows.length);
      }
    } catch {}
    setLoading(false); setLoadingMore(false); setRefreshing(false);
  };

  // Debounce search changes
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchUsers(0, false, search, roleFilter), 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  // Immediate on role filter change
  useEffect(() => { fetchUsers(0, false, search, roleFilter); }, [roleFilter]);

  const toggleStatus = async (id: string) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    const newStatus = u.status === "active" ? "disabled" : "active";
    setUsers(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x));
    try {
      await api.put(`/users?id=${id}`, { status: newStatus });
    } catch {
      setUsers(prev => prev.map(x => x.id === id ? { ...x, status: u.status } : x));
    }
  };

  const handleUserCreated = (newUser: any) => {
    if (newUser) setUsers(prev => [newUser, ...prev]);
    setTotal(t => t + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Search row */}
      <View style={[s.searchRow, { borderBottomColor: theme.cardBorder }]}>
        <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[s.searchIcon, { color: theme.textMuted }]}>⚲</Text>
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: theme.textMuted, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        {canCreate && (
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowCreate(true)}
          >
            <Text style={s.addBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter bar */}
      <View style={[s.filterBar, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[s.roleDropBtn, { backgroundColor: theme.card, borderColor: roleFilter !== "all" ? theme.primary : theme.cardBorder }]}
          onPress={() => setShowRoleDropdown(true)}
        >
          <Text style={[s.roleDropIcon, { color: theme.textMuted }]}>👤</Text>
          <Text style={[s.roleDropLabel, { color: roleFilter !== "all" ? theme.primary : theme.text }]} numberOfLines={1}>
            {ROLE_FILTERS.find(f => f.value === roleFilter)?.label || "All Roles"}
          </Text>
          <Text style={[s.roleDropArrow, { color: theme.textMuted }]}>▾</Text>
        </TouchableOpacity>
        {roleFilter !== "all" && (
          <TouchableOpacity style={[s.clearBtn, { backgroundColor: theme.primary + "18", borderColor: theme.primary + "40" }]} onPress={() => setRoleFilter("all")}>
            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "700" }}>× Clear</Text>
          </TouchableOpacity>
        )}
        <Text style={[s.count, { color: theme.textMuted, marginLeft: "auto" }]}>
          {users.length} / {total}
        </Text>
      </View>

      {/* Role Dropdown Modal */}
      <Modal visible={showRoleDropdown} transparent animationType="fade" onRequestClose={() => setShowRoleDropdown(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowRoleDropdown(false)}>
          <View style={[s.roleModalBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[s.roleModalTitle, { color: theme.textMuted, borderBottomColor: theme.cardBorder }]}>FILTER BY ROLE</Text>
            {ROLE_FILTERS.map(f => {
              const color  = ROLE_COLORS[f.value] || theme.primary;
              const active = roleFilter === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[s.roleModalItem, { borderBottomColor: theme.cardBorder }, active && { backgroundColor: color + "10" }]}
                  onPress={() => { setRoleFilter(f.value); setShowRoleDropdown(false); }}
                >
                  <View style={[s.roleModalDot, { backgroundColor: f.value === "all" ? theme.textMuted : color }]} />
                  <Text style={[s.roleModalLabel, { color: active ? color : theme.text, fontWeight: active ? "800" : "500" }]}>
                    {f.label}
                  </Text>
                  {active && <Text style={{ color, fontSize: 14, marginLeft: "auto" }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(0); }} tintColor={theme.primary} />}
          onEndReached={() => { if (!loadingMore && users.length < total) fetchUsers(users.length, true); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60, gap: 10 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "700" }}>No Users Found</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Try a different search or filter</Text>
            </View>
          }
          renderItem={({ item }) => (
            <UserCard
              user={item}
              canEdit={canEdit}
              currentUserId={currentUser?.id}
              onToggle={toggleStatus}
              onPress={() => { setSelected(item); setShowDetail(true); }}
            />
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
        <View style={dM.overlay}>
          <TouchableOpacity style={dM.backdrop} activeOpacity={1} onPress={() => setShowDetail(false)} />
          <View style={[dM.sheet, { backgroundColor: theme.card }]}>
            {/* Drag handle */}
            <View style={[dM.handle, { backgroundColor: theme.cardBorder }]} />

            {/* Header */}
            <View style={[dM.header, { borderBottomColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[dM.title, { color: theme.text }]} numberOfLines={1}>
                  {["dealer","dealer_member"].includes(selected?.role) ? (selected?.company || selected?.name) : selected?.name}
                </Text>
                <Text style={[dM.sub, { color: theme.textMuted }]}>{ROLE_LABELS[selected?.role] || selected?.role}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetail(false)} style={[dM.closeBtn, { backgroundColor: theme.cardBorder }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) }} showsVerticalScrollIndicator={false}>
            {(() => {
              const isDealer = ["dealer", "dealer_member"].includes(selected?.role);
              const rows = [
                { label: "Email",        value: selected?.email },
                { label: "Username",     value: selected?.username },
                { label: "Role",         value: ROLE_LABELS[selected?.role] || selected?.role },
                ...(isDealer ? [
                  { label: "Company",    value: selected?.company },
                  { label: "Contact",    value: selected?.dlrname },
                  { label: "Cell",       value: selected?.cell },
                  { label: "Phone",      value: selected?.phone },
                  { label: "Website",    value: selected?.website },
                  { label: "Address",    value: selected?.address },
                  { label: "State",      value: selected?.state },
                  { label: "District",   value: selected?.district },
                  { label: "Branch",     value: selected?.branch },
                ] : [
                  { label: "Department", value: selected?.department },
                  { label: "Branch",     value: selected?.branch || selected?.managedArea },
                  { label: "Location",   value: selected?.location },
                  { label: "Cell",       value: selected?.cell },
                ]),
                { label: "Status",     value: selected?.status === "active" ? "Active" : "Disabled", accent: selected?.status === "active" ? "#10b981" : "#ef4444" },
                { label: "Last Login", value: selected?.lastActive },
                { label: "Joined",     value: selected?.joined },
                { label: "Logins",     value: String(selected?.logincount || "0") },
              ].filter(r => r.value);
              return rows;
            })().reduce((groups: any[][], row, i) => {
              const ACCOUNT = ["Email", "Username", "Role"];
              const ACTIVITY = ["Last Login", "Joined", "Logins"];
              const g = ACCOUNT.includes(row.label) ? 0 : ACTIVITY.includes(row.label) ? 2 : 1;
              if (!groups[g]) groups[g] = [];
              groups[g].push(row);
              return groups;
            }, []).filter(Boolean).map((group, gi) => {
              const titles = ["ACCOUNT", "DETAILS", "ACTIVITY"];
              return (
                <View key={gi} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: theme.textMuted, marginBottom: 8, marginLeft: 2 }}>{titles[gi]}</Text>
                  <View style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.card, overflow: "hidden" }}>
                    {group.map((row: any, i: number) => (
                      <View key={i}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 }}>
                          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>{row.label}</Text>
                          <Text style={{ color: row.accent || theme.text, fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" }} selectable>{row.value}</Text>
                        </View>
                        {i < group.length - 1 && <View style={{ height: 1, backgroundColor: theme.cardBorder, marginLeft: 16 }} />}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create User Modal */}
      <CreateUserModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleUserCreated}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  searchRow:     { padding: 16, borderBottomWidth: 1, flexDirection: "row", gap: 10, alignItems: "center" },
  searchBox:     { flexDirection: "row", alignItems: "center", height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 10, flex: 1 },
  searchIcon:    { fontSize: 20, fontWeight: "300" },
  searchInput:   { flex: 1, fontSize: 14, fontWeight: "500" },
  addBtn:        { height: 48, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addBtnText:    { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  filterBar:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  roleDropBtn:   { flexDirection: "row", alignItems: "center", height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, gap: 7, maxWidth: 180 },
  roleDropIcon:  { fontSize: 13 },
  roleDropLabel: { fontSize: 13, fontWeight: "700", flex: 1 },
  roleDropArrow: { fontSize: 11 },
  clearBtn:      { height: 32, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  count:         { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  modalOverlay:  { flex: 1, backgroundColor: "#00000055", justifyContent: "center", alignItems: "center" },
  roleModalBox:  { width: 280, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  roleModalTitle:{ fontSize: 10, fontWeight: "800", letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  roleModalItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  roleModalDot:  { width: 8, height: 8, borderRadius: 4 },
  roleModalLabel:{ fontSize: 14 },
});

const uS = StyleSheet.create({
  card:       { flexDirection: "row", borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  bar:        { width: 4 },
  content:    { flex: 1, padding: 14 },
  top:        { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  name:       { fontSize: 14, fontWeight: "700" },
  email:      { fontSize: 11, marginTop: 2 },
  youBadge:   { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  youText:    { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  roleBadge:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  roleText:   { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  footer:     { flexDirection: "row", alignItems: "center", borderTopWidth: 1, paddingTop: 10, gap: 12 },
  metaItem:   { flex: 1, gap: 3 },
  metaLabel:  { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  metaVal:    { fontSize: 11, fontWeight: "600" },
  statusRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
});

const dM = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%", minHeight: "40%" },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title:    { fontSize: 17, fontWeight: "800" },
  sub:      { fontSize: 11, fontWeight: "700", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});

const cS = StyleSheet.create({
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 18, fontWeight: "800" },
  modalSub:    { fontSize: 12, marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  modalBody:   { padding: 16, gap: 4, paddingBottom: 40 },
  section:     { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle:{ fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 4 },
  fieldLabel:  { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input:       { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  pwRow:       { flexDirection: "row", gap: 8 },
  eyeBtn:      { width: 50, height: 50, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  roleGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  roleChip:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  roleChipText:{ fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  actions:     { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 20 },
  cancelBtn:   { flex: 1, height: 54, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cancelText:  { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  createBtn:   { flex: 2, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  createText:  { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  dlrItem:     { paddingVertical: 14, borderBottomWidth: 1 },
  banner:      { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  bannerMsg:   { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
