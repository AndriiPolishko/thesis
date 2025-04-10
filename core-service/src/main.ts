import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './modules/app/app.module';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const host = configService.get<string>('HOST') || 'localhost';

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true,
  });

  app.use(passport.initialize());

  await app.listen(port, host);
}
bootstrap();
