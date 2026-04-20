import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Scanner QR</Text>
      <Text style={styles.body}>
        Intégration react-native-vision-camera: ouvrir caméra, décoder le QR marchand (base64url
        JSON), poster vers /transactions/qr.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12, color: '#fff' },
  body: { color: '#94a3b8' },
});
