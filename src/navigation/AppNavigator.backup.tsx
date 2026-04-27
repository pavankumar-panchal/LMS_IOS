import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  StatusBar, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DrawerActions, useNavigation } from "@react-navigation/native";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LeadsScreen from "../screens/LeadsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import UsersScreen from "../screens/UsersScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import ViewLeadsScreen from "../screens/ViewLeadsScreen";
import ReportScreen from "../screens/ReportScreen";
import UploadLeadsScreen from "../screens/UploadLeadsScreen";
import BulkTransferScreen from "../screens/BulkTransferScreen";
import BulkMappingScreen  from "../screens/BulkMappingScreen";
import UpdateLeadsScreen from "../screens/UpdateLeadsScreen";
import RegionMasterScreen from "../screens/RegionMasterScreen";
import MasterSearchScreen from "../screens/MasterSearchScreen";
import DownloadPagesScreen from "../screens/DownloadPagesScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import StateMappingScreen from "../screens/StateMappingScreen";
import WebLeadsMappingScreen from "../screens/WebLeadsMappingScreen";
import UnmappedLeadsScreen from "../screens/UnmappedLeadsScreen";
import ActivityScreen from "../screens/ActivityScreen";
import MCACompaniesScreen from "../screens/MCACompaniesScreen";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole =
  | "admin" | "subadmin" | "dealer" | "dealer_member"
  | "reporting_authority" | "manager" | "sales" | "campaign_master";

type Permission =
  | "view_dashboard"
  | "view_leads"
  | "view_upload_leads"
  | "view_manual_upload"
  | "view_bulk_transfer"
  | "view_leads_list"
  | "view_assign_leads"
  | "create_leads"
  | "edit_leads"
  | "delete_leads"
  | "view_pipeline"
  | "edit_pipeline"
  | "view_activities"
  | "view_automation"
  | "edit_automation"
  | "view_communications"
  | "view_reports"
  | "view_notifications"
  | "view_users"
  | "create_users"
  | "edit_users"
  | "delete_users"
  | "view_settings"
  | "edit_settings"
  | "view_masters"
  | "view_dealer_members"
  | "view_lead_mapping"
  | "view_lead_management"
  | "view_profile_settings"
  | "edit_profile"
  | "view_mca_companies"
  | "view_activity_logs"
  | "view_uploaded_leads"
  | "view_crm"
  | "view_campaign";

// ─── Permission Matrix (matches web frontend exactly) ─────────────────────────
const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "view_leads", "view_manual_upload", "view_bulk_transfer", "view_leads_list", "view_assign_leads", "create_leads", "edit_leads", "delete_leads",
    "view_pipeline", "edit_pipeline",
    "view_activities",
    "view_automation", "edit_automation",
    "view_communications",
    "view_reports",
    "view_notifications",
    "view_users", "create_users", "edit_users", "delete_users",
    "view_settings", "edit_settings",
    "view_masters", "view_lead_mapping", "view_lead_management", "view_uploaded_leads", "view_profile_settings",
    "view_mca_companies", "view_activity_logs",
  ],
  subadmin: [
    "view_dashboard",
    "view_leads", "view_manual_upload",
    "view_bulk_transfer",
    "view_mca_companies",
    "view_leads_list",
    "view_lead_management", "view_uploaded_leads",
    "view_reports",
    "view_profile_settings",
  ],
  reporting_authority: [
    "view_dashboard",
    "view_leads",
    "view_manual_upload", "view_bulk_transfer",
    "view_leads_list", "view_assign_leads",
    "create_leads", "edit_leads", "delete_leads",
    "view_mca_companies",
    "view_lead_management", "view_uploaded_leads",
    "view_reports",
    "view_profile_settings",
  ],
  dealer: [
    "view_dashboard",
    "view_dealer_members",
    "view_leads",
    "view_leads_list",
    "view_manual_upload",
    "view_mca_companies",
    "view_lead_management", "view_uploaded_leads",
    "view_reports",
    "view_profile_settings",
    "edit_profile",
  ],
  dealer_member: [
    "view_dashboard",
    "view_leads",
    "edit_leads",
    "view_leads_list",
    "view_manual_upload",
    "view_lead_management",
    "view_uploaded_leads",
    "view_profile_settings",
    "edit_profile",
  ],
  manager: [
    "view_dashboard",
    "view_leads", "view_upload_leads", "view_manual_upload", "create_leads", "edit_leads",
    "view_leads_list", "view_lead_management", "view_uploaded_leads",
    "view_pipeline", "edit_pipeline",
    "view_activities",
    "view_automation", "edit_automation",
    "view_communications",
    "view_reports",
    "view_notifications",
    "view_users",
    "view_profile_settings", "edit_profile",
  ],
  sales: [
    "view_dashboard",
    "view_leads", "view_upload_leads", "view_manual_upload", "create_leads", "edit_leads",
    "view_leads_list", "view_lead_management", "view_uploaded_leads",
    "view_pipeline",
    "view_activities",
    "view_communications",
    "view_notifications",
    "view_profile_settings", "edit_profile",
  ],
  campaign_master: [
    "view_dashboard",
    "view_leads", "view_manual_upload",
    "view_campaign",
    "view_notifications",
    "view_profile_settings", "edit_profile",
  ],
};

