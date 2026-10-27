import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { WorkshopStatus } from '../entities/workshop.entity.js';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Central FleetCore' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Calle 123 #45-67, Barranquilla' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ enum: WorkshopStatus, default: WorkshopStatus.ACTIVE })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}

export class UpdateWorkshopDto extends PartialType(CreateWorkshopDto) {}
