import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface TxRow {
  id: string;
  reference: string;
  status: string;
  amount: string;
  description: string;
  createdAt: string;
}

interface TxList {
  items: TxRow[];
}

export function HistoryScreen() {
  const token = useAuthStore((s) => s.accessToken);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['transactions', 'list'],
    enabled: !!token,
    queryFn: () => apiFetch<TxList>('/transactions?page=1&limit=20', { token: token! }),
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historique</Text>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Aucune transaction</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ref}>{item.description || item.reference}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('fr-DZ')}</Text>
            </View>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ref: { fontWeight: '500', color: '#0f172a' },
  date: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '600', color: '#0f766e' },
});
