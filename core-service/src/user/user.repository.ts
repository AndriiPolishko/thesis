import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from '../modules/database/database.service';

export interface CreateUserEntity {
  firstName: string;
  lastName: string;
  email: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  async createOne(createUserEntity: CreateUserEntity): Promise<{ user: User }> {
    const { firstName, lastName, email } = createUserEntity;
    const query = `
      INSERT INTO "user" ("firstName", "lastName", email) VALUES ($1, $2, $3) RETURNING id`;
    
    const result = await this.databaseService.runQuery(query, [firstName, lastName, email]);
    const user = result.rows[0];

    return { user };
  }

  async findOne(id: number): Promise<User> {
    const query = `
      SELECT * FROM "user" WHERE id = $1`;

    const result = await this.databaseService.runQuery(query, [id]);
    const user = result.rows[0] as User;

    return user;
  }

  async findOneByEmail(email: string): Promise<{ user: User }> {
    const query = `
      SELECT * FROM "user" WHERE email = $1`;

    const result = await this.databaseService.runQuery(query, [email]);
    const user = result.rows[0] as User;

    return { user };
  }
}