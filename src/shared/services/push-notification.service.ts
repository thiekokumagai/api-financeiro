import { Injectable } from '@nestjs/common';
import * as webpush from 'web-push';
import { ISettingsRepository } from '../../modules/settings/domain/repositories/isettings.repository';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@financeiro.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  } catch (error) {
    console.warn('[PushNotificationService] Chaves VAPID inválidas ou não configuradas:', (error as Error).message);
  }
}

@Injectable()
export class PushNotificationService {
  constructor(private readonly settingsRepo: ISettingsRepository) {}

  async sendNotifications(
    title: string,
    body: string,
    data?: any,
    webSubscriptions: any[] = [],
  ) {
    this.sendWebPush(webSubscriptions, title, body, data).catch(console.error);
  }

  private async sendWebPush(
    subscriptions: any[],
    title: string,
    body: string,
    data?: any,
  ) {
    if (!subscriptions || subscriptions.length === 0) return;
    if (!process.env.VAPID_PUBLIC_KEY) return;

    const settings = await this.settingsRepo.get();
    const adminFrontendUrl = (process.env.ADMIN_FRONTEND_URL || '').replace(
      /\/$/,
      '',
    );
    let iconUrl = adminFrontendUrl
      ? `${adminFrontendUrl}/favicon-192x192.png`
      : '/favicon-192x192.png';
    if (settings?.faviconUrl) {
      if (settings.faviconUrl.startsWith('http')) {
        iconUrl = settings.faviconUrl;
      }
    }

    const payloadData = { ...(data || {}), icon: iconUrl };
    const payload = JSON.stringify({ title, body, data: payloadData });

    for (const sub of subscriptions) {
      if (!sub || !sub.endpoint) continue;
      try {
        await webpush.sendNotification(sub, payload);
      } catch (error) {
        console.error('Error sending web push:', error);
      }
    }
  }
}
