import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/* Transforma os erros do banco em respostas claras em vez de "500". */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status = 500;
    let message = 'Erro interno ao acessar o banco de dados';

    if (exception instanceof Prisma.PrismaClientValidationError) {
      // Campo obrigatório faltando ou tipo errado (ex.: texto em campo numérico)
      status = 400;
      message = 'Dados inválidos: verifique os campos enviados';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        // Valor único repetido (ex.: email ou CRM já cadastrado)
        status = 409;
        message = `Já existe um cadastro com este valor: ${exception.meta?.target}`;
      } else if (exception.code === 'P2003') {
        // Registro com vínculos (ex.: excluir paciente que possui formulários)
        status = 409;
        message = 'Não é possível excluir: existem registros vinculados';
      } else if (exception.code === 'P2025') {
        status = 404;
        message = 'Registro não encontrado';
      }
    }

    response.status(status).json({ statusCode: status, message });
  }
}
