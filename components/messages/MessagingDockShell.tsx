"use client";

import { MessagingDockProvider } from "@/components/messages/MessagingDockContext";

export default function MessagingDockShell({ children }: { children: React.ReactNode }) {
  return <MessagingDockProvider>{children}</MessagingDockProvider>;
}
