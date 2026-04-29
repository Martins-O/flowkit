import * as Notifications from 'expo-notifications';
import type { SessionType } from '@flowkit/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleSessionEndNotification(
  seconds: number,
  type: SessionType,
): Promise<string> {
  const title = type === 'focus' ? 'Focus session complete!' : 'Break over!';
  const body =
    type === 'focus' ? 'Time for a break. Well done.' : 'Ready to focus again?';

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds, channelId: 'flowkit-timer' },
  });

  return id;
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
