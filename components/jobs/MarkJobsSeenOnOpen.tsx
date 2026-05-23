"use client";

import { markJobsSeen } from "@/app/actions/jobs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function MarkJobsSeenOnOpen() {
  const router = useRouter();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    void (async () => {
      await markJobsSeen();
      router.refresh();
    })();
  }, [router]);

  return null;
}
