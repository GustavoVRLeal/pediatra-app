import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from 'src/auth/decorators/current-user.decorator';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { QuestionsService } from 'src/questions/questions.service';
import { CreateQuestionDto } from 'src/questions/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/questions/dto/update-question.dto';

/* Área administrativa: todas as rotas exigem JWT e só acessam
   formulários de pacientes do pediatra autenticado. */
@UseGuards(JwtAuthGuard)
@Controller('forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly questionService: QuestionsService,
  ) {}

  @Post()
  async create(@Body() data: CreateFormDto, @CurrentUser() user: AuthUser) {
    return this.formsService.create(data, user.userId);
  }

  /* GET /forms ou GET /forms?patientId=<id> */
  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId?: string,
  ) {
    return this.formsService.findAll(user.userId, patientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.formsService.findOne(id, user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateFormDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formsService.update(id, user.userId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.formsService.remove(id, user.userId);
  }

  /* Gera o token público do formulário e muda o status para SENT */
  @Post(':id/public-link')
  async generatePublicLink(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formsService.generatePublicLink(id, user.userId);
  }

  /* Encerra o formulário (link público deixa de funcionar) */
  @Post(':id/close')
  async close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.formsService.close(id, user.userId);
  }

  /* Reabre o formulário encerrado com o mesmo link */
  @Post(':id/reopen')
  async reopen(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.formsService.reopen(id, user.userId);
  }

  /* Histórico de preenchimentos do formulário */
  @Get(':id/responses')
  async findResponses(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.formsService.findResponses(id, user.userId);
  }

  @Get(':id/responses/:responseId')
  async findResponse(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formsService.findResponse(id, responseId, user.userId);
  }

  /* Perguntas: confere a posse do formulário antes de delegar ao QuestionsService */
  @Post(':id/questions')
  async createQuestion(
    @Param('id') formId: string,
    @Body() data: CreateQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.formsService.assertOwner(formId, user.userId);
    return this.questionService.create(formId, data);
  }

  @Get(':id/questions')
  async getquestions(
    @Param('id') formId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.formsService.assertOwner(formId, user.userId);
    return this.questionService.findByForm(formId);
  }

  @Patch(':id/questions/:questionId')
  async updateQuestion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
    @Body() data: UpdateQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.formsService.assertOwner(formId, user.userId);
    return this.questionService.update(formId, questionId, data);
  }

  @Delete(':id/questions/:questionId')
  async removeQuestion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.formsService.assertOwner(formId, user.userId);
    return this.questionService.remove(formId, questionId);
  }
}
