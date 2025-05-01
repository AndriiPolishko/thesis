import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';

import { SQSAdapter } from '../adapters/sqs.adapter';
import { ConfigService } from '@nestjs/config';
import { MessageService } from 'src/modules/message/message.service';
import { GeneratedEmailMessage } from '../queue.types'

@Injectable()
export class GeneratedMessageConsumer implements OnModuleInit {
  private readonly logger = new Logger(GeneratedMessageConsumer.name);
  private readonly  sqs = new SQSAdapter(this.configService.get<string>('SQS_GENERATED_MESSAGE_QUEUE_URL'));

  constructor(
    private readonly configService: ConfigService,
    @Inject(MessageService) private readonly messageService: MessageService
  ) {}

  async onModuleInit() {
    this.pollMessages();
  }

  private async pollMessages() {
    while (true) {
      const messages = await this.sqs.receiveMessages();

      for (const message of messages) {
        try {
          const body: GeneratedEmailMessage = JSON.parse(message.Body);

          this.logger.log(`Received message: ${JSON.stringify(body)}`);
  
          await this.messageService.handleSendEmailMessage(body);

          await this.sqs.deleteMessage(message.ReceiptHandle);
        }
        catch (error) {
          this.logger.error(`Error processing message: ${error.message}. Message body: ${message.Body}`);
        }
      }
    }
  }
}
