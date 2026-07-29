import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QuestionsModule } from 'src/questions/questions.module';

@Module({
  imports: [PrismaModule, QuestionsModule],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
