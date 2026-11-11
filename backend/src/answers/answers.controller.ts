import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from 'src/auth/decorators/current-user.decorator';

/* Rotas antigas de respostas avulsas. Agora exigem JWT e só acessam
   perguntas de formulários do pediatra autenticado. O responsável
   envia respostas pela rota pública /public/forms/:token/responses. */
@UseGuards(JwtAuthGuard)
@Controller('questions/:id/answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  async create(
    @Param('id') questionId: string,
    @Body() data: CreateAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.answersService.create(questionId, data, user.userId);
  }

  @Get()
  async findByQuestion(
    @Param('id') questionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.answersService.findByQuestion(questionId, user.userId);
  }
}
