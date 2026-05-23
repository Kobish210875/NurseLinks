import en from "@/messages/en.json";
import he from "@/messages/he.json";
import type { Locale } from "./config";

export type Messages = typeof he;

const catalogs: Record<Locale, Messages> = { he, en: en as Messages };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

function getMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function createT(messages: Messages) {
  return function t(key: string): string {
    return getMessage(messages, key) ?? key;
  };
}
