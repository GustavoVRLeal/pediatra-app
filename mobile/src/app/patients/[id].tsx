import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import type { Patient } from '@/types';
import { formatAge, formatDate, formatNumber } from '@/utils/format';
import { colors, ui } from '@/theme';

/* Detalhes do paciente. Os formulários do paciente entram aqui na etapa 5.5. */
export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiRequest<Patient>(`/patients/${id}`, { token })
      .then(setPatient)
      .catch((err: Error) => setError(err.message));
  }, [id, token]);

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

const styles = StyleSheet.create({
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
