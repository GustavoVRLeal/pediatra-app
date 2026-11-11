import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, Stack, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { ApiError, apiRequest } from '@/services/api';
import type { Patient } from '@/types';
import { formatAge } from '@/utils/format';
import { colors, ui } from '@/theme';

/* Lista de pacientes do pediatra logado. */
export default function PatientsScreen() {
  const { token, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const data = await apiRequest<Patient[]>('/patients', { token });
      data.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setPatients(data);
      setError(null);
    } catch (err) {
      if ((err as ApiError).status === 401) signOut(); // token expirado
      else setError((err as Error).message);
    }
  }, [token, signOut]);

  // Recarrega sempre que a tela volta a aparecer (ex.: depois de cadastrar)
  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pacientes',
          headerRight: () => (
            <Link href="/patients/new" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.headerButton}>+ Novo</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      {error && <Text style={[ui.error, styles.margin]}>{error}</Text>}

      {patients === null && !error ? (
        <ActivityIndicator style={styles.margin} color={colors.primary} />
      ) : (
        <FlatList
          data={patients ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhum paciente cadastrado.{'\n'}Toque em “+ Novo” para começar.
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/patients/[id]', params: { id: item.id } }} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.info}>{formatAge(item.birthDate)}</Text>
                <Text style={styles.info}>Responsável: {item.guardianName}</Text>
              </Pressable>
            </Link>
          )}
          ListFooterComponent={
            <Pressable style={[ui.buttonOutline, styles.logout]} onPress={signOut}>
              <Text style={ui.buttonOutlineText}>Sair</Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  margin: {
    margin: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  headerButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  info: {
    fontSize: 14,
    color: colors.muted,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 15,
    marginTop: 32,
    lineHeight: 22,
  },
  logout: {
    marginTop: 12,
  },
});
