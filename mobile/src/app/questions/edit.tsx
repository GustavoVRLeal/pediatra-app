import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import { FormField } from '@/components/FormField';
import type { Question, QuestionType } from '@/types';
import { questionTypeLabel } from '@/utils/formStatus';
import { colors, ui } from '@/theme';

const TYPES = Object.keys(questionTypeLabel) as QuestionType[];

/* Valida no app as mesmas regras do backend, para mostrar o erro antes de enviar. */
function validate(text: string, type: QuestionType, options: string[]): string | null {
  if (!text.trim()) return 'Informe o texto da pergunta.';
  if (type === 'MULTIPLE_CHOICE') {
    const cleaned = options.map((o) => o.trim());
    if (cleaned.some((o) => o === '')) return 'Preencha ou remova as opções vazias.';
    if (cleaned.length < 2) return 'Informe pelo menos 2 opções.';
    if (new Set(cleaned.map((o) => o.toLowerCase())).size !== cleaned.length) {
      return 'As opções não podem se repetir.';
    }
  }
  return null;
}

/* Criação e edição de pergunta.
   Rota: /questions/edit?formId=... (nova) ou ?formId=...&questionId=... (edição). */
export default function QuestionEditScreen() {
  const { formId, questionId } = useLocalSearchParams<{ formId: string; questionId?: string }>();
  const isEdit = !!questionId;
  const { token } = useAuth();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState(0); // respostas já recebidas por esta pergunta

  const [text, setText] = useState('');
  const [type, setType] = useState<QuestionType>('TEXT');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '']);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Na edição, carrega a pergunta (com a contagem de respostas)
  useEffect(() => {
    if (!isEdit) return;
    apiRequest<Question[]>(`/forms/${formId}/questions`, { token })
      .then((questions) => {
        const q = questions.find((item) => item.id === questionId);
        if (!q) throw new Error('Pergunta não encontrada');
        setText(q.question);
        setType(q.type);
        setRequired(q.required);
        setOptions(q.type === 'MULTIPLE_CHOICE' ? q.options : ['', '']);
        setAnswers(q._count?.answers ?? 0);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, formId, questionId, token]);

  const hasAnswers = answers > 0;

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
    setError(null);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  async function handleSave() {
    const validation = validate(text, type, options);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);
    setSaving(true);
    const body = {
      question: text.trim(),
      type,
      required,
      options: type === 'MULTIPLE_CHOICE' ? options.map((o) => o.trim()) : [],
    };

    try {
      if (isEdit) {
        await apiRequest(`/forms/${formId}/questions/${questionId}`, { method: 'PATCH', token, body });
      } else {
        await apiRequest(`/forms/${formId}/questions`, { method: 'POST', token, body });
      }
      router.back(); // a tela do formulário recarrega ao voltar
    } catch (err) {
      // Ex.: 409 ao remover uma opção que já foi respondida
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Excluir pergunta', 'Deseja realmente excluir esta pergunta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest(`/forms/${formId}/questions/${questionId}`, { method: 'DELETE', token });
      router.back();
    } catch (err) {
      Alert.alert('Não foi possível excluir', (err as Error).message);
      setDeleting(false);
    }
  }

  const title = isEdit ? 'Editar pergunta' : 'Nova pergunta';

  if (loading) {
    return <ActivityIndicator style={styles.margin} color={colors.primary} />;
  }

  if (loadError) {
    return <Text style={[ui.error, styles.margin]}>{loadError}</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {hasAnswers && (
          <Text style={styles.notice}>
            Esta pergunta já tem {answers} {answers === 1 ? 'resposta' : 'respostas'}. Para preservar o
            histórico, o tipo não pode ser alterado, opções já respondidas não podem ser removidas e a
            pergunta não pode ser excluída.
          </Text>
        )}

        <FormField
          label="Pergunta"
          value={text}
          onChangeText={(v) => {
            setText(v);
            setError(null);
          }}
          placeholder="Ex.: A criança dorme bem à noite?"
          multiline
          style={styles.multiline}
        />

        <Text style={ui.label}>Tipo de resposta</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => {
            const selected = t === type;
            return (
              <Pressable
                key={t}
                style={[styles.chip, selected && styles.chipSelected, hasAnswers && !selected && styles.disabled]}
                onPress={() => {
                  setType(t);
                  setError(null);
                }}
                disabled={hasAnswers}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {questionTypeLabel[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {type === 'MULTIPLE_CHOICE' && (
          <View style={styles.options}>
            <Text style={ui.label}>Opções</Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  style={[ui.input, styles.optionInput]}
                  value={option}
                  onChangeText={(v) => updateOption(index, v)}
                  placeholder={`Opção ${index + 1}`}
                  placeholderTextColor={colors.muted}
                />
                <Pressable onPress={() => removeOption(index)} hitSlop={8} style={styles.removeOption}>
                  <Text style={styles.removeOptionText}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => setOptions((prev) => [...prev, ''])} hitSlop={8}>
              <Text style={styles.addOption}>+ Adicionar opção</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={ui.label}>Obrigatória</Text>
            <Text style={styles.muted}>O responsável precisa responder para enviar.</Text>
          </View>
          <Switch
            value={required}
            onValueChange={setRequired}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {error && <Text style={[ui.error, styles.error]}>{error}</Text>}

        <Pressable style={[ui.button, saving && styles.disabled]} onPress={handleSave} disabled={saving || deleting}>
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={ui.buttonText}>{isEdit ? 'Salvar alterações' : 'Adicionar pergunta'}</Text>
          )}
        </Pressable>

        {isEdit && (
          <Pressable
            style={[styles.deleteButton, (deleting || hasAnswers) && styles.disabled]}
            onPress={confirmDelete}
            disabled={deleting || saving || hasAnswers}
          >
            <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir pergunta'}</Text>
          </Pressable>
        )}
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
  },
  notice: {
    backgroundColor: '#fff6e0',
    color: '#7a5b00',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  options: {
    marginBottom: 16,
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionInput: {
    flex: 1,
  },
  removeOption: {
    padding: 6,
  },
  removeOptionText: {
    fontSize: 18,
    color: colors.danger,
  },
  addOption: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  muted: {
    fontSize: 13,
    color: colors.muted,
  },
  error: {
    marginBottom: 16,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
