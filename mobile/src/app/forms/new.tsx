import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { apiRequest } from '@/services/api';
import { FormField } from '@/components/FormField';
import { colors, ui } from '@/theme';

/* Criação de formulário para um paciente (recebe o patientId pela rota).
   O formulário nasce como rascunho (DRAFT); as perguntas são adicionadas depois. */
export default function NewFormScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setTitleError('Informe o título do formulário');
      return;
    }

    setSubmitError(null);
    setSaving(true);
    try {
      await apiRequest('/forms', {
        method: 'POST',
        token,
        body: {
          patientId,
          title: title.trim(),
          // Descrição é opcional: não envia string vazia
          description: description.trim() || undefined,
        },
      });
      router.back(); // a tela do paciente recarrega ao voltar
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Novo formulário' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="Título"
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            setTitleError(undefined);
          }}
          error={titleError}
          placeholder="Ex.: Consulta de rotina - 2 anos"
        />
        <FormField
          label="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Orientações para o responsável"
          multiline
          style={styles.multiline}
        />

        {submitError && <Text style={[ui.error, styles.submitError]}>{submitError}</Text>}

        <Pressable style={[ui.button, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={ui.buttonText}>Criar formulário</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitError: {
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
