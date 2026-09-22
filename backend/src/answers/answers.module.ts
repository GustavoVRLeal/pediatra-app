import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';

/* Permite registrar o serviço na controladora */

@Module({
  imports: [PrismaModule],
  controllers: [AnswersController],
  providers: [AnswersService],
  exports: [AnswersService],
})
export class AnswersModule {}