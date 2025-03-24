import { Module } from '@nestjs/common';
import { KafkaAdapter } from './adapters/kafka.adapter';
import { QueueService } from './queue.service';
import { MessageGenerationProducer } from './producers/message-generation.producer';
import { GeneratedMessageConsumer } from './consumers/generated-message.consumer';

@Module({
  providers: [
    KafkaAdapter,
    QueueService,
    MessageGenerationProducer,
    GeneratedMessageConsumer,
  ],
  exports: [QueueService, MessageGenerationProducer],
})
export class QueueModule {}