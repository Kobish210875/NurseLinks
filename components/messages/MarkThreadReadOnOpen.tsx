"use client";

import { markThreadAsRead } from "@/app/actions/messages";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type MarkThreadReadOnOpenProps = {
  peerId: string;
};

export default function MarkThreadReadOnOpen({ peerId }: MarkThreadReadOnOpenProps) {
  const router = useRouter();
  const markedRef = useRef(false);

  useEffect(() => {
    if (markedRef.current) {
      return;
    }
    markedRef.current = true;

    void (async () => {
      await markThreadAsRead(peerId);
      router.refresh();
    })();
  }, [peerId, router]);

  return null;
}
