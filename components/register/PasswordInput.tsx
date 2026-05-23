"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

const inputClassName =
  "w-full rounded-lg border border-border bg-white py-2.5 pl-3 pr-10 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

type PasswordInputProps = {
  id: string;
  name: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
};

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export default function PasswordInput({ id, name, invalid, onValueChange }: PasswordInputProps) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div dir="ltr" className="relative">
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        required
        className={inputClassName}
        placeholder={t("register.passwordPlaceholder")}
        dir="ltr"
        autoComplete="new-password"
        spellCheck={false}
        aria-invalid={invalid}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={() => setShowPassword(false)}
      />
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setShowPassword((current) => !current)}
        className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={showPassword ? t("register.hidePassword") : t("register.showPassword")}
        aria-pressed={showPassword}
      >
        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  );
}
