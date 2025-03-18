import { Module } from '@nestjs/common';

import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { LeadRepository } from './lead.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LeadController],
  exports: [LeadService],
  providers: [LeadService, LeadRepository]
})
export class LeadModule {}