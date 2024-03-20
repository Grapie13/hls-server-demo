import { Module } from '@nestjs/common'
import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { ProcessorController } from './processor.controller'
import { ProcessorService } from './processor.service'
import { QUEUE_NAME } from '../main'
import { Bento4 } from './bento4'

@Module({
  imports: [],
  controllers: [ProcessorController],
  providers: [
    ProcessorService,
    Bento4,
    {
      provide: 'PROCESSING_SERVICE',
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
export class ProcessorModule {}
