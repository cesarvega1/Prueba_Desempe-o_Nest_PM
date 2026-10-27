import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MechanicStatus } from '../entities/mechanic.entity.js';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Rodríguez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Suspensión y frenos' })
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @ApiPropertyOptional({ enum: MechanicStatus, default: MechanicStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MechanicStatus)
  status?: MechanicStatus
}

export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {}
