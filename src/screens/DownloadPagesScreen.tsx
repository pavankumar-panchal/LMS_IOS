import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Linking,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

export default function DownloadPagesScreen() {
  const { theme, isDark } = useTheme();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/masters?submittype=download_pages");
      if (res.success) setPages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => console.warn("Could not open link:", url));
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[s.item, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onPress={() => handleOpen(item.url)}
    >
      <View style={s.itemIcon}>
        <Text style={{ fontSize: 24 }}>📄</Text>
      </View>
      <View style={s.itemInfo}>
        <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[s.itemSub, { color: theme.textMuted }]} numberOfLines={1}>{item.url}</Text>
      </View>
      <Text style={[s.itemArrow, { color: theme.primary }]}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      ) : (
        <FlatList
          data={pages}
          renderItem={renderItem}
          keyExtractor={(item, index) => String(index)}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ color: theme.textMuted }}>No download pages configured</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  item: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  itemIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#8882", alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 15, fontWeight: "700" },
  itemSub: { fontSize: 11, marginTop: 2 },
  itemArrow: { fontSize: 18, fontWeight: "900", marginLeft: 10 },
  empty: { flex: 1, alignItems: "center", marginTop: 100 },
});
