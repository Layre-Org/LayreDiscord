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
import { ApiBody, ApiHeader, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiParam({
    name: 'id',
    description: "The users's id",
    type: String,
    required: true,
  })
  @ApiOperation({
    summary: 'Gets an User',
    description: 'The route to Get an user based on his ID',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {JWT token}',
    required: true,
  })
  @Get(':id')
  async findOne(@Param('id') id: Types.ObjectId | string) {
    return await this.userService.findById(id).select('-email').select('-__v');
  }

  @ApiBody({
    type: CreateUserDto,
    description: 'Carries the user data for registration',
    required: true,
  })
  @ApiOperation({
    summary: 'Creates an User',
    description: 'The route to registrate an user',
  })
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return await this.userService.create(data);
  }

  @ApiBody({
    type: UpdateUserDto,
    description: 'Carries the user data to be updated',
  })
  @ApiParam({
    name: 'id',
    description: "The user's to be updated id",
    type: String,
    required: true,
  })
  @ApiOperation({
    summary: 'Updates an User',
    description: "The route to update an user's data",
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {JWT token}',
    required: true,
  })
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

  @ApiParam({
    name: 'id',
    description: "The user's to be deleted id",
    type: String,
    required: true,
  })
  @ApiOperation({
    summary: 'Deletes an User',
    description: "The route to delete an user's data",
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {JWT token}',
    required: true,
  })
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
