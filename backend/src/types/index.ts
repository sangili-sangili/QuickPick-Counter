import { Request } from 'express';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  customerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
