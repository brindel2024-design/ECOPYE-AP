import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface WalletSummary {
  availableBalance: string;
  currency: string;
  dailyLimit: string;
  monthlyLimit: string;
}

function fmtDzd(centimes: string) {
  const n = BigInt(centimes);
  const integer = n / 100n;
  const decimal = (n % 100n).toString().padStart(2, '0');
  return `${integer.toString()},${decimal} DZD`;
}

export function HomeScreen() {
  const token = useAuthStore((s) => s.accessToken);
  const { data, isLoading } = useQuery({
    queryKey: ['wallet', 'summary'],
    enabled: !!token,
    queryFn: () => apiFetch<WalletSummary>('/wallets/summary', { token: token! }),
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.greeting}>Bonjour</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Solde disponible</Text>
        {isLoading ? (
          <ActivityIndicator color="#0d9488" style={{ marginTop: 12 }} />
        ) : (
          <Text style={styles.balance}>
            {data ? fmtDzd(data.availableBalance) : '0,00 DZD'}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  greeting: { fontSize: 28, fontWeight: '600', marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: { color: '#64748b', fontSize: 14, marginBottom: 8 },
  balance: { fontSize: 42, fontWeight: '700', color: '#0f766e' },
});
