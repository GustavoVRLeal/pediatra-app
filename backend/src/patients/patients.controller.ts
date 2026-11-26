import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from 'src/auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(@Body() data: CreatePatientDto, @CurrentUser() user: AuthUser) {
    return this.patientsService.create(data, user.userId);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.patientsService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.patientsService.findOne(id, user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePatientDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.patientsService.update(id, user.userId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.patientsService.remove(id, user.userId);
  }
}
