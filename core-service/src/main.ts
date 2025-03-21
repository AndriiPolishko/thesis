import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as passport from 'passport';

import { AppModule } from './modules/app/app.module';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const host = configService.get<string>('HOST') || 'localhost';

  app.enableCors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true,
  });

  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET'),
      saveUninitialized: false,
      resave: false,
      cookie: {
        maxAge: 3600000,
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
      }
    })); 
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(port, host);
}
bootstrap();
