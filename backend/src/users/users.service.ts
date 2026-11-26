import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
    crm: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  /* Busca ignorando maiúsculas/minúsculas, para que "Joao@Email.com"
     e "joao@email.com" sejam a mesma conta (inclusive cadastros antigos). */
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  async findByCrm(crm: string) {
    return this.prisma.user.findFirst({
      where: { crm: { equals: crm, mode: 'insensitive' } },
    });
  }
}
