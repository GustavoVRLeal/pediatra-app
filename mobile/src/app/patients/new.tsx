import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import { FormField } from '@/components/FormField';
import { maskDate, parseBrDate, parsePositiveNumber } from '@/utils/format';
import { colors, ui } from '@/theme';

const emptyForm = {
  name: '',
  birthDate: '',
  weight: '',
  height: '',
  guardianName: '',
  guardianEmail: '',
  guardianPhone: '',
};

type FormValues = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const required = 'Campo obrigatório';

  if (!values.name.trim()) errors.name = required;
  if (!parseBrDate(values.birthDate)) errors.birthDate = 'Informe uma data válida (DD/MM/AAAA)';
  if (parsePositiveNumber(values.weight) === null) errors.weight = 'Informe o peso em kg';
  if (parsePositiveNumber(values.height) === null) errors.height = 'Informe a altura em cm';
  if (!values.guardianName.trim()) errors.guardianName = required;
  if (!/^\S+@\S+\.\S+$/.test(values.guardianEmail.trim())) errors.guardianEmail = 'Informe um e-mail válido';
  if (values.guardianPhone.replace(/\D/g, '').length < 10) errors.guardianPhone = 'Informe o telefone com DDD';

  return errors;
}

/* Cadastro de paciente. O pediatra responsável é o usuário logado (definido pelo backend). */
export default function NewPatientScreen() {
  const { token } = useAuth();
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSave() {
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setSubmitError('Revise os campos destacados.');
      return;
    }

    setSubmitError(null);
    setSaving(true);
    try {
      await apiRequest('/patients', {
        method: 'POST',
        token,
        body: {
          name: values.name.trim(),
          birthDate: parseBrDate(values.birthDate),
          weight: parsePositiveNumber(values.weight),
          height: parsePositiveNumber(values.height),
          guardianName: values.guardianName.trim(),
          guardianEmail: values.guardianEmail.trim(),
          guardianPhone: values.guardianPhone.trim(),
        },
      });
      router.back(); // a lista recarrega ao voltar
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Novo paciente' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Criança</Text>
        <FormField label="Nome" value={values.name} onChangeText={(v) => set('name', v)} error={errors.name} autoCapitalize="words" />
        <FormField
          label="Data de nascimento"
          value={values.birthDate}
          onChangeText={(v) => set('birthDate', maskDate(v))}
          error={errors.birthDate}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
        />
        <FormField label="Peso (kg)" value={values.weight} onChangeText={(v) => set('weight', v)} error={errors.weight} placeholder="Ex.: 12,5" keyboardType="decimal-pad" />
        <FormField label="Altura (cm)" value={values.height} onChangeText={(v) => set('height', v)} error={errors.height} placeholder="Ex.: 85" keyboardType="decimal-pad" />

        <Text style={styles.section}>Responsável</Text>
        <FormField label="Nome" value={values.guardianName} onChangeText={(v) => set('guardianName', v)} error={errors.guardianName} autoCapitalize="words" />
        <FormField
          label="E-mail"
          value={values.guardianEmail}
          onChangeText={(v) => set('guardianEmail', v)}
          error={errors.guardianEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          label="Telefone"
          value={values.guardianPhone}
          onChangeText={(v) => set('guardianPhone', v)}
          error={errors.guardianPhone}
          placeholder="(11) 91234-5678"
          keyboardType="phone-pad"
        />

        {submitError && <Text style={[ui.error, styles.submitError]}>{submitError}</Text>}

        <Pressable style={[ui.button, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={ui.buttonText}>Salvar paciente</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },
  submitError: {
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
