import { MessagePattern, Payload } from '@nestjs/microservices'
import { Controller } from '@nestjs/common'
import { ProcessorService } from './processor.service'
import { FileMessageDto } from '../dto'
import Events from '../helpers/events'

@Controller()
export class ProcessorController {
  constructor (private readonly processorService: ProcessorService) {}

  @MessagePattern(Events.PROCESS_VIDEO)
  async processVideo (@Payload() message: FileMessageDto): Promise<void> {
    console.log('Received message on event video.process:', message)
    await this.processorService.processVideo(message)
  }

  @MessagePattern(Events.PACKAGE_VIDEO)
  async packageVideo (@Payload() message: FileMessageDto): Promise<void> {
    console.log('Received message on event video.package:', message)
    await this.processorService.packageVideo(message)
  }
}
