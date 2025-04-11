import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Layre Chat App API')
    .setDescription('The API that makes the totality of Layre Chat App work.')
    .setVersion('1.5')
    .addTag('chatapp')
    .addServer('localhost:3000', 'Development Enviroment')
    .addServer('http://layrediscord.onrender.com', 'Production Enviroment')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  document.paths['/websocket'] = {
    get: {
      summary: 'WebSocket events documentation',
      description: 'WebSocket events list',
      responses: {
        200: {
          description: 'WebSocket events details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  events: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        event: {
                          type: 'string',
                          description: 'Authenticate',
                          example: 'Authenticate',
                        },
                        data: {
                          type: 'object',
                          properties: {
                            token: {
                              type: 'string',
                              example: 'Bearer {token}',
                            },
                          },
                        },
                      },
                    },
                    example: [
                      {
                        event: 'Authenticate',
                        data: {
                          token: 'Bearer {token}',
                        },
                      },
                      {
                        event: 'SendMessage',
                        data: {
                          message: '{message}',
                        },
                      },
                      {
                        event: 'UpdateMessage',
                        data: {
                          id: '{UUID}',
                          message: '{newMessage}',
                        },
                      },
                      {
                        event: 'DeleteMessage',
                        data: {
                          id: '{UUID}',
                        },
                      },
                      {
                        event: 'test',
                        data: {
                          anything: 'anything',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
