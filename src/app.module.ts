import { Module } from '@nestjs/common'
import { FileModule } from './file/file.module'
import { ProcessorModule } from './processor/processor.module'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    FileModule,
    ProcessorModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
