import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUser.dto';
import { UserService } from './users.service';
import { Types } from 'mongoose';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: Types.ObjectId | string) {
    return await this.userService.findById(id);
  }

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return await this.userService.create(data);
  }
}
