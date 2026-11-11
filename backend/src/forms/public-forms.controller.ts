import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FormsService } from './forms.service';
import { SubmitResponseDto } from './dto/submit-response.dto';

/* Rotas públicas, acessadas pelos responsáveis através do link.
   Não usam JwtAuthGuard e não expõem dados do paciente nem respostas anteriores. */
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':token')
  async findByToken(@Param('token') token: string) {
    return this.formsService.findByPublicToken(token);
  }

  /* Envio das respostas pelo responsável */
  @Post(':token/responses')
  async submitResponse(
    @Param('token') token: string,
    @Body() data: SubmitResponseDto,
  ) {
    return this.formsService.submitResponse(token, data);
  }
}
