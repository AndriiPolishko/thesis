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

      return result.rows[0];
    } catch (error) {
      this.logger.error('Error creating lead', error);

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

        try {
          const result = await this.databaseService.runQuery(query, [userId, campaignId]);
          const leads: Lead[] = result.rows;
          
          return leads;
        } catch (error) {
          this.logger.error('Error fetching leads', error);
          
          return [];
        }

      }

      try {
        const result = await this.databaseService.runQuery('SELECT * FROM lead WHERE user_id = $1', [userId]);
        const leads: Lead[] = result.rows;
        this.logger.log(`Total leads for user ${userId}: ${leads.length}`);
  
        return leads;
      } catch (error) {
        this.logger.error('Error fetching leads', error);
        
        return [];
      }
    }

    const query = `
      SELECT * FROM lead
      WHERE user_id = $3
      LIMIT $1 OFFSET $2;
      `;
    const offset = (page - 1) * size;

    try {
      const result = await this.databaseService.runQuery(query, [size, offset, userId],);
      const leads: Lead[] = result.rows;
  
      return leads;
    } catch (error) {
      this.logger.error('Error fetching leads', error);
      
      return [];
    }
  }

  /**
   * Get total number of leads for a user
   * @param userId
   * @returns
   */
  public async getTotalLeads(userId: number): Promise<number> {
    try {
      const result = await this.databaseService.runQuery('SELECT COUNT(*) FROM lead WHERE user_id = $1', [userId]);
      const totalLeads = Number(result.rows[0].count);
  
      return totalLeads;
    } catch (error) {
      this.logger.error('Error fetching total leads',  {userId, error});
      
      return 0;
    }
  }

  /**
   * Get lead by id for a user
   * @param leadId
   * @param userId
   * @returns
   */
  public async findById(leadId: number): Promise<Lead> {
    const query = `
      SELECT * FROM lead WHERE id = $1 `;

    try {
      const result = await this.databaseService.runQuery(query, [leadId]);
      const lead: Lead = result.rows[0];
  
      return lead;
    } catch (error) {
      this.logger.error('Error fetching lead by id', {leadId, error});
      
      return null;
    }
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

    try{
      const result = await this.databaseService.runQuery(query, [email, userId]);
      const lead: Lead = result.rows[0];
  
      return lead; 
    } catch (error) {
      this.logger.error('Error fetching lead by email', {params, error});
      
      return null;
    }
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
      this.logger.error(`Error updating lead with ID ${leadId}`, {values, error});
    }
  }
}