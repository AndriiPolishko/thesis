import { Injectable } from '@nestjs/common';
import { KafkaAdapter } from './adapters/kafka.adapter';

@Injectable()
export class QueueService {
  constructor(private readonly kafka: KafkaAdapter) {}

  async send(topic: string, message: object) {
    return this.kafka.send(topic, message);
  }

  async consume(topic: string, handler: (message: any) => void) {
    console.log(`[Kafka] Subscribing to topic: ${topic}`);

    return this.kafka.consume(topic, handler);
  }
}
