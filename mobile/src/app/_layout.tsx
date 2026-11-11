import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

/* Rotas protegidas (Expo Router): sem token, só a tela de login fica acessível;
   com token, o login some e as telas do pediatra ficam disponíveis. */
function RootNavigator() {
  const { token } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="index" options={{ title: 'Pacientes' }} />
        <Stack.Screen name="patients/new" options={{ title: 'Novo paciente' }} />
        <Stack.Screen name="patients/[id]" options={{ title: 'Paciente' }} />
      </Stack.Protected>

      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
