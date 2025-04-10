import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, TempMessage } from './model/message.schema';
import { UUID } from 'crypto';
import { UserService } from 'src/users/users.service';

@Injectable()
export class ChatService {
  private readonly TEMP_DOCUMENT_ID = 'buffer_doc';

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(TempMessage.name) private tempMessageModel: Model<TempMessage>,
    private userService: UserService,
  ) {}

  async onModuleInit() {
    // Verifica se há mensagens pendentes no buffer ao iniciar
    const tempDoc = await this.tempMessageModel
      .findById(this.TEMP_DOCUMENT_ID)
      .exec();
    if (
      tempDoc &&
      tempDoc.data.length >= Number(process.env.MESSAGE_DOC_SIZE)
    ) {
      await this.saveMessages();
    }
  }

  async addMessage(message: {
    content: string;
    author: string | Types.ObjectId;
    id: UUID;
    sentAt: Date | number;
    edited: boolean;
    response: string[];
  }) {
    let tempDoc = await this.tempMessageModel
      .findById(this.TEMP_DOCUMENT_ID)
      .exec();
    if (!tempDoc) {
      tempDoc = await this.tempMessageModel.create({
        _id: this.TEMP_DOCUMENT_ID,
        data: [],
      });
    }

    await this.tempMessageModel.updateOne(
      { _id: this.TEMP_DOCUMENT_ID },
      { $push: { data: message } },
    );

    const updatedDoc = await this.tempMessageModel
      .findById(this.TEMP_DOCUMENT_ID)
      .exec();
    if (!updatedDoc || !updatedDoc.data.length) return;
    if (updatedDoc.data.length >= Number(process.env.MESSAGE_DOC_SIZE)) {
      await this.saveMessages();
    }
  }

  private async saveMessages() {
    const tempDoc = await this.tempMessageModel
      .findById(this.TEMP_DOCUMENT_ID)
      .exec();
    if (!tempDoc || tempDoc.data.length < 1) return;

    await this.messageModel.create({
      data: tempDoc.data,
    });

    await this.tempMessageModel.updateOne(
      { _id: this.TEMP_DOCUMENT_ID },
      { $set: { data: [] } },
    );
  }

  async getMessages(position: number) {
    const storedMessagesDocument = (
      await this.messageModel
        .find()
        .sort({ x: 1 })
        /*.populate({
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
        })*/
        .exec()
    ).at(position);
    const cachedMessages = (
      await this.tempMessageModel.findById(this.TEMP_DOCUMENT_ID)
    )?.data;
    /*const idFoundObject = {};
    for (let i = 0; i < cachedMessages.length; i++) {
      const author = cachedMessages[i].author;
      if (!idFoundObject[author.toString()]) {
        if (!idFoundObject[author.toString()]['_id']) {
          console.log(author);
          const userData = await this.userService.findById(author.toString());
          if (!userData) continue;
          idFoundObject[userData['_id'].toString()] = userData;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cachedMessages[i]['author'] = idFoundObject[author.toString()];
    }*/

    let messages: any[] = [];

    if (!storedMessagesDocument) {
      if (position === 0) {
        messages = cachedMessages || [];
      } else {
        messages = [];
      }
    }

    if (storedMessagesDocument) {
      if (position === 0) {
        messages = [...storedMessagesDocument.data, ...(cachedMessages || [])];
      } else {
        messages = storedMessagesDocument.data;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return messages;
  }

  async editMessage(
    id: UUID,
    newMessage: string,
    userId: string | Types.ObjectId,
  ) {
    const response = await this.tempMessageModel.updateOne(
      { 'data.id': id, 'data.author': userId },
      { $set: { 'data.$.content': newMessage, 'data.$.edited': true } },
    );
    const updated = response ? response.modifiedCount > 0 : false;
    if (updated) return true;

    return this.messageModel.updateOne(
      { 'data.id': id, 'data.author': userId },
      { $set: { 'data.$.content': newMessage, 'data.$.edited': true } },
    );
  }

  async deleteMessage(id: UUID, userId: string | Types.ObjectId) {
    const response = await this.tempMessageModel.updateOne(
      { 'data.id': id, 'data.author': userId },
      { $pull: { data: { id: id } } },
    );
    const deleted = response ? response.modifiedCount > 0 : false;
    if (deleted) return true;

    return this.messageModel.updateOne(
      { 'data.id': id, 'data.author': userId },
      { $pull: { data: { id: id } } },
    );
  }
}
