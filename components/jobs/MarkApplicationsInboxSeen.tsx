"use client";

import { markAllJobApplicationsSeen } from "@/app/actions/jobs";
import { useNavCounts } from "@/components/nav/NavCountsProvider";
import { useEffect, useRef } from "react";

export default function MarkApplicationsInboxSeen() {
  const { updateCounts, unreadJobs, pendingInvitations, unreadMessages } = useNavCounts();
  const markedRef = useRef(false);

  useEffect(() => {
    if (markedRef.current) {
      return;
    }
    markedRef.current = true;
    void (async () => {
      await markAllJobApplicationsSeen();
      if (unreadJobs > 0) {
        updateCounts({
          pendingInvitations,
          unreadMessages,
          unreadJobs: 0,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  return null;
}
