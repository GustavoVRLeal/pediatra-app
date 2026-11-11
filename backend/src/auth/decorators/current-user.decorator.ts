import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/* Dados do pediatra autenticado, preenchidos pelo JwtStrategy.validate */
export interface AuthUser {
  userId: string;
  email: string;
}

/* Uso: metodo(@CurrentUser() user: AuthUser) — exige JwtAuthGuard na rota */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
