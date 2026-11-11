export class CreatePatientDto {
  name!: string;
  birthDate!: string;
  weight!: number;
  height!: number;
  guardianName!: string;
  guardianEmail!: string;
  guardianPhone!: string;
  // pediatricianId não vem mais do body: é obtido do token JWT
}
