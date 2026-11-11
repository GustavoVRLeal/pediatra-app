import Constants from 'expo-constants';

/* Endereço do backend.
   No celular, "localhost" é o próprio celular, então usamos o IP do PC:
   o Expo informa o endereço do servidor de desenvolvimento (hostUri),
   que roda no mesmo PC que o backend. Pode ser sobrescrito no .env com
   EXPO_PUBLIC_API_URL=http://192.168.x.x:3000 */
function devHost(): string {
  const hostUri = Constants.expoConfig?.hostUri; // ex.: "192.168.0.10:8081"
  return hostUri ? hostUri.split(':')[0] : 'localhost';
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost()}:3000`;
