import { Injectable } from '@nestjs/common';
import { KafkaAdapter } from '../adapters/kafka.adapter';

@Injectable()
export class MessageGenerationProducer {
  constructor(private readonly kafka: KafkaAdapter) {}

  async publish(payload: { campaignId: string; campaignLeadId: string }) {
    await this.kafka.send('message-generation', payload);
  }
}
