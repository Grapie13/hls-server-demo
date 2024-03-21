import { Module } from '@nestjs/common'
import { ProcessorController } from './processor.controller'
import { ProcessorService } from './processor.service'
import { Bento4 } from './bento4'

@Module({
  imports: [],
  controllers: [ProcessorController],
  providers: [ProcessorService, Bento4]
})
export class ProcessorModule {}
