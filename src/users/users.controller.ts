import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserService } from './users.service';
import { Types } from 'mongoose';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: Types.ObjectId | string) {
    return await this.userService.findById(id).select('-email').select('-__v');
  }

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return await this.userService.create(data);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: Types.ObjectId | string,
    @Body() body: UpdateUserDto,
    @Req() req: Request,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('The given id is not valid');
    }

    if (body.email) {
      const emailDocs = await this.userService.findByEmail(body.email);

      if (emailDocs) {
        throw new BadRequestException('This email already exists');
      }
    }

    const user = await this.userService.findById(id);

    if (!user) {
      throw new BadRequestException(
        "Couldn't find a document with the ID providen",
      );
    }

    const userId: Types.ObjectId = user._id;

    if (!userId) {
      throw new UnauthorizedException(
        "Couldn't verify the author's permission, try again",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (req['userId'].toString() !== userId.toString()) {
      throw new UnauthorizedException(
        'User must be the user or an admin to delete the document',
      );
    }

    const doc = await this.userService.update(id, body);
    return {
      message: 'Data updated successfully',
      data: doc,
    };
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') id: Types.ObjectId | string,
    @Req() req: Request,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('The given id is not valid');
    }

    const user = await this.userService.findById(id);

    if (!user) {
      throw new BadRequestException(
        "Couldn't find a document with the ID providen",
      );
    }

    const userId: Types.ObjectId = user._id;

    if (!userId) {
      throw new UnauthorizedException(
        "Couldn't verify the author's permission, try again",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (req['userId'].toString() !== userId.toString()) {
      throw new UnauthorizedException(
        'User must be the user or an admin to delete the document',
      );
    }

    const doc = await this.userService.delete(id);
    return {
      message: 'Data deleted successfully',
      data: doc,
    };
  }
}
