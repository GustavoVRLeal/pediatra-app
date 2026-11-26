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

type Action = 'generate' | 'close' | 'reopen';

/* Cartão do link público. Conforme o status do formulário:
   - Rascunho: gera o link (status passa a "Enviado") e abre o compartilhamento;
   - Enviado/Respondido: compartilha, gera um novo link ou encerra;
   - Encerrado: reabre com o mesmo link. */
export function PublicLinkCard({ form, token, onChanged }: Props) {
  const [busy, setBusy] = useState<Action | null>(null);

  const isClosed = form.status === 'CLOSED';
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
    setBusy('generate');
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
      setBusy(null);
    }
  }

  /* Encerrar e reabrir: só mudam o status, o link continua o mesmo */
  async function changeStatus(action: 'close' | 'reopen') {
    setBusy(action);
    try {
      await apiRequest(`/forms/${form.id}/${action}`, { method: 'POST', token });
      await onChanged();
    } catch (err) {
      Alert.alert(
        action === 'close' ? 'Não foi possível encerrar' : 'Não foi possível reabrir',
        (err as Error).message,
      );
    } finally {
      setBusy(null);
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

  function confirmClose() {
    Alert.alert(
      'Encerrar formulário',
      'O link deixará de aceitar respostas. As respostas já recebidas continuam no histórico, e você poderá reabrir depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar', style: 'destructive', onPress: () => changeStatus('close') },
      ],
    );
  }

  /* Botão com indicador de carregamento enquanto a ação roda */
  function ActionButton({
    action,
    label,
    onPress,
    variant,
  }: {
    action: Action;
    label: string;
    onPress: () => void;
    variant: 'primary' | 'outline' | 'danger';
  }) {
    const disabled = busy !== null || (action === 'generate' && noQuestions);
    const style =
      variant === 'primary' ? ui.button : variant === 'danger' ? styles.dangerButton : ui.buttonOutline;
    const textStyle =
      variant === 'primary' ? ui.buttonText : variant === 'danger' ? styles.dangerText : ui.buttonOutlineText;

    return (
      <Pressable style={[style, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
        {busy === action ? (
          <ActivityIndicator color={variant === 'primary' ? '#ffffff' : colors.primary} />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.section}>Link para o responsável</Text>

      {isClosed ? (
        <>
          <Text style={styles.closed}>
            Formulário encerrado: o link não aceita novas respostas. Ao reabrir, o mesmo link volta a
            funcionar.
          </Text>
          <ActionButton action="reopen" label="Reabrir formulário" onPress={() => changeStatus('reopen')} variant="primary" />
        </>
      ) : activeLink ? (
        <>
          <Text style={styles.link} selectable>
            {activeLink}
          </Text>
          <Pressable
            style={[ui.button, busy !== null && styles.disabled]}
            onPress={() => shareLink(activeLink)}
            disabled={busy !== null}
          >
            <Text style={ui.buttonText}>Compartilhar link</Text>
          </Pressable>
          <ActionButton action="generate" label="Gerar novo link" onPress={confirmRegenerate} variant="outline" />
          <ActionButton action="close" label="Encerrar formulário" onPress={confirmClose} variant="danger" />
        </>
      ) : (
        <>
          <Text style={styles.muted}>
            {noQuestions
              ? 'Adicione pelo menos uma pergunta para poder enviar o formulário.'
              : `Gere o link e envie para ${form.patient.guardianName} preencher, sem precisar de cadastro.`}
          </Text>
          <ActionButton action="generate" label="Gerar link e compartilhar" onPress={generate} variant="primary" />
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
  closed: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: 10,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
