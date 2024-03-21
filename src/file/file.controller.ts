import { Controller, HttpCode, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileService } from './file.service'

@Controller('file')
export class FileController {
  constructor (private readonly fileService: FileService) {}

  @Post()
  @HttpCode(204)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: '/tmp/uploads'
    })
  )
  async uploadFile (@UploadedFile() file: Express.Multer.File): Promise<void> {
    const processingComplete = await this.fileService.sendProcessingRequest(file)

    if (processingComplete) {
      console.log('Processing complete')
    } else {
      console.error('Processing failed')
    }
  }
}
