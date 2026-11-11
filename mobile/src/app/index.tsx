import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { ApiError, apiRequest } from '@/services/api';
import { colors, ui } from '@/theme';

/* Tela inicial provisória: confirma que o token funciona buscando os pacientes.
   Será substituída pela lista de pacientes na etapa 5.4. */
export default function HomeScreen() {
  const { token, signOut } = useAuth();
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<unknown[]>('/patients', { token })
      .then((patients) => setPatientCount(patients.length))
      .catch((err: ApiError) => {
        if (err.status === 401) signOut(); // token inválido ou expirado
        else setError(err.message);
      });
  }, [token, signOut]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Bem-vindo!</Text>

        {error ? (
          <Text style={ui.error}>{error}</Text>
        ) : patientCount === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.text}>
            Você tem {patientCount}{' '}
            {patientCount === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}.
          </Text>
        )}
      </View>

      <Pressable style={ui.buttonOutline} onPress={signOut}>
        <Text style={ui.buttonOutlineText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
});
