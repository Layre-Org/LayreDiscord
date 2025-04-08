import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './model/message.schema';
import * as MessageCache from './func/chat.caching';
import { UUID } from 'crypto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  saveMessages(
    data: { content: string; author: string | Types.ObjectId; id: UUID }[],
  ) {
    return this.messageModel.create({
      data,
    });
  }

  async getMessages(position: number) {
    const storedMessagesDocument = (
      await this.messageModel
        .find()
        .sort({ x: 1 })
        .populate({
          path: 'data.author',
          model: 'User',
          select: ['_id', 'username', 'email', 'avatar', 'createdAt'],
        })
        .exec()
    ).at(position);
    const cachedMessages = MessageCache.get();

    if (!storedMessagesDocument) {
      if (position === 0) {
        return cachedMessages;
      } else {
        return [];
      }
    }

    if (position === 0) {
      return [...storedMessagesDocument.data, ...cachedMessages];
    } else {
      return storedMessagesDocument.data;
    }
  }

  editMessage(id: UUID, newMessage: string, userId: string | Types.ObjectId) {
    const updated = MessageCache.update(id, newMessage, userId);
    if (updated) return true;

    return this.messageModel.updateOne(
      { 'data.id': id, 'data.author': userId },
      { $set: { 'data.$.content': newMessage, 'data.$.edited': true } },
    );
  }
}