function can(role: UserRole | string | undefined, perm: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role as UserRole]?.includes(perm) ?? false;
}

// ─── Role UI Meta ─────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, { primary: string; bg: string; label: string }> = {
  admin:               { primary: "#6366f1", bg: "#6366f122", label: "Admin" },
  subadmin:            { primary: "#8b5cf6", bg: "#8b5cf622", label: "Sub-Admin" },
  dealer:              { primary: "#f97316", bg: "#f9731622", label: "Dealer" },
  dealer_member:       { primary: "#06b6d4", bg: "#06b6d422", label: "Dealer Member" },
  reporting_authority: { primary: "#f59e0b", bg: "#f59e0b22", label: "LMS RA" },
  manager:             { primary: "#8b5cf6", bg: "#8b5cf622", label: "Manager" },
  sales:               { primary: "#10b981", bg: "#10b98122", label: "Sales Rep" },
  campaign_master:     { primary: "#ef4444", bg: "#ef444422", label: "Campaign Master" },
};

// ─── Nav Item type ─────────────────────────────────────────────────────
type SubNavItem = { name: string; screen: string; icon?: string };
type NavItem    = { name: string; label: string; icon: string; screen?: string; permission?: Permission; subItems?: (SubNavItem & { permission?: Permission })[] };
type NavGroup   = { group: string; items: NavItem[] };

