import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

async function bootstrap (): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: false
  })
  const config = app.get(ConfigService)
  const port = parseInt(config.get('APP_PORT') ?? '3000')
  await app.listen(port)
}

void bootstrap()
