import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';

// Carrega as variáveis do arquivo .env (recurso nativo do Node)
process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new PrismaExceptionFilter());
  // Permite que o web-form (outro endereço/porta) chame a API pelo navegador
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
