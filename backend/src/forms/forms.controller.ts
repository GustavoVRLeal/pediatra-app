import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { QuestionsService } from 'src/questions/questions.service';
import { CreateQuestionDto } from 'src/questions/dto/create-question.dto';

@UseGuards(JwtAuthGuard)
@Controller('forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly questionService: QuestionsService,
  ) {}

  @Post()
  async create(@Body() data: CreateFormDto) {
    return this.formsService.create(data);
  }

  @Get()
  async findAll() {
    return this.formsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateFormDto) {
    return this.formsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }

  /* Gera o token público do formulário e muda o status para SENT */
  @Post(':id/public-link')
  async generatePublicLink(@Param('id') id: string) {
    return this.formsService.generatePublicLink(id);
  }

  /* Histórico de preenchimentos do formulário */
  @Get(':id/responses')
  async findResponses(@Param('id') id: string) {
    return this.formsService.findResponses(id);
  }

  @Get(':id/responses/:responseId')
  async findResponse(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
  ) {
    return this.formsService.findResponse(id, responseId);
  }

  @Post(':id/questions')
  async createQuestion(
    @Param('id') formId: string,
    @Body() data: CreateQuestionDto,
  ) {
    return this.questionService.create(formId, data);
  }

  @Get(':id/questions')
  async getquestions(@Param('id') formId: string) {
    return this.questionService.findByForm(formId);
  }
}
