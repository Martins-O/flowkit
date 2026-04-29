import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { createClient, createEndpoints } from '@flowkit/api-client';
import { useTimerStore } from '../src/store/timerStore.js';

const BASE_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useTimerStore((s) => s.setAuth);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const client = createClient({ baseUrl: BASE_URL, getAccessToken: () => null });
      const api = createEndpoints(client);
      const { accessToken, user } = await api.auth.login({ email, password });
      setAuth(accessToken, user.id);
      router.replace('/(tabs)/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Flowkit</Text>
        <Text style={styles.subtitle}>Sign in to sync your sessions</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 32, fontWeight: '700', color: '#f0eff8', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 16 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1a1a24',
    borderWidth: 1,
    borderColor: '#2a2a38',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#f0eff8',
  },
  error: { fontSize: 13, color: '#E24B4A' },
  button: {
    backgroundColor: '#534AB7',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
