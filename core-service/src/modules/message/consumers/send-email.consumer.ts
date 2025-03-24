import { Injectable, OnModuleInit } from "@nestjs/common";
import { MessageService } from "../message.service";
import { QueueService } from "src/modules/queue/queue.service";

@Injectable()
export class SendEmailConsumer implements OnModuleInit {
  constructor(
    private readonly messageService: MessageService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    console.log('INITIALIZED');

    await this.queueService.consume('send-email', async (msg) => {
      console.log('Received message from send-email:', msg);

      await this.messageService.handleSendEmailMessage(msg);
    });
  }
}
