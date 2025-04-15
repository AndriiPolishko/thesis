import { Injectable } from '@nestjs/common';
import { SQSAdapter } from '../adapters/sqs.adapter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MessageGenerationProducer {
  private readonly sqs: SQSAdapter;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.sqs = new SQSAdapter(this.configService.get<string>('SQS_MESSAGE_GENERATION_QUEUE_URL'));
  }

  // TODO: add type
  async produce(message: any, groupId: string) {
    await this.sqs.sendMessage(message, groupId);
  }
}
