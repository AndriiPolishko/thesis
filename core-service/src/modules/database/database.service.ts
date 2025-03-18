import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';

import pg, { Pool } from "pg";

@Injectable()
export class DatabaseService{
  private pool: Pool;

  constructor(
    private configService: ConfigService
  ) {
    this.pool = new Pool({
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      database: this.configService.get<string>('DB_NAME'),
    });
  }

  public runQuery(query: string, params?: unknown[]): Promise<pg.Result> {
    return this.pool.query(query, params);
  }
}