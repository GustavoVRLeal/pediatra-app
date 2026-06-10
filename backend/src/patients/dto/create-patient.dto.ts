export class CreatePatientDto {
  name!: string;
  birthDate!: string;
  weight!: number;
  height!: number;
  guardianName!: string;
  guardianEmail!: string;
  guardianPhone!: string;
  pediatricianId!: string;
}
