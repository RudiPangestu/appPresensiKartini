/**
 * Push notification helper untuk Expo + FCM.
 * Request permission, simpan token ke Supabase fcm_tokens.
 */

import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "./supabase";

// Konfigurasi handler notifikasi foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permission dan simpan token ke database.
 * @param userId - user ID dari Supabase Auth
 */
export async function registerPushNotification(userId: string): Promise<void> {
  try {
    // Hanya di device fisik
    if (!Device.isDevice) {
      console.log("[Push] Bukan device fisik, skip registrasi push");
      return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission ditolak");
      return;
    }

    // Android: setup notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563EB",
      });
    }

    // Dapatkan Expo Push Token
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const token = expoPushToken.data;
    const platform = Platform.OS === "ios" ? "ios" : "android";

    // Upsert ke fcm_tokens
    const { error } = await supabase
      .from("fcm_tokens")
      .upsert(
        { user_id: userId, token, platform, updated_at: new Date().toISOString() },
        { onConflict: "user_id,platform" }
      );

    if (error) {
      console.error("[Push] Gagal simpan token:", error.message);
    } else {
      console.log("[Push] Token terdaftar:", token.substring(0, 20) + "...");
    }
  } catch (err: unknown) {
    console.error("[Push] Error registrasi:", err instanceof Error ? err.message : err);
  }
}

/**
 * Hapus token saat logout.
 */
export async function unregisterPushNotification(userId: string): Promise<void> {
  try {
    const platform = Platform.OS === "ios" ? "ios" : "android";
    await supabase
      .from("fcm_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("platform", platform);
    console.log("[Push] Token dihapus");
  } catch (err) {
    console.error("[Push] Error hapus token:", err);
  }
}

/**
 * Setup listener notifikasi.
 * Panggil di root layout agar selalu aktif.
 */
export function addNotificationListeners(
  onReceive?: (notification: Notifications.Notification) => void,
  onTap?: (response: Notifications.NotificationResponse) => void
) {
  const subReceive = Notifications.addNotificationReceivedListener((notification) => {
    console.log("[Push] Received:", notification.request.content.title);
    onReceive?.(notification);
  });

  const subTap = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("[Push] Tapped:", response.notification.request.content.title);
    onTap?.(response);
  });

  return () => {
    subReceive.remove();
    subTap.remove();
  };
}
