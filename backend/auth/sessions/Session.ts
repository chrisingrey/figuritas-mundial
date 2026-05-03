export interface Session {
  id: string;
  token: string;
  expiresAt: Date;
  userId: string;
}