// ─── Full Nav Structure with icons & permissions ────────────────────────────
const NAV_STRUCTURE: NavGroup[] = [
  {
    group: "MAIN",
    items: [
      { name: "Dashboard", label: "Dashboard", icon: "\u2302", screen: "Dashboard", permission: "view_dashboard" },
      {
        name: "Masters", label: "Masters", icon: "\u26c3", permission: "view_masters",
        subItems: [
          { name: "Region",          screen: "RegionMaster",  icon: "\u2609", permission: "view_masters" },
          { name: "Adv. Downloads",  screen: "DownloadPages", icon: "\u2913", permission: "view_masters" },
          { name: "Master Search",   screen: "MasterSearch",  icon: "\u2315", permission: "view_masters" },
          { name: "State Mapping",   screen: "StateMapping",  icon: "\u229e", permission: "view_masters" },
        ],
      },
      {
        name: "Lead Mapping", label: "Lead Mapping", icon: "\u21c4", permission: "view_lead_mapping",
        subItems: [
          { name: "Mapping Dealers",   screen: "WebLeadsMapping",  icon: "\u21f3", permission: "view_lead_mapping" },
          { name: "Unmapped Contacts", screen: "UnmappedLeads",    icon: "\u2205", permission: "view_lead_mapping" },
          { name: "Bulk Mapping",      screen: "BulkMapping",      icon: "\u25a6", permission: "view_lead_mapping" },
        ],
      },
      {
        name: "Leads", label: "Leads", icon: "\u25a4", screen: "Leads", permission: "view_leads",
        subItems: [
          { name: "Upload Leads",  screen: "UploadLeads",  icon: "\u2191", permission: "view_manual_upload" },
          { name: "Bulk Transfer", screen: "BulkTransfer", icon: "\u21c6", permission: "view_bulk_transfer" },
          { name: "MCA Companies", screen: "MCALeads",     icon: "\u2302", permission: "view_mca_companies" },
        ],
      },
      {
        name: "Lead Management", label: "Lead Management", icon: "\u2610", permission: "view_lead_management",
        subItems: [
          { name: "View Created Leads", screen: "ViewLeads",   icon: "\u2637", permission: "view_leads_list" },
          { name: "Update Leads",       screen: "UpdateLeads", icon: "\u270e", permission: "view_lead_management" },
        ],
      },
    ],
  },
  {
    group: "ANALYTICS",
    items: [
      {
        name: "Reports", label: "Reports", icon: "\u25a0", permission: "view_reports",
        subItems: [
          { name: "Manager List",   screen: "ManagerReport",    icon: "\u25b8", permission: "view_reports" },
          { name: "Mapping Info",   screen: "MappingReport",    icon: "\u25b8", permission: "view_reports" },
          { name: "Dealer List",    screen: "DealerReport",     icon: "\u25b8", permission: "view_reports" },
          { name: "Leads Report",   screen: "LeadsReport",      icon: "\u25b8", permission: "view_reports" },
          { name: "Dealer Data",    screen: "DealerDataReport", icon: "\u25b8", permission: "view_reports" },
          { name: "Dealer Wise",    screen: "DealerWiseReport", icon: "\u25b8", permission: "view_reports" },
          { name: "Source Stats",   screen: "SourceStats",      icon: "\u25b8", permission: "view_reports" },
          { name: "Upload Stats",   screen: "UploadStats",      icon: "\u25b8", permission: "view_reports" },
          { name: "Demo Stats",     screen: "DemoStats",        icon: "\u25b8", permission: "view_reports" },
          { name: "Demo Given",     screen: "DemoGivenStats",   icon: "\u25b8", permission: "view_reports" },
          { name: "Delay Reports",  screen: "DelayReport",      icon: "\u25b8", permission: "view_reports" },
          { name: "Status Chart",   screen: "StatusChart",      icon: "\u25b8", permission: "view_reports" },
          { name: "Activity Log",   screen: "ActivityLog",      icon: "\u25b8", permission: "view_activity_logs" },
        ],
      },
      { name: "Notifications", label: "Notifications", icon: "\u25ef", screen: "Notifications", permission: "view_notifications" },
    ],
  },
  {
    group: "ADMIN",
    items: [
      { name: "Users", label: "Users", icon: "\u25a3", screen: "Users", permission: "view_users" },
      { name: "Dealer Members", label: "Dealer Members", icon: "\u25c8", screen: "DealerMembers", permission: "view_dealer_members" },
      {
        name: "Profile", label: "Profile", icon: "\u25ce", permission: "view_profile_settings",
        subItems: [
          { name: "Edit Profile",    screen: "EditProfile",    icon: "\u270e", permission: "view_profile_settings" },
          { name: "Change Password", screen: "ChangePassword", icon: "\u2731", permission: "view_profile_settings" },
        ],
      },
    ],
  },
];

// ─── Permission Filter ─────────────────────────────────────────────────────────
function filterNavForRole(structure: NavGroup[], role: string): NavGroup[] {
  return structure
    .map(group => ({
      ...group,
      items: group.items
        .filter(item => !item.permission || can(role, item.permission))
        .map(item => ({
          ...item,
          subItems: item.subItems
            ? item.subItems.filter(sub => !sub.permission || can(role, sub.permission))
            : undefined,
        }))
        .filter(item => {
          // Hide parent if it requires sub-items but all are filtered
          if (item.subItems !== undefined && item.subItems.length === 0 && !item.screen) return false;
          return true;
        }),
    }))
    .filter(group => group.items.length > 0);
}

