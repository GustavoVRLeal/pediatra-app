/* Cores e estilos compartilhados (mesma paleta do web-form). */
import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#f3f6f9',
  surface: '#ffffff',
  text: '#1f2a37',
  muted: '#5b6878',
  border: '#d5dde6',
  primary: '#2a7ab8',
  danger: '#c0392b',
  dangerBg: '#fdecea',
};

export const ui = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  buttonOutlineText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
});
