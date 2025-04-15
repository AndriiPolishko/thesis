import { Module } from '@nestjs/common';
import { MessageGenerationProducer } from './producers/message-generation.producer';
import { GeneratedMessageConsumer } from './consumers/message-generation.consumer';

@Module({
  providers: [
    MessageGenerationProducer,
    GeneratedMessageConsumer,
  ],
  exports: [
    MessageGenerationProducer,
    GeneratedMessageConsumer
  ],
})
export class QueueModule {}