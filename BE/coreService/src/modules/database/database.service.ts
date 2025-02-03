import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor() {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'mydatabase',
    });
  }

  async onModuleInit() {
    await this.client.connect();
    console.log('Connected to PostgreSQL');
  }

  async onModuleDestroy() {
    await this.client.end();
    console.log('Disconnected from PostgreSQL');
  }

  async query(queryText: string, params?: any[]) {
    return this.client.query(queryText, params);
  }
}
