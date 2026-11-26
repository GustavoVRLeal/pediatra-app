import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';

const MIN_PASSWORD_LENGTH = 6;

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private JwtService: JwtService,
  ) {}

  /* Cadastro do pediatra. Valida os campos, impede e-mail/CRM repetidos
     e já devolve o token, para o app entrar direto após o cadastro. */
  async register(data: RegisterDto) {
    const name = typeof data?.name === 'string' ? data.name.trim() : '';
    const email =
      typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    const crm =
      typeof data?.crm === 'string' ? data.crm.trim().toUpperCase() : '';
    const password = typeof data?.password === 'string' ? data.password : '';

    if (!name) {
      throw new BadRequestException('O nome é obrigatório');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException('Informe um e-mail válido');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (!crm) {
      throw new BadRequestException('O CRM é obrigatório');
    }

    // Mensagens específicas em vez do erro genérico de valor único do Prisma
    if (await this.userService.findByEmail(email)) {
      throw new ConflictException('Este e-mail já está cadastrado');
    }
    if (await this.userService.findByCrm(crm)) {
      throw new ConflictException('Este CRM já está cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      name,
      email,
      crm,
      password: hashedPassword,
    });

    // Nunca devolve a senha (nem o hash)
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        crm: user.crm,
        createdAt: user.createdAt,
      },
      access_token: this.signToken(user.id, user.email),
    };
  }

  async login(email: string, password: string) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const user = await this.userService.findByEmail(email.trim());

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      access_token: this.signToken(user.id, user.email),
    };
  }

  private signToken(userId: string, email: string) {
    return this.JwtService.sign({ sub: userId, email });
  }
}
