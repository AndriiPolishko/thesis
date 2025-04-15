import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SQSAdapter } from '../adapters/sqs.adapter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeneratedMessageConsumer implements OnModuleInit {
  private readonly logger = new Logger(GeneratedMessageConsumer.name);
  private readonly  sqs = new SQSAdapter(this.configService.get<string>('SQS_MESSAGE_GENERATION_QUEUE_URL'));

  constructor(
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    this.pollMessages();
  }

  // FIXME: REFINE OR REMOVE
  private async pollMessages() {
    // while (true) {
    //   const messages = await this.sqs.receiveMessages();

    //   for (const message of messages) {
    //     const body = JSON.parse(message.Body!);

    //     this.logger.log(`Received message: ${JSON.stringify(body)}`);

    //     // handle message here...

    //     await this.sqs.deleteMessage(message.ReceiptHandle!);
    //   }
    // }
  }
}
