import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { FormField } from '@/components/FormField';
import { colors, ui } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;

const emptyValues = {
  name: '',
  crm: '',
  email: '',
  password: '',
  confirmPassword: '',
};

type Values = typeof emptyValues;
type Errors = Partial<Record<keyof Values, string>>;

/* Mesmas regras do backend (POST /auth/register), mais a confirmação de senha */
function validate(values: Values): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) errors.name = 'Informe seu nome';
  if (!values.crm.trim()) errors.crm = 'Informe o CRM';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Informe um e-mail válido';
  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'As senhas não conferem';
  }

  return errors;
}

/* Cadastro do pediatra. Após cadastrar, já entra no app (o backend devolve o token). */
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleRegister() {
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setSubmitError(null);
      return;
    }

    setSubmitError(null);
    setLoading(true);
    try {
      await signUp({
        name: values.name.trim(),
        crm: values.crm.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.replace('/');
    } catch (err) {
      // Ex.: 409 "Este e-mail já está cadastrado"
      setSubmitError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Cadastro do pediatra</Text>

          <FormField
            label="Nome"
            value={values.name}
            onChangeText={(v) => set('name', v)}
            error={errors.name}
            placeholder="Ex.: Dra. Ana Souza"
            autoCapitalize="words"
          />
          <FormField
            label="CRM"
            value={values.crm}
            onChangeText={(v) => set('crm', v)}
            error={errors.crm}
            placeholder="Ex.: 123456/SP"
            autoCapitalize="characters"
          />
          <FormField
            label="E-mail"
            value={values.email}
            onChangeText={(v) => set('email', v)}
            error={errors.email}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <FormField
            label="Senha"
            value={values.password}
            onChangeText={(v) => set('password', v)}
            error={errors.password}
            placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <FormField
            label="Confirmar senha"
            value={values.confirmPassword}
            onChangeText={(v) => set('confirmPassword', v)}
            error={errors.confirmPassword}
            placeholder="Digite a senha novamente"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            onSubmitEditing={handleRegister}
          />

          {/* Mostra/oculta as duas senhas ao mesmo tempo */}
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            style={styles.toggle}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>{showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
          </Pressable>

          {submitError && <Text style={[ui.error, styles.submitError]}>{submitError}</Text>}

          <Pressable
            style={[ui.button, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={ui.buttonText}>Cadastrar</Text>}
          </Pressable>

          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.footer} disabled={loading}>
            <Text style={styles.footerText}>
              Já tem conta? <Text style={styles.linkText}>Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
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
  toggle: {
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: 16,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitError: {
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.muted,
  },
});
