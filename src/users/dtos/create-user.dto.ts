import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 24)
  @ApiProperty({
    name: 'username',
    minLength: 3,
    maxLength: 24,
    type: 'string',
    example: 'Albert',
  })
  username: string;

  @IsString()
  @Length(8, 32)
  @ApiProperty({
    name: 'password',
    minLength: 8,
    maxLength: 32,
    type: 'string',
    example: '12345678',
  })
  password: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    name: 'email',
    format: 'example@email.com',
    example: 'example@email.com',
  })
  email: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'avatar',
    format: 'URL',
    type: 'string',
    example: 'http://image.com/imageID',
  })
  avatar: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  @ApiProperty({
    name: 'nicknameColor',
    format: 'hex',
    type: 'string',
    example: '#ffffff',
  })
  nicknameColor: string;
}
