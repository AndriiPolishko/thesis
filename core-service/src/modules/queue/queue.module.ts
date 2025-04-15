import { forwardRef, Module } from '@nestjs/common';
import { MessageGenerationProducer } from './producers/message-generation.producer';
import { GeneratedMessageConsumer } from './consumers/generated-message.consumer';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [forwardRef(() => MessageModule)],
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