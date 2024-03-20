import type { FileMessageDto } from '../dto'
import * as path from 'path'
import { ClientRMQ, RmqRecordBuilder } from '@nestjs/microservices'
import { Inject, Injectable } from '@nestjs/common'
import Events from '../helpers/events'
import { SupportedFormats } from '../helpers/supportedFormats'

@Injectable()
export class FileService {
  constructor (@Inject('FILE_SERVICE') private readonly client: ClientRMQ) {}

  async sendProcessingRequest (file: Express.Multer.File): Promise<void> {
    const message: FileMessageDto = {
      fileName: file.originalname,
      path: path.join('/tmp/uploads', file.filename),
      format: SupportedFormats.MP4
    }
    const record = new RmqRecordBuilder(message).build()
    this.client.send<FileMessageDto>(Events.PROCESS_VIDEO, record).subscribe()
  }
}
