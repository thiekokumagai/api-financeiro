export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  /** Sessões de refresh (hashes). null revoga todas. */
  refreshToken?: string | null;
  expoPushToken?: string | null;
  webPushSubscription?: any;
  createdAt: Date;
}
