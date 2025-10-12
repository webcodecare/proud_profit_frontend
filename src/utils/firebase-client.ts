import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;

// Initialize messaging only in browser and if supported
const initializeMessaging = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    messaging = getMessaging(app);
  }
};

// Call initialization
initializeMessaging();

export { messaging };

export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === "undefined" || !messaging) {
    console.log("Messaging not supported or not in browser");
    return null;
  }

  try {
    // Check current permission status
    const currentPermission = Notification.permission;
    console.log("Current notification permission:", currentPermission);

    let permission = currentPermission;

    // Request permission if not already granted
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log("FCM token obtained:", token.substring(0, 20) + "...");
        // Register token with backend
        const registered = await registerTokenWithBackend(userId, token);
        return registered ? token : null;
      } else {
        console.error("No FCM token obtained");
      }
    } else {
      console.log("Notification permission denied:", permission);
    }
    return null;
  } catch (error) {
    console.error("Error getting notification permission:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error("Messaging not initialized"));
      return;
    }

    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      resolve(payload);
    });
  });

// Register token with backend
const registerTokenWithBackend = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/register-fcm-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        token,
        device: "web",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Token registered with backend:", result);
    return true;
  } catch (error) {
    console.error("Error registering token with backend:", error);
    return false;
  }
};

// Check if FCM is supported
export const isFCMSupported = async () => {
  if (typeof window === "undefined") return false;
  return await isSupported();
};
