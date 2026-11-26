import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import type { FormResponse } from '@/types';
import { formatDateTime } from '@/utils/format';
import { formatAnswer, questionTypeLabel } from '@/utils/formStatus';
import { colors, ui } from '@/theme';

/* Um preenchimento do formulário: cada pergunta com a resposta do responsável.
   Rota: /responses/view?formId=...&responseId=...&title=... */
export default function ResponseViewScreen() {
  const { formId, responseId, title } = useLocalSearchParams<{
    formId: string;
    responseId: string;
    title?: string;
  }>();
  const { token } = useAuth();
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<FormResponse>(`/forms/${formId}/responses/${responseId}`, { token })
      .then(setResponse)
      .catch((err: Error) => setError(err.message));
  }, [formId, responseId, token]);

  if (error) {
    return <Text style={[ui.error, styles.margin]}>{error}</Text>;
  }

  if (!response) {
    return <ActivityIndicator style={styles.margin} color={colors.primary} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Resposta' }} />

      <View style={styles.header}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.muted}>Enviado em {formatDateTime(response.submittedAt)}</Text>
      </View>

      {response.answers.length === 0 && (
        <Text style={styles.muted}>Este envio não possui respostas.</Text>
      )}

      {response.answers.map((a, index) => {
        const text = formatAnswer(a.type, a.answer);
        const empty = a.answer.trim() === '';
        return (
          <View key={a.questionId} style={styles.card}>
            <Text style={styles.question}>
              {index + 1}. {a.question}
            </Text>
            <Text style={[styles.answer, empty && styles.empty]}>{text}</Text>
            <Text style={styles.type}>{questionTypeLabel[a.type]}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  margin: {
    margin: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
    gap: 6,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  answer: {
    fontSize: 17,
    color: colors.primary,
  },
  empty: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  type: {
    fontSize: 12,
    color: colors.muted,
  },
});
