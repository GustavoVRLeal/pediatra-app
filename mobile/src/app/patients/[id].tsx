import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import type { Form, Patient } from '@/types';
import { formatAge, formatDate, formatNumber } from '@/utils/format';
import { formStatusInfo } from '@/utils/formStatus';
import { colors, ui } from '@/theme';

/* Detalhes do paciente e a lista dos formulários dele. */
export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [forms, setForms] = useState<Form[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Recarrega ao voltar para a tela (ex.: depois de criar um formulário)
  useFocusEffect(
    useCallback(() => {
      Promise.all([
        apiRequest<Patient>(`/patients/${id}`, { token }),
        apiRequest<Form[]>(`/forms?patientId=${id}`, { token }),
      ])
        .then(([patientData, formsData]) => {
          setPatient(patientData);
          setForms(formsData);
          setError(null);
        })
        .catch((err: Error) => setError(err.message));
    }, [id, token]),
  );

  function confirmDelete() {
    Alert.alert(
      'Excluir paciente',
      `Deseja realmente excluir ${patient?.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest(`/patients/${id}`, { method: 'DELETE', token });
      router.back();
    } catch (err) {
      // Ex.: 409 quando o paciente já possui formulários
      Alert.alert('Não foi possível excluir', (err as Error).message);
      setDeleting(false);
    }
  }

  if (error) {
    return <Text style={[ui.error, styles.margin]}>{error}</Text>;
  }

  if (!patient) {
    return <ActivityIndicator style={styles.margin} color={colors.primary} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: patient.name }} />

      <View style={styles.card}>
        <Text style={styles.section}>Criança</Text>
        <Row label="Nascimento" value={`${formatDate(patient.birthDate)} (${formatAge(patient.birthDate)})`} />
        <Row label="Peso" value={`${formatNumber(patient.weight)} kg`} />
        <Row label="Altura" value={`${formatNumber(patient.height)} cm`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Responsável</Text>
        <Row label="Nome" value={patient.guardianName} />
        <Row label="E-mail" value={patient.guardianEmail} />
        <Row label="Telefone" value={patient.guardianPhone} />
      </View>

      <Link href={{ pathname: '/patients/edit', params: { id: patient.id } }} asChild>
        <Pressable style={ui.buttonOutline}>
          <Text style={styles.newFormText}>Editar dados do paciente</Text>
        </Pressable>
      </Link>

      <View style={styles.card}>
        <Text style={styles.section}>Formulários</Text>

        {forms?.length === 0 && (
          <Text style={styles.empty}>Nenhum formulário criado para este paciente.</Text>
        )}

        {forms?.map((form) => (
          <FormItem key={form.id} form={form} />
        ))}

        <Link href={{ pathname: '/forms/new', params: { patientId: patient.id } }} asChild>
          <Pressable style={ui.buttonOutline}>
            <Text style={styles.newFormText}>+ Novo formulário</Text>
          </Pressable>
        </Link>
      </View>

      <Pressable style={[styles.deleteButton, deleting && styles.disabled]} onPress={confirmDelete} disabled={deleting}>
        <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir paciente'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* Um formulário da lista: título, status, data e contadores. Toque abre a tela do formulário. */
function FormItem({ form }: { form: Form }) {
  const status = formStatusInfo[form.status];
  const questions = form._count?.questions ?? 0;
  const responses = form._count?.responses ?? 0;

  return (
    <Link href={{ pathname: '/forms/[id]', params: { id: form.id } }} asChild>
      <Pressable style={styles.formItem}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle} numberOfLines={2}>{form.title}</Text>
          <Text style={[styles.badge, { color: status.color, backgroundColor: status.bg }]}>
            {status.label}
          </Text>
        </View>
        <Text style={styles.formInfo}>
          Criado em {formatDate(form.createdAt)} · {questions} {questions === 1 ? 'pergunta' : 'perguntas'} ·{' '}
          {responses} {responses === 1 ? 'resposta' : 'respostas'}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 15,
    color: colors.muted,
  },
  formItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  formTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  formInfo: {
    fontSize: 13,
    color: colors.muted,
  },
  newFormText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  margin: {
    margin: 16,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  rowValue: {
    fontSize: 16,
    color: colors.text,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
