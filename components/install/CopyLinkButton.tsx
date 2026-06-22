"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  url: string;
  copyLabel: string;
  copiedLabel: string;
};

export default function CopyLinkButton({ url, copyLabel, copiedLabel }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(copyLabel, url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/40"
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
