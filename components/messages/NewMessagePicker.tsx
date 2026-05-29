"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/LocaleProvider";

export type NewMessageFriend = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  initials: string;
};

type NewMessagePickerProps = {
  connections: NewMessageFriend[];
};

export default function NewMessagePicker({ connections }: NewMessagePickerProps) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openThread(peerId: string) {
    setOpen(false);
    router.push(`/messages/${peerId}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-4 sm:py-2 sm:text-sm"
      >
        {t("messages.newMessage")}
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 max-sm:items-end max-sm:p-0"
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div
                className="flex max-h-[min(85dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-message-title"
              >
                <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 id="new-message-title" className="text-base font-semibold text-foreground">
                    {t("messages.newMessageTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {t("profile.cancel")}
                  </button>
                </header>

                <p className="shrink-0 px-4 pt-2 text-sm text-muted-foreground">
                  {t("messages.newMessageHint")}
                </p>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
                  {connections.length === 0 ? (
                    <div className="space-y-3 px-2 py-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("messages.newMessageNoConnections")}
                      </p>
                      <Link
                        href="/network"
                        className="inline-block text-sm font-medium text-primary hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        {t("network.title")}
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {connections.map((member) => (
                        <li key={member.id}>
                          <button
                            type="button"
                            onClick={() => openThread(member.id)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-muted/50"
                          >
                            <span className="flex size-10 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                              {member.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={member.avatarUrl}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                                  {member.initials}
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                              {member.fullName}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
