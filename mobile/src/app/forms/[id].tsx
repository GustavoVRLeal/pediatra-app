import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import { FormField } from '@/components/FormField';
import { PublicLinkCard } from '@/components/PublicLinkCard';
import type { FormDetail } from '@/types';
import { formatDate } from '@/utils/format';
import { formStatusInfo, questionTypeLabel } from '@/utils/formStatus';
import { colors, ui } from '@/theme';

/* Tela do formulário: dados, edição de título/descrição, perguntas e exclusão.
   As perguntas são criadas/editadas em /questions/edit, o link público
   fica no PublicLinkCard e o histórico de respostas abre em /responses/list. */
export default function FormDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modo de edição (na própria tela)
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadForm = useCallback(async () => {
    try {
      const data = await apiRequest<FormDetail>(`/forms/${id}`, { token });
      setForm(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id, token]);

  // Puxar a tela para baixo atualiza (status e quantidade de respostas)
  async function handleRefresh() {
    setRefreshing(true);
    await loadForm();
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadForm();
    }, [loadForm]),
  );

  function startEditing() {
    if (!form) return;
    setTitle(form.title);
    setDescription(form.description ?? '');
    setTitleError(undefined);
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleError('Informe o título do formulário');
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await apiRequest(`/forms/${id}`, {
        method: 'PATCH',
        token,
        // Descrição vazia remove a descrição (o backend grava null)
        body: { title: title.trim(), description: description.trim() },
      });
      await loadForm();
      setEditing(false);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir formulário',
      `Deseja realmente excluir "${form?.title}" e suas perguntas? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest(`/forms/${id}`, { method: 'DELETE', token });
      router.back(); // a tela do paciente recarrega ao voltar
    } catch (err) {
      // Ex.: 409 quando o formulário já possui respostas
      Alert.alert('Não foi possível excluir', (err as Error).message);
      setDeleting(false);
    }
  }

  if (error) {
    return <Text style={[ui.error, styles.margin]}>{error}</Text>;
  }

  if (!form) {
    return <ActivityIndicator style={styles.margin} color={colors.primary} />;
  }

  const status = formStatusInfo[form.status];
  const responses = form._count?.responses ?? 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Formulário' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.card}>
          {editing ? (
            <>
              <FormField
                label="Título"
                value={title}
                onChangeText={(v) => {
                  setTitle(v);
                  setTitleError(undefined);
                }}
                error={titleError}
              />
              <FormField
                label="Descrição (opcional)"
                value={description}
                onChangeText={setDescription}
                multiline
                style={styles.multiline}
              />

              {saveError && <Text style={ui.error}>{saveError}</Text>}

              <Pressable style={[ui.button, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={ui.buttonText}>Salvar</Text>}
              </Pressable>
              <Pressable style={ui.buttonOutline} onPress={() => setEditing(false)} disabled={saving}>
                <Text style={ui.buttonOutlineText}>Cancelar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{form.title}</Text>
                <Text style={[styles.badge, { color: status.color, backgroundColor: status.bg }]}>
                  {status.label}
                </Text>
              </View>
              {form.description ? (
                <Text style={styles.description}>{form.description}</Text>
              ) : (
                <Text style={styles.muted}>Sem descrição</Text>
              )}
              <Text style={styles.muted}>
                Paciente: {form.patient.name}
                {'\n'}Criado em {formatDate(form.createdAt)} · {responses}{' '}
                {responses === 1 ? 'resposta recebida' : 'respostas recebidas'}
              </Text>

              <Pressable style={ui.buttonOutline} onPress={startEditing}>
                <Text style={styles.linkText}>Editar título e descrição</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Perguntas ({form.questions.length})</Text>

          {form.questions.length === 0 && (
            <Text style={styles.muted}>Nenhuma pergunta adicionada ainda.</Text>
          )}

          {form.questions.map((q, index) => (
            <Link
              key={q.id}
              href={{ pathname: '/questions/edit', params: { formId: form.id, questionId: q.id } }}
              asChild
            >
              <Pressable style={styles.question}>
                <Text style={styles.questionText}>
                  {index + 1}. {q.question}
                  {q.required && <Text style={styles.required}> *</Text>}
                </Text>
                <Text style={styles.muted}>
                  {questionTypeLabel[q.type]}
                  {q.type === 'MULTIPLE_CHOICE' && `: ${q.options.join(', ')}`}
                </Text>
              </Pressable>
            </Link>
          ))}

          <Link href={{ pathname: '/questions/edit', params: { formId: form.id } }} asChild>
            <Pressable style={ui.buttonOutline}>
              <Text style={styles.linkText}>+ Adicionar pergunta</Text>
            </Pressable>
          </Link>
          <Link href={{ pathname: '/responses/list', params: { formId: form.id } }} asChild>
            <Pressable style={ui.button}>
              <Text style={ui.buttonText}>Ver histórico de respostas ({responses})</Text>
            </Pressable>
          </Link>
          {form.questions.length > 0 && (
            <Text style={styles.hint}>Toque em uma pergunta para editar ou excluir.</Text>
          )}
        </View>

        <PublicLinkCard form={form} token={token} onChanged={loadForm} />

        <Pressable
          style={[styles.deleteButton, (deleting || editing) && styles.disabled]}
          onPress={confirmDelete}
          disabled={deleting || editing}
        >
          <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir formulário'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  margin: {
    margin: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
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
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  question: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 2,
  },
  questionText: {
    fontSize: 16,
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
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
