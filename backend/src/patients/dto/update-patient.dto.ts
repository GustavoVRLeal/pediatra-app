/* Todos os campos são opcionais: envia-se apenas o que for alterado.
   pediatricianId não pode ser alterado (vem sempre do token). */
export class UpdatePatientDto {
  name?: string;
  birthDate?: string; // "YYYY-MM-DD"
  weight?: number;
  height?: number;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
}
