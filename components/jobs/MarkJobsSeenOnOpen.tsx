"use client";

import { markJobsSeen } from "@/app/actions/jobs";
import { useNavCounts } from "@/components/nav/NavCountsProvider";
import { useEffect, useRef } from "react";

export default function MarkJobsSeenOnOpen() {
  const { updateCounts } = useNavCounts();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    void (async () => {
      await markJobsSeen();
      updateCounts({ unreadJobs: 0 });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  return null;
}
