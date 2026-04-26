import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCondominiumDto {
  @ApiProperty({ example: 'Residencial Bela Vista' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '(21) 99999-0000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@belavista.com' })
  @IsString()
  @IsOptional()
  email?: string;
}
