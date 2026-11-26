import { router, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import { PatientForm, type PatientPayload } from '@/components/PatientForm';

/* Cadastro de paciente. O pediatra responsável é o usuário logado (definido pelo backend). */
export default function NewPatientScreen() {
  const { token } = useAuth();

  async function handleCreate(payload: PatientPayload) {
    await apiRequest('/patients', { method: 'POST', token, body: payload });
    router.back(); // a lista recarrega ao voltar
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Novo paciente' }} />
      <PatientForm submitLabel="Salvar paciente" onSubmit={handleCreate} />
    </>
  );
}
