import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { spawn } from 'child_process'

interface Bento4Options {
  outputSingleFile: boolean
  segmentDuration: number
  outputDir: string
}

@Injectable()
export class Bento4 {
  constructor (private readonly config: ConfigService) {}

  async mp4hls (inputs: string[], options: Bento4Options): Promise<void> {
    await new Promise((resolve, reject) => {
      const args: string[] = []

      if (options.outputSingleFile) {
        args.push('--output-single-file')
      }
      args.push('--segment-duration', options.segmentDuration.toString())
      args.push('--output-dir', options.outputDir)

      const mp4hls = spawn(`${this.config.get('BENTO4_DIR')}/mp4-hls.py`, [...args, ...inputs])

      mp4hls.stdout.on('data', data => {
        console.log('mp4hls stdout:', data.toString())
      })
      mp4hls.stderr.on('data', data => {
        console.error('mp4hls stderr:', data.toString())
      })
      mp4hls.on('exit', code => {
        if (code !== 0 || code === null) {
          reject(new Error(`mp4hls exited with code ${code}`))
          return
        }
        console.log('mp4hls exited with code:', code)
        resolve(code)
      })
    })
  }
}
