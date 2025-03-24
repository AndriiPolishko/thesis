import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdapter } from '../adapters/kafka.adapter';

@Injectable()
export class GeneratedMessageConsumer implements OnModuleInit {
  constructor(private readonly kafka: KafkaAdapter) {}

  async onModuleInit() {
    await this.kafka.consume('generated-messages', async (message) => {
      console.log('Generated email received:', message);
      // Trigger email sending logic here
    });
  }
}
