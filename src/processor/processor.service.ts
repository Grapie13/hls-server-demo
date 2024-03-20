import type { FileMessageDto } from '../dto'
import * as fs from 'fs'
import { ClientRMQ, RmqRecordBuilder } from '@nestjs/microservices'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3 } from '@aws-sdk/client-s3'
import ffmpeg from 'fluent-ffmpeg'
import Events from '../helpers/events'
import { Bento4 } from './bento4'

const { promises: fsPromises } = fs
const s3 = new S3({ region: 'eu-central-1' })

@Injectable()
export class ProcessorService {
  constructor (
    @Inject('PROCESSING_SERVICE') private readonly client: ClientRMQ,
    private readonly bento4: Bento4,
    private readonly config: ConfigService
  ) {}

  async packageVideo (fileDetails: FileMessageDto): Promise<void> {
    const inputs = ['/tmp/output_h.mp4', '/tmp/output_m.mp4', '/tmp/output_l.mp4']
    let audioFileExists = false

    try {
      await fsPromises.stat('/tmp/output_audio.mp4')
      audioFileExists = true
    } catch (_ignored) {}

    if (audioFileExists) {
      inputs.push('/tmp/output_audio.mp4')
    }

    console.log('Inputs:', inputs)

    const dirName = `/tmp/${fileDetails.fileName.split('.')[0]}`
    await this.bento4.mp4hls(inputs, {
      outputSingleFile: true,
      segmentDuration: 2,
      outputDir: dirName
    })

    console.log('Removing input files...')
    for (const input of inputs) {
      await fsPromises.rm(input)
    }
    console.log('Input files removed')

    console.log('Uploading packaged video to S3...')
    await this.walk(dirName, async (filePath) => {
      await s3.putObject({
        Bucket: this.config.get('OUTPUT_BUCKET'),
        Key: filePath.replace('/tmp/', ''),
        Body: fs.createReadStream(filePath)
      })
    })
    console.log('Packaged video uploaded to S3')

    console.log('Removing temporary directory...')
    await fsPromises.rm(dirName, { recursive: true, force: true })
    console.log('Temporary directory removed')
  }

