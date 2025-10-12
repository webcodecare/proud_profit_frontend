import {
  onMessageListener,
  requestNotificationPermission,
} from "@/utils/firebase-client";
import { useEffect, useState } from "react";

export const useFCM = (userId: string) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    const initFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token && userId) {
          setFcmToken(token);

          // Register token with backend
          await fetch("/api/fcm/register-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              token,
              device: navigator.userAgent,
            }),
          });
        }
      } catch (error) {
        console.error("Error initializing FCM:", error);
      }
    };

    if (userId) {
      initFCM();
    }
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload) => {
        setNotification(payload);
      })
      .catch((err) => console.log("Failed to listen for messages:", err));

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return { fcmToken, notification };
};
