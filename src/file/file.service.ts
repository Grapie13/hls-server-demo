import type { FileMessageDto } from '../dto'
import * as path from 'path'
import { Injectable } from '@nestjs/common'
import Events from '../helpers/events'
import { SupportedFormats } from '../helpers/supportedFormats'
import { RMQService } from 'nestjs-rmq'

@Injectable()
export class FileService {
  constructor (private readonly rmqService: RMQService) {}

  async sendProcessingRequest (file: Express.Multer.File): Promise<boolean> {
    const message: FileMessageDto = {
      fileName: file.originalname,
      path: path.join('/tmp/uploads', file.filename),
      format: SupportedFormats.MP4
    }
    return await this.rmqService.send<FileMessageDto, boolean>(Events.PROCESS_VIDEO, message)
  }
}
