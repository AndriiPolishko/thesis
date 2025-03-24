import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { Lead } from './lead.types';

@Injectable()
export class LeadRepository {
  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  public async createLead(params: { email: string, firstName: string, lastName: string}): Promise<void> {
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

  public async getLeads(page: number, size: number): Promise<Lead[]> {
    const query = `
      SELECT * FROM lead
      LIMIT $1 OFFSET $2`;

    const result = await this.databaseService.runQuery(query, [size, (page - 1) * size]);
    const leads: Lead[] = result.rows;

    return leads;
  }

  public async getTotalLeads(): Promise<number> {
    const result = await this.databaseService.runQuery('SELECT COUNT(*) FROM lead');
    const totalLeads = Number(result.rows[0].count);

    return totalLeads;
  }

  public async findById(leadId: number | string): Promise<Lead> {
    const query = `
      SELECT * FROM lead WHERE id = $1`;

    const result = await this.databaseService.runQuery(query, [leadId]);
    const lead: Lead = result.rows[0];

    return lead;
  }
}