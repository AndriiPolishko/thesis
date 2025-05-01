import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

export class SQSAdapter {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(queueUrl: string) {
    this.queueUrl = queueUrl;
    this.sqsClient = new SQSClient({ region: process.env.AWS_REGION });
  }

  async sendMessage(message: unknown, groupId: string): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: groupId
    });
    
    await this.sqsClient.send(command);
  }

  async receiveMessages(): Promise<any[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 10,
    });
    const response = await this.sqsClient.send(command);
    return response.Messages ?? [];
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await this.sqsClient.send(command);
  }
}
