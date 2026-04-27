import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const { width: W } = Dimensions.get("window");

export default function PlaceholderScreen({ route }: any) {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const screenName: string = route?.name || "Screen";
  const formatted = screenName.replace(/([A-Z])/g, " $1").trim();

  return (
    <View style={[s.wrap, { backgroundColor: theme.bg }]}>
      {/* Background accent */}
      <View style={[s.glow, { backgroundColor: theme.primary + "0a" }]} />

      {/* Card */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Top accent line */}
        <View style={[s.accentLine, { backgroundColor: theme.primary }]} />

        <View style={s.body}>
          {/* Icon placeholder */}
          <View style={[s.iconRing, { borderColor: theme.primary + "40", backgroundColor: theme.primary + "10" }]}>
            <View style={[s.innerDot, { backgroundColor: theme.primary }]} />
          </View>

          <Text style={[s.title, { color: theme.text }]}>{formatted}</Text>
          <Text style={[s.sub, { color: theme.textMuted }]}>
            This module is being ported from the{"\n"}web application.
          </Text>

          <View style={[s.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: "#f59e0b" }]} />
            <Text style={[s.statusText, { color: theme.textMuted }]}>In development</Text>
          </View>
        </View>
      </View>

      {/* Back button */}
      {navigation.canGoBack() && (
        <TouchableOpacity
          style={[s.backBtn, { borderColor: theme.cardBorder }]}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={[s.backText, { color: theme.textSecondary }]}>← Go Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 24,
  },
  glow: {
    position: "absolute", width: W * 1.4, height: W * 1.4,
    borderRadius: W * 0.7, top: -W * 0.4,
  },
  card: {
    width: "100%", maxWidth: 360,
    borderRadius: 20, borderWidth: 1,
    overflow: "hidden",
  },
  accentLine: { height: 2, width: "100%" },
  body: { padding: 32, alignItems: "center", gap: 0 },
  iconRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },
  innerDot: { width: 22, height: 22, borderRadius: 11 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginBottom: 10, textAlign: "center" },
  sub: {
    fontSize: 13, lineHeight: 20, textAlign: "center",
    letterSpacing: 0.2, marginBottom: 24,
  },
  divider: { width: "100%", height: 1, marginBottom: 20 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  backBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  backText: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
});
