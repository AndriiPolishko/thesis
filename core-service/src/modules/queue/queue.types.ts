export type QueueProvider = 'kafka' | 'sqs';

export interface QueueMessage<T = any> {
  key: string;
  value: T;
  topic: string;
}