import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export function LoginScreen() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const [phone, setPhone] = useState('+213');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!/^\+213[567]\d{8}$/.test(phone) || pin.length !== 6) {
      Alert.alert('Champs invalides');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { phoneNumber: phone, pin },
      });
      setTokens(data.accessToken, data.refreshToken, data.userId);
    } catch (e) {
      Alert.alert('Échec', e instanceof ApiError ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.title}>ECOPYE</Text>
        <Text style={styles.subtitle}>Connexion à votre compte</Text>

        <TextInput
          style={styles.input}
          placeholder="+213555123456"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="PIN (6 chiffres)"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPin}
        />
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '600', color: '#0f766e', marginBottom: 4 },
  subtitle: { color: '#64748b', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0d9488',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
