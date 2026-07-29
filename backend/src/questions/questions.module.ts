import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
