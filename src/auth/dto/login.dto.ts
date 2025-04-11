import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsEmail()
  @ApiProperty({
    name: 'email',
    example: 'example@email.com',
  })
  email: string;

  @IsString()
  @ApiProperty({
    name: 'password',
    example: '12345678',
  })
  password: string;
}
