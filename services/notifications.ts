import * as Notifications from 'expo-notifications';

export const notifyAlert = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
};

