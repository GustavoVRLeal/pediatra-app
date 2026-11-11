import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, ui } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

/* Campo de texto com rótulo e mensagem de erro, reutilizado nos cadastros. */
export function FormField({ label, error, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        style={[ui.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 4,
  },
});
