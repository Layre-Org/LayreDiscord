import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from 'src/users/users.module';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Message,
  MessageSchema,
  TempMessage,
  TempMessageSchema,
} from './model/message.schema';
import { ChatController } from './chat.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: TempMessage.name, schema: TempMessageSchema },
    ]),
    MulterModule.register(),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
