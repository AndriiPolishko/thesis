import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { Lead } from './lead.types';

interface CreateLeadParams { 
  email: string;
  firstName: string;
  lastName: string;
  userId: number;
}

interface GetLeadsParams {
  page: number;
  size: number;
  userId: number;
  campaignId?: number;
}

interface GetLeadByIdParams {
  leadId: number;
  userId: number;
}

interface GetLeadByEmailParams {
  email: string;
  userId: number;
}

@Injectable()
export class LeadRepository {
  private readonly logger = new Logger(LeadRepository.name);

  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  public async createLead(params: CreateLeadParams): Promise<Lead> {
    try {
      const { email, firstName, lastName, userId } = params;
      const query = `
        INSERT INTO lead (email, first_name, last_name, user_id) VALUES ($1, $2, $3, $4)`;

      this.logger.log(`Creating lead for user ${userId} with email: ${email} and name: ${firstName} ${lastName}`,
        {query}
      );
    
      const result = await this.databaseService.runQuery(query, [email, firstName, lastName, userId]);

      this.logger.log('Lead created successfully');
      
      console.log()

      return result.rows[0];
    } catch (error) {
      console.log('error: ', error);

      return null;
    }
  }

  public async getLeads(params: GetLeadsParams): Promise<Lead[]> {
    const { page, size, userId, campaignId } = params;
    
    if (page == 0 && size == 0) {
      this.logger.log(`Getting all leads for user ${userId}`);

      if (campaignId) {
        this.logger.log(`Getting leads that are not present in campaign ${campaignId} for user ${userId}`);
        const query = `
          SELECT * FROM lead
          WHERE user_id = $1
          AND id NOT IN (
            SELECT lead_id FROM campaign_lead WHERE campaign_id = $2
          );`;
        const result = await this.databaseService.runQuery(query, [userId, campaignId]);
        const leads: Lead[] = result.rows;
        
        return leads;
      }

      const result = await this.databaseService.runQuery('SELECT * FROM lead WHERE user_id = $1', [userId]);
      const leads: Lead[] = result.rows;
      this.logger.log(`Total leads for user ${userId}: ${leads.length}`);

      return leads;
    }

    const query = `
      SELECT * FROM lead
      WHERE user_id = $3
      LIMIT $1 OFFSET $2;
      `;
    const offset = (page - 1) * size;
    const result = await this.databaseService.runQuery(query, [size, offset, userId],);
    const leads: Lead[] = result.rows;

    return leads;
  }

  /**
   * Get total number of leads for a user
   * @param userId
   * @returns
   */
  public async getTotalLeads(userId: number): Promise<number> {
    const result = await this.databaseService.runQuery('SELECT COUNT(*) FROM lead WHERE user_id = $1', [userId]);
    const totalLeads = Number(result.rows[0].count);

    return totalLeads;
  }

  /**
   * Get lead by id for a user
   * @param leadId
   * @param userId
   * @returns
   */
  public async findById(params: GetLeadByIdParams): Promise<Lead> {
    const { leadId, userId } = params;
    const query = `
      SELECT * FROM lead WHERE id = $1 AND user_id = $2`;

    const result = await this.databaseService.runQuery(query, [leadId, userId]);
    const lead: Lead = result.rows[0];

    return lead;
  }

  /**
   * Get lead by email for a user
   * @param email 
   * @param userId 
   * @returns 
   */
  public async findLeadByEmail(params: GetLeadByEmailParams): Promise<Lead> {
    const { email, userId } = params;
    const query = `
      SELECT * FROM lead WHERE email = $1 AND user_id = $2`;

    const result = await this.databaseService.runQuery(query, [email, userId]);
    const lead: Lead = result.rows[0];

    return lead;
  }

  public async updateLeadStatus(leadId: number, status: string): Promise<void> {
    const query = `
      UPDATE lead SET status = $1 WHERE id = $2
    `;
    const values = [status, leadId];

    try {
      await this.databaseService.runQuery(query, values);
      this.logger.log(`Lead with ID ${leadId} updated to status ${status}`);
    } catch (error) {
      this.logger.error(`Error updating lead with ID ${leadId}`, error);
    }
  }
}