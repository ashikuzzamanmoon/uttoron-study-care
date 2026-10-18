export interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

export interface SmsRecipientPayload {
  phone: string;
  message: string;
  name?: string;
}

export interface ISmsGateway {
  sendSingle(phone: string, message: string): Promise<SmsResponse>;
  sendBulk(recipients: SmsRecipientPayload[]): Promise<SmsResponse[]>;
  checkBalance(): Promise<number>;
}
