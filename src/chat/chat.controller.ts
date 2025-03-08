import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  async find(@Query('position') position: string | number) {
    position = Number(position) || 0;

    return await this.chatService.getMessages(position);
  }
}
