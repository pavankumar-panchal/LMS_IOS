import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: any;
}

export default function ScreenWrapper({
  children,
  scrollable = false,
  padded = true,
  style
}: ScreenWrapperProps) {
  const { theme } = useTheme();

  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <Container
        style={[styles.container, padded && styles.padded, style]}
        contentContainerStyle={scrollable && padded ? styles.padded : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    padding: 16,
  }
});
