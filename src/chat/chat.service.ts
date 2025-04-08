import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './model/message.schema';
import * as MessageCache from './func/chat.caching';
import { UUID } from 'crypto';
import { UserService } from 'src/users/users.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private userService: UserService,
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
          select: [
            '_id',
            'username',
            'email',
            'avatar',
            'createdAt',
            'nicknameColor',
          ],
        })
        .exec()
    ).at(position);
    const cachedMessages = MessageCache.get();
    const idFoundObject = {};
    for (let i = 0; i < cachedMessages.length; i++) {
      const author = cachedMessages[i].author;
      if (!idFoundObject[author.toString()]) {
        console.log(author);
        const userData = await this.userService.findById(author.toString());
        if (!userData) continue;
        idFoundObject[userData['_id'].toString()] = userData;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cachedMessages[i]['author'] = idFoundObject[author.toString()];
    }

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

  deleteMessage(id: UUID, userId: string | Types.ObjectId) {
    const deleted = MessageCache.del(id, userId);
    if (deleted) return true;

    return this.messageModel.updateOne(
      { 'data.id': id, 'data.author': userId },
      { $pull: { data: { id: id } } },
    );
  }
}
