import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class LeadRepository {
  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  public async createLead(params: { email: string, links: string[]}) {
    try {
      const { email, links } = params;
      const query = `
        INSERT INTO lead (email, links) VALUES ($1, $2)`;
  
      const result = await this.databaseService.runQuery(query, [email, links]);
      
      console.log(result)
    } catch (error) {
      console.log('error: ', error)
    }
  }
}