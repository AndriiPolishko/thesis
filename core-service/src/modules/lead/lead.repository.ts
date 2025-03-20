import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class LeadRepository {
  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  public async createLead(params: { email: string, firstName: string, lastName: string}) {
    try {
      const { email, firstName, lastName } = params;
      const query = `
        INSERT INTO lead (email, first_name, last_name) VALUES ($1, $2, $3)`;
      const result = await this.databaseService.runQuery(query, [email, firstName, lastName]);
      
      console.log(result)
    } catch (error) {
      console.log('error: ', error)
    }
  }

  public async getLeads(page: number, size: number) {
    const query = `
      SELECT * FROM lead
      LIMIT $1 OFFSET $2`;

    const result = await this.databaseService.runQuery(query, [size, (page - 1) * size]);
    const leads = result.rows;

    return leads;
  }

  public async getTotalLeads() {
    const result = await this.databaseService.runQuery('SELECT COUNT(*) FROM lead');
    const totalLeads = Number(result.rows[0].count);

    return totalLeads;
  }
}