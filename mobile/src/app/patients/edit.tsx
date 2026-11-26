import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import { PatientForm, type PatientPayload } from '@/components/PatientForm';
import type { Patient } from '@/types';
import { colors, ui } from '@/theme';

/* Edição dos dados do paciente (ex.: atualizar peso e altura a cada consulta).
   Rota: /patients/edit?id=... */
export default function EditPatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Patient>(`/patients/${id}`, { token })
      .then(setPatient)
      .catch((err: Error) => setError(err.message));
  }, [id, token]);

  async function handleUpdate(payload: PatientPayload) {
    await apiRequest(`/patients/${id}`, { method: 'PATCH', token, body: payload });
    router.back(); // a tela de detalhes recarrega ao voltar
  }

  if (error) {
    return <Text style={[ui.error, styles.margin]}>{error}</Text>;
  }

  if (!patient) {
    return <ActivityIndicator style={styles.margin} color={colors.primary} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar paciente' }} />
      <PatientForm initialPatient={patient} submitLabel="Salvar alterações" onSubmit={handleUpdate} />
    </>
  );
}

const styles = StyleSheet.create({
  margin: {
    margin: 16,
  },
});
