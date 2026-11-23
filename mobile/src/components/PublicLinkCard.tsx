import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '@/services/api';
import type { FormDetail } from '@/types';
import { colors, ui } from '@/theme';

interface Props {
  form: FormDetail;
  token: string | null;
  onChanged: () => Promise<void>; // recarrega o formulário (status e link mudam)
}

/* Cartão do link público: gera o link (status passa a "Enviado")
   e abre o compartilhamento do celular (WhatsApp, e-mail, SMS...). */
export function PublicLinkCard({ form, token, onChanged }: Props) {
  const [generating, setGenerating] = useState(false);

  // O link só funciona com o formulário Enviado ou Respondido
  const activeLink =
    form.publicLink && (form.status === 'SENT' || form.status === 'ANSWERED')
      ? form.publicLink
      : null;
  const noQuestions = form.questions.length === 0;

  async function shareLink(link: string) {
    const guardian = form.patient.guardianName.split(' ')[0];
    try {
      await Share.share({
        message:
          `Olá, ${guardian}! Por favor, preencha o formulário "${form.title}" ` +
          `sobre ${form.patient.name}:\n${link}`,
      });
    } catch (err) {
      Alert.alert('Não foi possível compartilhar', (err as Error).message);
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const { publicLink } = await apiRequest<{ publicLink: string }>(
        `/forms/${form.id}/public-link`,
        { method: 'POST', token },
      );
      await onChanged();
      await shareLink(publicLink);
    } catch (err) {
      // Ex.: 400 quando o formulário não tem perguntas
      Alert.alert('Não foi possível gerar o link', (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function confirmRegenerate() {
    Alert.alert(
      'Gerar novo link',
      'O link atual deixará de funcionar. Quem ainda não respondeu precisará receber o novo link.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Gerar novo link', onPress: generate },
      ],
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.section}>Link para o responsável</Text>

      {activeLink ? (
        <>
          <Text style={styles.link} selectable>
            {activeLink}
          </Text>
          <Pressable style={ui.button} onPress={() => shareLink(activeLink)} disabled={generating}>
            <Text style={ui.buttonText}>Compartilhar link</Text>
          </Pressable>
          <Pressable
            style={[ui.buttonOutline, generating && styles.disabled]}
            onPress={confirmRegenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={ui.buttonOutlineText}>Gerar novo link</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.muted}>
            {noQuestions
              ? 'Adicione pelo menos uma pergunta para poder enviar o formulário.'
              : `Gere o link e envie para ${form.patient.guardianName} preencher, sem precisar de cadastro.`}
          </Text>
          <Pressable
            style={[ui.button, (generating || noQuestions) && styles.disabled]}
            onPress={generate}
            disabled={generating || noQuestions}
          >
            {generating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={ui.buttonText}>Gerar link e compartilhar</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  link: {
    fontSize: 14,
    color: colors.primary,
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 10,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
