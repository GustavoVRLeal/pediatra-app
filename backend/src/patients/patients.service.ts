import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

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

  /* Atualiza os dados do paciente (ex.: peso e altura a cada consulta).
     Valida apenas os campos enviados. */
  async update(id: string, pediatricianId: string, data: UpdatePatientDto) {
    await this.findOne(id, pediatricianId);

    const changes: Prisma.PatientUpdateInput = {};

    // Textos obrigatórios: se enviados, não podem ficar vazios
    for (const field of ['name', 'guardianName'] as const) {
      if (data[field] !== undefined) {
        const value = typeof data[field] === 'string' ? data[field].trim() : '';
        if (!value) {
          throw new BadRequestException(
            field === 'name'
              ? 'O nome do paciente é obrigatório'
              : 'O nome do responsável é obrigatório',
          );
        }
        changes[field] = value;
      }
    }

    if (data.birthDate !== undefined) {
      const match =
        typeof data.birthDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(data.birthDate);
      const date = new Date(`${data.birthDate}T00:00:00Z`);
      if (
        !match ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== data.birthDate ||
        date.getTime() > Date.now()
      ) {
        throw new BadRequestException(
          'Data de nascimento inválida (use YYYY-MM-DD, sem datas futuras)',
        );
      }
      changes.birthDate = date;
    }

    for (const field of ['weight', 'height'] as const) {
      if (data[field] !== undefined) {
        const value = data[field];
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
          throw new BadRequestException(
            `${field === 'weight' ? 'O peso' : 'A altura'} deve ser um número positivo`,
          );
        }
        changes[field] = value;
      }
    }

    if (data.guardianEmail !== undefined) {
      const email =
        typeof data.guardianEmail === 'string' ? data.guardianEmail.trim() : '';
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new BadRequestException('E-mail do responsável inválido');
      }
      changes.guardianEmail = email;
    }

    if (data.guardianPhone !== undefined) {
      const phone =
        typeof data.guardianPhone === 'string' ? data.guardianPhone.trim() : '';
      if (phone.replace(/\D/g, '').length < 10) {
        throw new BadRequestException('Informe o telefone do responsável com DDD');
      }
      changes.guardianPhone = phone;
    }

    return this.prisma.patient.update({
      where: { id },
      data: changes,
    });
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
