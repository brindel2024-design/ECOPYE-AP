import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function SendScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Envoyer</Text>
      <Text style={styles.body}>Flux P2P à implémenter (saisie bénéficiaire, montant, PIN).</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  body: { color: '#64748b' },
});
