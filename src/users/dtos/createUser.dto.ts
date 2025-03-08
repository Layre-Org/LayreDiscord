import { IsEmail, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 16)
  username: string;

  @IsString()
  @Length(8, 32)
  password: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  avatar: string;
}
