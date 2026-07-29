import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFormDto) {
    return this.prisma.form.create({
      data: {
        title: data.title,
        description: data.description,
        patientId: data.patientId,
      },
    });
  }

  async findAll() {
    return this.prisma.form.findMany({
      include: {
        patient: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.form.findUnique({
      where: {
        id,
      },
      include: {
        patient: true,
        questions: true,
      },
    });
  }

  async update(id: string, data: UpdateFormDto) {
    return this.prisma.form.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.form.delete({
      where: {
        id,
      },
    });
  }
}
