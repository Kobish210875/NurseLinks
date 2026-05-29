"use client";

import { markAllJobApplicationsSeen } from "@/app/actions/jobs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function MarkApplicationsInboxSeen() {
  const router = useRouter();
  const markedRef = useRef(false);

  useEffect(() => {
    if (markedRef.current) {
      return;
    }
    markedRef.current = true;
    void (async () => {
      await markAllJobApplicationsSeen();
      router.refresh();
    })();
  }, [router]);

  return null;
}
