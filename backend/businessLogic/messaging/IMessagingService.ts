export interface IMessagingService<T> {
  verifyConnection(): Promise<boolean>;
  send(entity: T): Promise<void>;
}
