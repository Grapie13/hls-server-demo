import type { MicroserviceOptions } from '@nestjs/microservices'
import { Transport } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

export const QUEUE_NAME = 'video_processing'

async function bootstrap (): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: false
  })
  const config = app.get(ConfigService)
  app.connectMicroservice<MicroserviceOptions>({
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
  await app.startAllMicroservices()
  const port = parseInt(config.get('APP_PORT') ?? '3000')
  await app.listen(port)
}

void bootstrap()
