/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/users/users.service';
import { MessageDataDto } from './dto/message.dto';
import { AuthenticateDto } from './dto/authenticate.dto';
import { verify } from 'jsonwebtoken';
import { User } from 'src/users/model/user.schema';
import { ChatService } from './chat.service';
import * as MessageCache from './func/chat.caching';
import { randomUUID } from 'crypto';
import { UpdateMessageDataDto } from './dto/message-update.dto';
import { DeleteMessageDataDto } from './dto/message-delete.dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private userService: UserService,
    private chatService: ChatService,
  ) {}

  @WebSocketServer()
  server: Server;

  wsClients: Socket[] = [];

  handleConnection(client: Socket) {
    this.wsClients.push(client);
  }

  handleDisconnect(client) {
    console.log('Client se desconectou');
    let user = {};
    for (let i = 0; i < this.wsClients.length; i++) {
      if (this.wsClients[i] === client) {
        user = this.wsClients[i]['user'];
        this.wsClients.splice(i, 1);
        break;
      }
    }
    this.broadcast({
      event: 'disconnect',
      data: user,
    });
  }

  private broadcast(message: any) {
    const broadCastMessage: string = JSON.stringify(message);
    // eslint-disable-next-line prefer-const
    for (let c of this.wsClients) {
      c.send(broadCastMessage);
    }
  }

  async getUser(token: string) {
    if (!token) {
      return { event: 'Unauthorized', data: '' };
    }

    const tokenData = token.split(' ');
    if (tokenData.length !== 2) {
      return { event: 'Unauthorized', data: '' };
    }

    if (tokenData[0] !== 'Bearer') {
      return { event: 'Unauthorized', data: '' };
    }

    const userId = tokenData[1];

    const user = await this.userService.findById(userId);

    return user;
  }

  async verifyToken(authorization: string) {
    if (!authorization) {
      return {
        event: 'Unauthorized',
        data: '',
      };
    }

    const parts = authorization.split(' ');

    if (parts.length !== 2) {
      return {
        event: 'Unauthorized',
        data: '',
      };
    }

    const [schema, token] = parts;

    if (schema !== 'Bearer') {
      return {
        event: 'Unauthorized',
        data: '',
      };
    }

    let error = false;
    let userData: User | undefined = undefined;
    await verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        error = true;
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const user = await this.userService.findById(decoded['id']);

      if (!user || !user._id) {
        error = true;
        console.log(0);
        return;
      }

      userData = user;
    });
    if (error || !userData) {
      return {
        event: 'Unauthorized',
        data: '',
      };
    }

    return userData;
  }

  @SubscribeMessage('Authenticate')
  async handleAuthentication(
    @MessageBody() data: AuthenticateDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const user = await this.verifyToken(data.token);
    if (!user || user['event']) {
      return {
        event: 'Unauthorized',
        data: '',
      };
    }

    const userPreferedData = {
      _id: user['_id'],
      username: user['username'],
      avatar: user['avatar'],
      nicknameColor: user['nicknameColor'],
    };

    this.broadcast({ event: 'connected', data: userPreferedData });
    // eslint-disable-next-line prefer-const
    for (let c of this.wsClients) {
      if (c == socket) {
        c['user'] = userPreferedData;
      }
    }
  }

  @SubscribeMessage('SendMessage')
  async handleMessageSending(
    @MessageBody() data: MessageDataDto,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log(`Mensagem do usuário: ${data.message}`);

    let userData = {};
    // eslint-disable-next-line prefer-const
    for (let c of this.wsClients) {
      if (c == socket) {
        if (!c['user']) {
          return { event: 'Unauthorized', data: '' };
        }
        userData = c['user'];
      }
    }

    const sentAt = Date.now();
    const id = randomUUID();

    this.broadcast({
      event: 'MessageSent',
      data: {
        user: userData,
        message: data.message,
        sentAt: sentAt,
        id: id,
      },
    });

    MessageCache.push({
      content: data.message,
      author: userData['_id'],
      id: id,
      sentAt: sentAt,
      edited: false,
    });

    if (MessageCache.length() >= Number(process.env.MESSAGE_DOC_SIZE)) {
      await this.chatService.saveMessages(MessageCache.get());
      MessageCache.clean();
    }
  }

  @SubscribeMessage('UpdateMessage')
  async handleUpdate(
    @MessageBody() data: UpdateMessageDataDto,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!data['id'] || !data['message']) return;

    let userData = {};
    // eslint-disable-next-line prefer-const
    for (let c of this.wsClients) {
      if (c == socket) {
        if (!c['user']) {
          return { event: 'Unauthorized', data: '' };
        }
        userData = c['user'];
      }
    }
    if (!userData) return;
    if (!userData['_id']) return;

    const response = await this.chatService.editMessage(
      data.id,
      data.message,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userData['_id'],
    );
    return typeof response == 'boolean' ? response : response.modifiedCount > 0;
  }

  @SubscribeMessage('DeleteMessage')
  async handleDelete(
    @MessageBody() data: DeleteMessageDataDto,
    @ConnectedSocket() socket: Socket,
  ) {
    if (!data['id']) return;

    let userData = {};
    // eslint-disable-next-line prefer-const
    for (let c of this.wsClients) {
      if (c == socket) {
        if (!c['user']) {
          return { event: 'Unauthorized', data: '' };
        }
        userData = c['user'];
      }
    }
    if (!userData) return;
    if (!userData['_id']) return;

    const response = await this.chatService.deleteMessage(
      data.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userData['_id'],
    );
    return typeof response == 'boolean' ? response : response.modifiedCount > 0;
  }

  @SubscribeMessage('test')
  handleTest(@MessageBody() data: string) {
    return { event: 'test', data: data };
  }
}
