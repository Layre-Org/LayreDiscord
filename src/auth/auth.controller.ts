import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({
    type: LoginDto,
    description: 'Logs in the user, returning the JWT token',
    required: true,
  })
  @ApiOperation({
    summary: 'Signs in an User',
    description: 'Generate an JWT token and returns it',
  })
  @Post()
  async login(@Body() body: LoginDto) {
    const { email, password } = body;

    return this.authService.signIn(email, password);
  }
}