  async walk (dir: string, callback: (filePath: string) => void | Promise<void>): Promise<void> {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fileStat = fs.statSync(`${dir}/${file}`)

      if (fileStat.isDirectory()) {
        await this.walk(`${dir}/${file}`, callback)
      } else {
        await callback(`${dir}/${file}`)
      }
    }
  }

  async processVideo (fileDetails: FileMessageDto): Promise<void> {
    const passOneHigh = ffmpeg(fileDetails.path)
      .fps(24)
      .videoCodec('libx264')
      .videoBitrate('3000k')
      .size('1920x1080')
      .format(fileDetails.format)
      .addOption('-y')
      .addOption('-b_strategy', '2')
      .addOption('-g', '48')
      .addOption('-keyint_min', '48')
      .addOption('-sc_threshold', '0')
      .addOption('-refs', '1')
      .addOption('-preset', 'veryslow')
      .addOption('-profile', 'high')
      .addOption('-pass', '1')
      .addOption('-passlogfile', '/tmp/passlogfile_high')
      .saveToFile('/dev/null')
    passOneHigh.on('progress', (progress) => {
      if (progress !== undefined) {
        console.log('Processing pass one (high): ' + progress.percent + '% done')
      }
    })
    passOneHigh.on('error', (err) => {
      console.error('Error processing video (pass one high):', err)
    })
    passOneHigh.on('end', () => {
      const passTwoHigh = ffmpeg(fileDetails.path)
        .fps(24)
        .noAudio()
        .videoCodec('libx264')
        .videoBitrate('3000k')
        .size('1920x1080')
        .addOption('-y')
        .addOption('-maxrate', '3300k')
        .addOption('-bufsize', '3300k')
        .addOption('-b_strategy', '2')
        .addOption('-g', '48')
        .addOption('-keyint_min', '48')
        .addOption('-sc_threshold', '0')
        .addOption('-refs', '1')
        .addOption('-preset', 'veryslow')
        .addOption('-profile', 'high')
        .addOption('-pass', '2')
        .addOption('-passlogfile', '/tmp/passlogfile_high')
        .output('/tmp/output_h.mp4')
      passTwoHigh.on('progress', (progress) => {
        if (progress !== undefined) {
          console.log('Processing pass two (high): ' + progress.percent + '% done')
        }
      })
      passTwoHigh.on('error', (err) => {
        console.error('Error processing pass 2 high:', err)
      })
      passTwoHigh.on('end', () => {
        console.log('Pass two (high) complete')
        const record = new RmqRecordBuilder(fileDetails).build()
        this.client.send<FileMessageDto>(Events.PACKAGE_VIDEO, record).subscribe()
      })
      passTwoHigh.run()
    })

    const passOneMedium = ffmpeg(fileDetails.path)
      .fps(24)
      .videoCodec('libx264')
      .videoBitrate('1500k')
      .size('1280x720')
      .format(fileDetails.format)
      .addOption('-y')
      .addOption('-b_strategy', '2')
      .addOption('-g', '48')
      .addOption('-keyint_min', '48')
      .addOption('-sc_threshold', '0')
      .addOption('-refs', '1')
      .addOption('-preset', 'medium')
      .addOption('-profile', 'main')
      .addOption('-pass', '1')
      .addOption('-passlogfile', '/tmp/passlogfile_medium')
      .saveToFile('/dev/null')
    passOneMedium.on('progress', (progress) => {
      if (progress !== undefined) {
        console.log('Processing pass one (medium): ' + progress.percent + '% done')
      }
    })
    passOneMedium.on('error', (err) => {
      console.error('Error processing video (pass one medium+):', err)
    })
    passOneMedium.on('end', () => {
      const passTwoMedium = ffmpeg(fileDetails.path)
        .fps(24)
        .noAudio()
        .videoCodec('libx264')
        .videoBitrate('1500k')
        .size('1280x720')
        .addOption('-y')
        .addOption('-maxrate', '1650k')
        .addOption('-bufsize', '1650k')
        .addOption('-b_strategy', '2')
        .addOption('-g', '48')
        .addOption('-keyint_min', '48')
        .addOption('-sc_threshold', '0')
        .addOption('-refs', '1')
        .addOption('-preset', 'medium')
        .addOption('-profile', 'main')
        .addOption('-pass', '2')
        .addOption('-passlogfile', '/tmp/passlogfile_medium')
        .output('/tmp/output_m.mp4')
      passTwoMedium.on('progress', (progress) => {
        if (progress !== undefined) {
          console.log('Processing pass two (medium): ' + progress.percent + '% done')
        }
      })
      passTwoMedium.on('error', (err) => {
        console.error('Error processing pass 2 medium:', err)
      })
      passTwoMedium.on('end', () => {
        console.log('Pass two (medium) complete')
      })
      passTwoMedium.run()
    })

    const passOneLow = ffmpeg(fileDetails.path)
      .fps(24)
      .noAudio()
      .videoCodec('libx264')
      .videoBitrate('500k')
      .size('640x360')
      .format(fileDetails.format)
      .addOption('-y')
      .addOption('-b_strategy', '2')
      .addOption('-g', '48')
      .addOption('-keyint_min', '48')
      .addOption('-sc_threshold', '0')
      .addOption('-refs', '1')
      .addOption('-preset', 'veryfast')
      .addOption('-profile', 'baseline')
      .addOption('-pass', '1')
      .addOption('-passlogfile', '/tmp/passlogfile_low')
      .saveToFile('/dev/null')

    passOneLow.on('progress', (progress) => {
      if (progress !== undefined) {
        console.log('Processing pass one (low): ' + progress.percent + '% done')
      }
    })

    passOneLow.on('error', (err) => {
      console.error('Error processing video (pass one low):', err)
    })

    passOneLow.on('end', () => {
      const passTwoLow = ffmpeg(fileDetails.path)
        .fps(24)
        .noAudio()
        .videoCodec('libx264')
        .videoBitrate('500k')
        .size('640x360')
        .addOption('-y')
        .addOption('-maxrate', '550k')
        .addOption('-bufsize', '550k')
        .addOption('-b_strategy', '2')
        .addOption('-g', '48')
        .addOption('-keyint_min', '48')
        .addOption('-sc_threshold', '0')
        .addOption('-refs', '1')
        .addOption('-preset', 'veryfast')
        .addOption('-profile', 'baseline')
        .addOption('-pass', '2')
        .addOption('-passlogfile', '/tmp/passlogfile_low')
        .output('/tmp/output_l.mp4')
      passTwoLow.on('progress', (progress) => {
        if (progress !== undefined) {
          console.log('Processing pass two (low): ' + progress.percent + '% done')
        }
      })
      passTwoLow.on('end', () => {
        console.log('Pass two (low) complete')
      })
      passTwoLow.on('error', (err) => {
        console.error('Error processing pass 2 low:', err)
      })
      passTwoLow.run()
    })

    ffmpeg.ffprobe(fileDetails.path, (err, metadata) => {
      if (err !== null) {
        console.log('Error reading file metadata:', err)
        return
      }

      let hasAudio = false

      for (const stream of metadata.streams) {
        if (stream.codec_type === 'audio') {
          hasAudio = true
          break
        }
      }

      if (hasAudio) {
        const audioPass = ffmpeg(fileDetails.path)
          .noVideo()
          .audioCodec('aac')
          .audioBitrate('128k')
          .audioChannels(2)
          .format('mp4')
          .addOption('-y')
          .saveToFile('/tmp/output_audio.mp4')
        audioPass.on('progress', (progress) => {
          if (progress !== undefined) {
            console.log('Processing audio pass: ' + progress.percent + '% done')
          }
        })
        audioPass.on('error', (err) => {
          console.error('Error processing audio pass:', err)
        })
        audioPass.on('end', () => {
          console.log('Audio pass complete')
        })
      }
    })
  }
}
