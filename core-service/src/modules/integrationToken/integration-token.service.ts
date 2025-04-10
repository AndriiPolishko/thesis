import axios from "axios";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class IntegrationTokenService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  public async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; token_type: string }> {
    const client_id = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const client_secret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');


    const res = await axios.post('https://oauth2.googleapis.com/token', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        client_id,
        client_secret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
    });
  
    return res.data;
  }
}