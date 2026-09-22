import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { randomBytes } from 'crypto';
import { NotFoundException } from '@nestjs/common';

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
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
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

  async generatePublicLink(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado');
    }

    const publicToken = randomBytes(32).toString('hex');

    const updatedForm = await this.prisma.form.update({
      where: { id },
      data: {
        publicToken,
        status: 'SENT',
      },
    });

    return {
      message: 'Link público gerado com sucesso',
      publicLink: `http://localhost:3000/public/forms/${updatedForm.publicToken}`,
    };
  }

  async findByPublicToken(token: string) {
    const form = await this.prisma.form.findUnique({
      where: {
        publicToken: token,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        questions: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            question: true,
            type: true,
            required: true,
            order: true,
          },
        },
      },
    });

    if (!form || form.status !== 'SENT') {
      throw new NotFoundException('Formulário não encontrado ou indisponível');
    }

    return form;
  }
}
