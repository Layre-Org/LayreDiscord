/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBody, ApiHeader, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from './validation/file.size.validation';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @ApiQuery({
    name: 'position',
    description: 'Messages document position (0 includes in-cache messages)',
    type: Number,
    example: '1',
    required: false,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {JWT token}',
    required: true,
  })
  @ApiOperation({
    summary: 'Gets the messages',
    description: 'Gets all the messages by document position',
  })
  @Get()
  async find(@Query('position') position: string | number) {
    position = Number(position) || 0;

    const messages = await this.chatService.getMessages(position);

    return {
      messages,
    };
  }

  @ApiBody({
    description: 'Requires a Form Data with file data',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {JWT token}',
    required: true,
  })
  @ApiOperation({
    summary: 'Uploads a file',
    description: "Uploads a file and return it's link for download/appearence",
  })
  @Post('upload/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file or more than 8mb sent');
    }

    const imageBuffer = file.buffer;
    const imageName = file.originalname;

    const response = await this.chatService.uploadFile(imageBuffer, imageName);

    if (!response || !response['url']) {
      throw new BadRequestException('Error on getting the file URL');
    }

    return { fileUrl: response['url'] };
  }
}
