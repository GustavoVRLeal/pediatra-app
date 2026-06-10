import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePatientDto, pediatricianId: string) {
    return this.prisma.patient.create({
      data: {
        ...data,
        birthDate: new Date(data.birthDate),
        pediatricianId,
      },
    });
  }

  async findAll() {
    return this.prisma.patient.findMany({
      include: {
        pediatrician: {
          select: {
            id: true,
            name: true,
            email: true,
            crm: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.patient.findUnique({
      where: {
        id,
      },
      include: {
        pediatrician: {
          select: {
            id: true,
            name: true,
            email: true,
            crm: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.patient.delete({
      where: {
        id,
      },
    });
  }
}
