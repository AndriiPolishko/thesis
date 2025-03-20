import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadModule } from '../lead/lead.module';
import { CampaignModule } from '../campaign/campaign.module';
import { CampaignLeadModule } from '../campaign-leads/campaign-lead.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LeadModule, 
    CampaignModule,
    CampaignLeadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
