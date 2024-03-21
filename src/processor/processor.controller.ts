import { Controller } from '@nestjs/common'
import { RMQRoute } from 'nestjs-rmq'
import { ProcessorService } from './processor.service'
import { FileMessageDto } from '../dto'
import Events from '../helpers/events'

@Controller()
export class ProcessorController {
  constructor (private readonly processorService: ProcessorService) {}

  @RMQRoute(Events.PROCESS_VIDEO)
  async processVideo (message: FileMessageDto): Promise<boolean> {
    console.log('Received message on event video.process:', message)
    return await this.processorService.handleProcessing(message)
  }

  @RMQRoute(Events.PACKAGE_VIDEO)
  async packageVideo (message: FileMessageDto): Promise<boolean> {
    console.log('Received message on event video.package:', message)
    return await this.processorService.packageVideo(message)
  }
}
