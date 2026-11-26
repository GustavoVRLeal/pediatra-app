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
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import type { FormResponsesList } from '@/types';
import { formatDateTime } from '@/utils/format';
import { colors, ui } from '@/theme';

/* Histórico de respostas de um formulário. Cada item abre /responses/view.
   Rota: /responses/list?formId=... */
export default function ResponsesScreen() {
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const { token } = useAuth();
  const [data, setData] = useState<FormResponsesList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await apiRequest<FormResponsesList>(`/forms/${formId}/responses`, { token }));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [formId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Puxar a lista para baixo atualiza (útil enquanto espera o responsável responder)
  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (error) {
    return <Text style={[ui.error, styles.margin]}>{error}</Text>;
  }

  if (!data) {
    return <ActivityIndicator style={styles.margin} color={colors.primary} />;
  }

  const total = data.responses.length;

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: 'Histórico de respostas' }} />
      <FlatList
        data={data.responses}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{data.form.title}</Text>
            <Text style={styles.muted}>
              {total} {total === 1 ? 'resposta recebida' : 'respostas recebidas'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma resposta recebida ainda.{'\n'}Puxe a tela para baixo para atualizar.
          </Text>
        }
        renderItem={({ item, index }) => {
          const answered = item.answers.filter((a) => a.answer.trim() !== '').length;
          return (
            <Link
              href={{
                pathname: '/responses/view',
                params: { formId: data.form.id, responseId: item.id, title: data.form.title },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                {/* A lista vem da mais recente para a mais antiga */}
                <Text style={styles.cardTitle}>Resposta #{total - index}</Text>
                <Text style={styles.muted}>
                  {formatDateTime(item.submittedAt)} · {answered}{' '}
                  {answered === 1 ? 'pergunta respondida' : 'perguntas respondidas'}
                </Text>
              </Pressable>
            </Link>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  margin: {
    margin: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
    marginBottom: 4,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 15,
    marginTop: 32,
    lineHeight: 22,
  },
});
