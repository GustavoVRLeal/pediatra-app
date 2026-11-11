/* Tipos dos dados retornados pelo backend. */

export interface Patient {
  id: string;
  name: string;
  birthDate: string; // ISO, ex.: "2022-03-10T00:00:00.000Z"
  weight: number;
  height: number;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  pediatricianId: string;
  createdAt: string;
}
