"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/app/register/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { validateHebrewNamePart } from "@/lib/validation/hebrew-name";
import { validatePassword } from "@/lib/validation/password";
import PasswordInput from "./PasswordInput";
import RequiredLabel from "./RequiredLabel";

const inputClassName =
  "w-full max-w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";
const nonHebrewNameChars = /[^\u05D0-\u05EA\s\-'׳״.]/gu;

type RegisterFormProps = {
  serverError?: string | null;
};

export default function RegisterForm({ serverError }: RegisterFormProps) {
  const t = useT();
  const [clientError, setClientError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const displayError = clientError ?? serverError;

  function sanitizeHebrewNameInput(event: React.FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const hebrewOnly = input.value.replace(nonHebrewNameChars, "");
    if (input.value !== hebrewOnly) {
      input.value = hebrewOnly;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const errors: Record<string, string> = {};

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!firstName) {
      errors.firstName = t("register.fieldRequired");
    } else if (validateHebrewNamePart(firstName)) {
      errors.firstName = t("errors.invalid-hebrew-name");
    }
    if (!lastName) {
      errors.lastName = t("register.fieldRequired");
    } else if (validateHebrewNamePart(lastName)) {
      errors.lastName = t("errors.invalid-hebrew-name");
    }
    if (!email) {
      errors.email = t("register.fieldRequired");
    }
    if (!password) {
      errors.password = t("register.fieldRequired");
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        errors.password = t(`errors.${passwordError}`);
      }
    }

    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      event.preventDefault();
      setFieldErrors(errors);

      const onlyPasswordError =
        errorKeys.length === 1 && errorKeys[0] === "password" && errors.password;
      setClientError(onlyPasswordError ? errors.password : t("errors.missing-fields"));
      return;
    }

    setClientError(null);
    setFieldErrors({});
  }

  return (
    <form action={signUp} onSubmit={handleSubmit} className="feed-card p-6 text-start" noValidate>
      <h2 className="mb-1 text-2xl font-bold text-foreground">{t("register.title")}</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        <span className="text-red-600">*</span> {t("register.requiredHint")}
      </p>

      {displayError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 sm:col-span-1">
          <RequiredLabel>{t("register.firstName")}</RequiredLabel>
          <input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            maxLength={40}
            className={inputClassName}
            placeholder={t("register.firstNamePlaceholder")}
            onInput={sanitizeHebrewNameInput}
            aria-invalid={Boolean(fieldErrors.firstName)}
            aria-describedby="firstName-hint"
          />
          <span id="firstName-hint" className="text-xs text-muted-foreground">
            {t("register.firstNameHint")}
          </span>
          {fieldErrors.firstName ? (
            <span className="text-sm text-red-600">{fieldErrors.firstName}</span>
          ) : null}
        </label>

        <label className="grid gap-1.5 sm:col-span-1">
          <RequiredLabel>{t("register.lastName")}</RequiredLabel>
          <input
            id="lastName"
            name="lastName"
            required
            autoComplete="family-name"
            maxLength={40}
            className={inputClassName}
            placeholder={t("register.lastNamePlaceholder")}
            onInput={sanitizeHebrewNameInput}
            aria-invalid={Boolean(fieldErrors.lastName)}
            aria-describedby="lastName-hint"
          />
          <span id="lastName-hint" className="text-xs text-muted-foreground">
            {t("register.lastNameHint")}
          </span>
          {fieldErrors.lastName ? (
            <span className="text-sm text-red-600">{fieldErrors.lastName}</span>
          ) : null}
        </label>

        <label className="grid gap-1.5 sm:col-span-2">
          <RequiredLabel>{t("register.email")}</RequiredLabel>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClassName}
            placeholder="you@example.com"
            dir="ltr"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? (
            <span className="text-sm text-red-600">{fieldErrors.email}</span>
          ) : null}
        </label>

        <label className="grid gap-1.5 sm:col-span-2">
          <RequiredLabel>{t("register.password")}</RequiredLabel>
          <PasswordInput
            id="password"
            name="password"
            invalid={Boolean(fieldErrors.password)}
            onValueChange={(value) => {
              if (!value) {
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.password;
                  return next;
                });
                return;
              }

              const passwordError = validatePassword(value);
              if (passwordError) {
                setFieldErrors((current) => ({
                  ...current,
                  password: t(`errors.${passwordError}`),
                }));
              } else {
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.password;
                  return next;
                });
              }
            }}
          />
          <span className="text-xs text-muted-foreground">{t("register.passwordHint")}</span>
          {fieldErrors.password ? (
            <span className="text-sm text-red-600">{fieldErrors.password}</span>
          ) : null}
        </label>

        <label className="grid gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">{t("register.headline")}</span>
          <input
            name="headline"
            className={inputClassName}
            placeholder={t("register.headlinePlaceholder")}
          />
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        {t("register.submit")}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("register.alreadyRegistered")}{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("nav.login")}
        </Link>
      </p>
    </form>
  );
}
