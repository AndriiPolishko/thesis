import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaAdapter implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Record<string, Consumer> = {}; // Store consumers by topic

  constructor(
    private readonly configService: ConfigService
  ) {
    this.kafka = new Kafka({ brokers: [this.configService.get<string>('KAFKA_BROKER_ADDRESS')] });
    this.producer = this.kafka.producer();
  }

  async send(topic: string, message: object) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consume(topic: string, callback: (message: any) => void) {
    if (!this.consumers[topic]) {
      const consumer = this.kafka.consumer({ groupId: `core-service-${topic}`, allowAutoTopicCreation: true });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      console.log(`[KafkaAdapter] Subscribed to topic "${topic}" with new consumer`);

      await consumer.run({
        autoCommit: true, // Consider changing this to false for manual commits
        eachMessage: async ({ message }) => {
          const raw = message.value?.toString();
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            console.log(`[KafkaAdapter] Received message on ${topic}:`, parsed);
            await callback(parsed);
          } catch (e) {
            console.error(`[KafkaAdapter] Failed to parse message on ${topic}`, e);
          }
        },
      });

      this.consumers[topic] = consumer; // Store the consumer instance
    } else {
      console.log(`[KafkaAdapter] Already subscribed to topic "${topic}"`);
    }
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('[KafkaAdapter] Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('[KafkaAdapter] Producer disconnected');

    // Disconnect all consumers on module destroy
    for (const topic in this.consumers) {
      await this.consumers[topic].disconnect();
      console.log(`[KafkaAdapter] Consumer for topic "${topic}" disconnected`);
    }
  }
}