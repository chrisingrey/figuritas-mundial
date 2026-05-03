export interface MeResponse {
  id: string;
  email: string;
  username: string;
  fullname: string;
  surname: string;
  imageUrl?: string;
  complete: boolean;
  hasPassword: boolean;
}
