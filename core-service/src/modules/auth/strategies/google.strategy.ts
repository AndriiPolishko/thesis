import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    @Inject(AuthService) private readonly authService: AuthService, 
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    console.log('Access Token:', accessToken); // Should be a string
    console.log('Refresh Token:', refreshToken || 'No Refresh Token'); // Should now be available
    console.log('Profile:', JSON.stringify(profile, null, 2)); // Should be a valid JSON object

    const firstName = profile.name.givenName;
    const lastName = profile.name.familyName;
    const email = profile.emails[0].value;
    
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);
    console.log('Email:', email);

    const user = {
      firstName,
      lastName,
      email
    };

    const registeredUser = await this.authService.registerUser({ firstName, lastName, email, accessToken, refreshToken });


    return done(null, registeredUser || null) 
  }
}
