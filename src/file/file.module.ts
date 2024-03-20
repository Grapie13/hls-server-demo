import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import { Module } from '@nestjs/common'
import { FileController } from './file.controller'
import { FileService } from './file.service'
import { ConfigService } from '@nestjs/config'
import { QUEUE_NAME } from 'src/main'

@Module({
  imports: [],
  controllers: [FileController],
  providers: [
    FileService,
    {
      provide: 'FILE_SERVICE',
      useFactory: (config: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${config.get('RABBITMQ_USERNAME')}:${config.get('RABBITMQ_PASSWORD')}@${config.get('RABBITMQ_HOST')}`],
            noAck: true,
            queue: QUEUE_NAME,
            queueOptions: {
              durable: true
            }
          }
        })
      },
      inject: [ConfigService]
    }
  ]
})
export class FileModule {}
