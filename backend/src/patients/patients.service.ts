import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

/* Todas as operações são restritas aos pacientes do pediatra autenticado.
   Pacientes de outros pediatras retornam 404, sem revelar que existem. */
@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  private readonly pediatricianSelect = {
    select: {
      id: true,
      name: true,
      email: true,
      crm: true,
    },
  };

  async create(data: CreatePatientDto, pediatricianId: string) {
    return this.prisma.patient.create({
      data: {
        name: data.name,
        birthDate: new Date(data.birthDate),
        weight: data.weight,
        height: data.height,
        guardianName: data.guardianName,
        guardianEmail: data.guardianEmail,
        guardianPhone: data.guardianPhone,
        pediatricianId,
      },
    });
  }

  async findAll(pediatricianId: string) {
    return this.prisma.patient.findMany({
      where: { pediatricianId },
      include: {
        pediatrician: this.pediatricianSelect,
      },
    });
  }

  async findOne(id: string, pediatricianId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, pediatricianId },
      include: {
        pediatrician: this.pediatricianSelect,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  async remove(id: string, pediatricianId: string) {
    await this.findOne(id, pediatricianId);

    return this.prisma.patient.delete({
      where: {
        id,
      },
    });
  }
}
