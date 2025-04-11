import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiHeader, ApiOperation, ApiQuery } from '@nestjs/swagger';

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
}
