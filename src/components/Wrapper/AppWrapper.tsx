"use client";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@/hooks/useUser"; // or however you access user context
import { Toaster } from "sonner"; // Add toast notifications

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { user } = useUser(); // Replace with your user context/hook

  // Setup notifications for the current user
  useNotifications(user?.id);

  return (
    <>
      {children}
      {/* Toast container for notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 6000,
          style: {
            background: "#fff",
            border: "1px solid #e5e7eb",
          },
        }}
      />
    </>
  );
}
