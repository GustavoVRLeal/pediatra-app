import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { colors, ui } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Informe o e-mail e a senha');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Acompanhamento Pediátrico</Text>
        <Text style={styles.subtitle}>Acesso do pediatra</Text>

        <View style={styles.field}>
          <Text style={ui.label}>E-mail</Text>
          <TextInput
            style={ui.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={ui.label}>Senha</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[ui.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
            />
            {/* Alterna entre mostrar e ocultar a senha digitada */}
            <Pressable
              style={styles.toggle}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Text style={styles.toggleText}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Pressable>
          </View>
        </View>

        {error && <Text style={[ui.error, styles.field]}>{error}</Text>}

        <Pressable
          style={[ui.button, loading && styles.disabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={ui.buttonText}>Entrar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  passwordWrapper: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 84, // espaço para o botão Mostrar/Ocultar
  },
  toggle: {
    position: 'absolute',
    right: 12,
    paddingVertical: 4,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
