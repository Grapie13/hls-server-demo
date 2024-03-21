import { Module } from '@nestjs/common'
import { FileModule } from './file/file.module'
import { ProcessorModule } from './processor/processor.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RMQModule } from 'nestjs-rmq'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    RMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          exchangeName: config.get('RABBITMQ_EXCHANGE') ?? '',
          queueName: '',
          messagesTimeout: 15 * 60 * 1000, // 15 minutes
          connections: [
            {
              login: config.get('RABBITMQ_USERNAME') ?? '',
              password: config.get('RABBITMQ_PASSWORD') ?? '',
              host: config.get('RABBITMQ_HOST') ?? ''
            }
          ]
        }
      }
    }),
    FileModule,
    ProcessorModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