// ─── Custom Drawer ─────────────────────────────────────────────────────────────
function CustomDrawer(props: any) {
  const { currentUser, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const role = (currentUser?.role || "sales") as string;
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.sales;
  const [expanded, setExpanded] = useState<string | null>(null);

  const visibleNav = useMemo(
    () => filterNavForRole(NAV_STRUCTURE, role),
    [role]
  );

  const toggle = (name: string) =>
    setExpanded(prev => (prev === name ? null : name));

  const TAB_SCREENS = ["Dashboard", "Leads", "Profile"];

  const navigate = (screen: string) => {
    if (TAB_SCREENS.includes(screen)) {
      props.navigation.navigate("MainStack", { screen: "Tabs", params: { screen } });
    } else {
      props.navigation.navigate("MainStack", { screen });
    }
    props.navigation.dispatch(DrawerActions.closeDrawer());
  };

  const divider = isDark ? "#1e293b" : "#e8edf5";

  return (
    <DrawerContentScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      style={{ backgroundColor: isDark ? "#09111f" : "#f5f7fb" }}
    >
      {/* ── Header ── */}
      <View style={[dS.header, { borderBottomColor: divider }]}>
        {/* Avatar */}
        <View style={[dS.avatarRing, { borderColor: roleStyle.primary + "80" }]}>
          <View style={[dS.avatar, { backgroundColor: roleStyle.primary + "22" }]}>
            <Text style={[dS.avatarText, { color: roleStyle.primary }]}>
              {(currentUser?.name?.[0] || currentUser?.email?.[0] || "U").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={[dS.name, { color: theme.text }]} numberOfLines={1}>
          {currentUser?.name || currentUser?.email || "User"}
        </Text>

        {/* Role badge */}
        <View style={[dS.roleBadge, { backgroundColor: roleStyle.primary + "18", borderColor: roleStyle.primary + "45" }]}>
          <View style={[dS.roleDot, { backgroundColor: roleStyle.primary }]} />
          <Text style={[dS.roleText, { color: roleStyle.primary }]}>
            {roleStyle.label.toUpperCase()}
          </Text>
        </View>

        {/* Email */}
        <Text style={[dS.email, { color: theme.textMuted }]} numberOfLines={1}>
          {currentUser?.email}
        </Text>
      </View>

      {/* ── Brand strip ── */}
      <View style={[dS.brandRow, { borderBottomColor: divider, backgroundColor: isDark ? "#0d1626" : "#eef1f8" }]}>
        <View style={[dS.brandIcon, { backgroundColor: "#6366f1" }]}>
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>LMS</Text>
        </View>
        <Text style={[dS.brandText, { color: theme.textMuted }]}>Lead Management System</Text>
      </View>

      {/* ── Navigation ── */}
      <View style={dS.navBody}>
        {visibleNav.map(group => (
          <View key={group.group} style={dS.navGroup}>
            {/* Group label */}
            <View style={[dS.groupLabelRow, { borderBottomColor: divider }]}>
              <Text style={[dS.groupLabel, { color: theme.textMuted }]}>{group.group}</Text>
              <View style={[dS.groupLine, { backgroundColor: divider }]} />
            </View>

            {group.items.map(item => {
              const isExpanded = expanded === item.name;
              const hasChildren = (item.subItems?.length ?? 0) > 0;
              const hasDualNav = hasChildren && !!item.screen;

              return (
                <View key={item.name}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      dS.navRow,
                      isExpanded && { backgroundColor: roleStyle.primary + "12" },
                    ]}
                    onPress={() => hasChildren ? toggle(item.name) : navigate(item.screen || "Dashboard")}
                  >
                    {/* Icon box */}
                    <TouchableOpacity
                      onPress={() => hasDualNav ? navigate(item.screen!) : (hasChildren ? toggle(item.name) : navigate(item.screen || "Dashboard"))}
                      style={[
                        dS.iconBox,
                        { backgroundColor: isExpanded ? roleStyle.primary + "25" : isDark ? "#ffffff0a" : "#00000008" },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[dS.iconText, { color: isExpanded ? roleStyle.primary : theme.textMuted }]}>
                        {item.icon || "·"}
                      </Text>
                    </TouchableOpacity>

                    {/* Label */}
                    <Text style={[dS.navLabel, { color: isExpanded ? roleStyle.primary : theme.text }]} numberOfLines={1}>
                      {item.label}
                    </Text>

                    {/* Chevron */}
                    {hasChildren && (
                      <View style={[dS.chevronBox, isExpanded && { backgroundColor: roleStyle.primary + "15" }]}>
                        <Text style={[dS.chevron, { color: isExpanded ? roleStyle.primary : theme.textMuted, transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }]}>›</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Sub-items */}
                  {isExpanded && hasChildren && (
                    <View style={[dS.subList, { borderLeftColor: roleStyle.primary + "50" }]}>
                      {hasDualNav && (
                        <TouchableOpacity activeOpacity={0.7} style={dS.subRow} onPress={() => navigate(item.screen!)}>
                          <View style={[dS.subDot, { backgroundColor: roleStyle.primary }]} />
                          <Text style={[dS.subLabel, { color: roleStyle.primary, fontWeight: "700" }]}>View All {item.label}</Text>
                        </TouchableOpacity>
                      )}
                      {item.subItems!.map(sub => (
                        <TouchableOpacity
                          key={sub.name}
                          activeOpacity={0.7}
                          style={dS.subRow}
                          onPress={() => navigate(sub.screen)}
                        >
                          <View style={[dS.subDot, { backgroundColor: isDark ? "#334155" : "#cbd5e1" }]} />
                          <Text style={[dS.subLabel, { color: theme.textSecondary }]} numberOfLines={1}>{sub.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Footer ── */}
      <View style={[dS.footer, { borderTopColor: divider }]}>
        {/* Dark mode row */}
        <TouchableOpacity style={dS.footerRow} activeOpacity={0.7} onPress={toggleTheme}>
          <View style={dS.footerLeft}>
            <View style={[dS.footerIconBox, { backgroundColor: isDark ? "#6366f122" : "#64748b18" }]}>
              <Text style={{ fontSize: 14 }}>{isDark ? "🌙" : "☀️"}</Text>
            </View>
            <Text style={[dS.footerLabel, { color: theme.textSecondary }]}>
              {isDark ? "Dark Mode" : "Light Mode"}
            </Text>
          </View>
          <View style={[dS.toggle, { backgroundColor: isDark ? "#6366f1" : "#cbd5e1" }]}>
            <View style={[dS.toggleThumb, { left: isDark ? 18 : 2 }]} />
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={[dS.footerDivider, { backgroundColor: divider }]} />

        {/* Sign out row */}
        <TouchableOpacity style={dS.footerRow} activeOpacity={0.7} onPress={() => logout()}>
          <View style={dS.footerLeft}>
            <View style={[dS.footerIconBox, { backgroundColor: "#ef444418" }]}>
              <Text style={{ fontSize: 14 }}>🚪</Text>
            </View>
            <Text style={dS.signOutLabel}>Sign Out</Text>
          </View>
          <Text style={[dS.signOutArrow, { color: "#ef444480" }]}>›</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// ─── Bottom Tabs ───────────────────────────────────────────────────────────────
function BottomTabs() {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const role = currentUser?.role || "sales";

  const showLeads = can(role, "view_leads");

  const TAB_HEIGHT = 64;
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Dashboard: "⌂",
            Leads:     "◈",
            Profile:   "◉",
          };
          return (
            <View style={[tbS.iconWrap, focused && { backgroundColor: theme.primary + "20" }]}>
              <Text style={[tbS.iconText, { color: focused ? theme.primary : theme.textMuted }]}>
                {icons[route.name] || "·"}
              </Text>
              {focused && <View style={[tbS.dot, { backgroundColor: theme.primary }]} />}
            </View>
          );
        },
        tabBarLabel: ({ focused }) => {
          const labels: Record<string, string> = { Dashboard: "Home", Leads: "Leads", Profile: "Profile" };
          return (
            <Text style={[tbS.tabLabel, { color: focused ? theme.primary : theme.textMuted, fontWeight: focused ? "800" : "500" }]}>
              {labels[route.name] || route.name}
            </Text>
          );
        },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBorder,
          borderTopWidth: 1,
          height: TAB_HEIGHT + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        headerStyle: { backgroundColor: theme.header },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", fontSize: 16, letterSpacing: 0.2 },
        headerLeft: () => {
          const nav = useNavigation();
          return (
            <TouchableOpacity
              onPress={() => nav.dispatch(DrawerActions.openDrawer())}
              style={hS.menuBtn}
              activeOpacity={0.7}
            >
              <View style={hS.bar} />
              <View style={[hS.bar, { width: 14 }]} />
              <View style={[hS.bar, { width: 18 }]} />
            </TouchableOpacity>
          );
        },
        headerRight: () => (
          <View style={hS.brandTag}>
            <View style={hS.brandDot} />
            <Text style={hS.brandLabel}>LMS</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {showLeads && <Tab.Screen name="Leads" component={LeadsScreen} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Report Screen Wrapper ────────────────────────────────────────────────────
const REPORT_CONFIGS: Record<string, { title: string; endpoint: string; submittype: string }> = {
  ManagerReport:    { title: "Manager List",     endpoint: "/reports", submittype: "managers" },
  MappingReport:    { title: "Mapping Info",     endpoint: "/reports", submittype: "mapping" },
  DealerReport:     { title: "Dealer List",      endpoint: "/reports", submittype: "dealers" },
  LeadsReport:      { title: "Leads Report",     endpoint: "/reports", submittype: "leads" },
  DealerDataReport: { title: "Dealer Data",      endpoint: "/reports", submittype: "dealer-data" },
  DealerWiseReport: { title: "Dealer Wise",      endpoint: "/reports", submittype: "dealer-wise" },
  SourceStats:      { title: "Source Stats",     endpoint: "/reports", submittype: "source-stats" },
  UploadStats:      { title: "Upload Stats",     endpoint: "/reports", submittype: "upload-stats" },
  DemoStats:        { title: "Demo Stats",       endpoint: "/reports", submittype: "demo-stats" },
  DemoGivenStats:   { title: "Demo Given Stats", endpoint: "/reports", submittype: "demo-given-stats" },
  DelayReport:      { title: "Delay Reports",    endpoint: "/reports", submittype: "delay" },
  StatusChart:      { title: "Status Chart",     endpoint: "/reports", submittype: "status-chart" },
};

function makeReportScreen(key: string) {
  return (props: any) => (
    <ReportScreen {...props} route={{ ...props.route, params: { ...(props.route?.params || {}), ...REPORT_CONFIGS[key] } }} />
  );
}

// ─── App Stack ────────────────────────────────────────────────────────────────
function AppStack() {
  const { theme } = useTheme();
  const screenOpts = {
    headerStyle: { backgroundColor: theme.header },
    headerTintColor: theme.text,
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: "800" as const, fontSize: 16, letterSpacing: 0.2 },
  };

  // Screens still using PlaceholderScreen (pending full port)
  const PLACEHOLDER_SCREENS = [
    "DealerMembers",
  ];

  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Tabs"          component={BottomTabs}          options={{ headerShown: false }} />
      <Stack.Screen name="Users"         component={UsersScreen}         options={{ title: "Users & Roles" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="ChangePassword"component={ChangePasswordScreen}options={{ title: "Change Password" }} />
      <Stack.Screen name="ViewLeads"     component={ViewLeadsScreen}     options={{ title: "View Created Leads" }} />
      <Stack.Screen name="UploadLeads"   component={UploadLeadsScreen}   options={{ title: "Upload Leads" }} />
      <Stack.Screen name="BulkTransfer"  component={BulkTransferScreen}  options={{ title: "Bulk Transfer" }} />
      <Stack.Screen name="BulkMapping"   component={BulkMappingScreen}   options={{ title: "Bulk Mapping" }} />
      <Stack.Screen name="UpdateLeads"   component={UpdateLeadsScreen}   options={{ title: "Update Lead Interaction" }} />
      <Stack.Screen name="RegionMaster"  component={RegionMasterScreen}  options={{ title: "Region Master" }} />
      <Stack.Screen name="MasterSearch"  component={MasterSearchScreen}  options={{ title: "Master Search" }} />
      <Stack.Screen name="DownloadPages" component={DownloadPagesScreen} options={{ title: "Download Pages" }} />
      <Stack.Screen name="EditProfile"      component={EditProfileScreen}      options={{ title: "Edit Profile" }} />
      <Stack.Screen name="StateMapping"     component={StateMappingScreen}     options={{ title: "State Mapping" }} />
      <Stack.Screen name="WebLeadsMapping"  component={WebLeadsMappingScreen}  options={{ title: "Web Leads Mapping" }} />
      <Stack.Screen name="UnmappedLeads"    component={UnmappedLeadsScreen}    options={{ title: "Unmapped Contacts" }} />
      <Stack.Screen name="ActivityLog"      component={ActivityScreen}         options={{ title: "Activity Log" }} />
      <Stack.Screen name="MCALeads"         component={MCACompaniesScreen}     options={{ title: "MCA Companies" }} />
      {/* Report Screens */}
      {Object.keys(REPORT_CONFIGS).map(key => (
        <Stack.Screen
          key={key}
          name={key}
          component={makeReportScreen(key)}
          options={{ title: REPORT_CONFIGS[key].title }}
        />
      ))}
      {/* Placeholder Screens (pending port) */}
      {PLACEHOLDER_SCREENS.map(name => (
        <Stack.Screen
          key={name}
          name={name}
          component={PlaceholderScreen}
          options={{ title: name.replace(/([A-Z])/g, " $1").trim() }}
        />
      ))}
    </Stack.Navigator>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function DrawerNav() {
  const { theme, isDark } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: isDark ? "#080f1e" : "#f8fafc", width: 300 },
      }}
    >
      <Drawer.Screen name="MainStack" component={AppStack} />
    </Drawer.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { currentUser, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 14, letterSpacing: 2, textTransform: "uppercase" }}>
          Authenticating
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.header} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser ? (
          <Stack.Screen name="App" component={DrawerNav} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Drawer Styles ─────────────────────────────────────────────────────────────
const dS = StyleSheet.create({
  // ── Header
  header: {
    paddingHorizontal: 22, paddingTop: 52, paddingBottom: 22, borderBottomWidth: 1,
  },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2.5,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: "center", justifyContent: "center",
  },
  avatarText:  { fontSize: 24, fontWeight: "800" },
  name:        { fontSize: 17, fontWeight: "800", letterSpacing: 0.2, marginBottom: 8 },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  roleDot:  { width: 5, height: 5, borderRadius: 3 },
  roleText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  email:    { fontSize: 12, fontWeight: "400", letterSpacing: 0.1 },

  // ── Brand strip
  brandRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 22, paddingVertical: 11,
    borderBottomWidth: 1, gap: 10,
  },
  brandIcon: {
    width: 28, height: 18, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
  },
  brandText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },

  // ── Nav body
  navBody:  { paddingHorizontal: 14, paddingTop: 8 },
  navGroup: { marginBottom: 6 },

  groupLabelRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, marginBottom: 6, marginTop: 18, gap: 10 },
  groupLabel:    { fontSize: 10, fontWeight: "800", letterSpacing: 2.5 },
  groupLine:     { flex: 1, height: 1 },

  // ── Nav row
  navRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 11, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 2, gap: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  iconText:   { fontSize: 16, lineHeight: 20 },
  navLabel:   { fontSize: 14, fontWeight: "600", flex: 1, letterSpacing: 0.1 },
  chevronBox: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  chevron:    { fontSize: 22, fontWeight: "300", lineHeight: 24, marginTop: -1 },

  // ── Sub items
  subList: { marginLeft: 22, borderLeftWidth: 1.5, paddingLeft: 16, marginBottom: 4, paddingVertical: 4 },
  subRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  subDot:  { width: 6, height: 6, borderRadius: 3 },
  subLabel:{ fontSize: 13, fontWeight: "500", letterSpacing: 0.1, flex: 1 },

  // ── Footer
  footer:       { marginTop: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1 },
  footerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  footerLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
  footerIconBox:{ width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  footerLabel:  { fontSize: 14, fontWeight: "600" },
  footerDivider:{ height: 1, marginVertical: 4 },
  toggle:       { width: 38, height: 22, borderRadius: 11, justifyContent: "center", position: "relative" },
  toggleThumb:  { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  signOutLabel: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
  signOutArrow: { fontSize: 22, fontWeight: "300", lineHeight: 24 },
});

// ─── Header Styles ─────────────────────────────────────────────────────────────
const hS = StyleSheet.create({
  menuBtn:  { marginLeft: 14, padding: 6, justifyContent: "center", gap: 4.5 },
  bar:      { width: 20, height: 2, borderRadius: 2, backgroundColor: "#94a3b8" },
  brandTag: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginRight: 14, paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 9, backgroundColor: "#6366f114", borderWidth: 1, borderColor: "#6366f128",
  },
  brandDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6366f1" },
  brandLabel: { fontSize: 12, fontWeight: "800", color: "#6366f1", letterSpacing: 1.8 },
});

// ─── Tab Styles ────────────────────────────────────────────────────────────────
const tbS = StyleSheet.create({
  iconWrap: {
    width: 48, height: 34, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  iconText: { fontSize: 24, lineHeight: 28 },
  dot: {
    position: "absolute", bottom: 2,
    width: 4, height: 4, borderRadius: 2,
  },
  tabLabel: { fontSize: 11, letterSpacing: 0.3, marginTop: 2 },
});
