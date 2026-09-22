import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';

@Controller('questions/:id/answers')
export class AnswersController {
  constructor(
    private readonly answersService: AnswersService,
  ) {}

  @Post()
  async create(
    @Param('id') questionId: string,
    @Body() data: CreateAnswerDto,
  ) {
    return this.answersService.create(questionId, data);
  }

  @Get()
  async findByQuestion(
    @Param('id') questionId: string,
  ) {
    return this.answersService.findByQuestion(questionId);
  }
}