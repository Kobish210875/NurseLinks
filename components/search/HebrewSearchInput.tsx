"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import {
  hasRejectedSearchCharacters,
  sanitizeHebrewNameSearchInput,
} from "@/lib/validation/hebrew-name";
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

const defaultInputClassName =
  "network-search-input box-border w-full min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type HebrewSearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onValueChange: (value: string) => void;
  inputClassName?: string;
  wrapperClassName?: string;
  inputWrapClassName?: string;
  beforeInput?: ReactNode;
};

const HebrewSearchInput = forwardRef<HTMLInputElement, HebrewSearchInputProps>(
  function HebrewSearchInput(
    {
      value,
      onValueChange,
      inputClassName = defaultInputClassName,
      wrapperClassName,
      inputWrapClassName,
      beforeInput,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const t = useT();
    const generatedId = useId();
    const inputId = idProp ?? generatedId;
    const errorId = `${inputId}-hebrew-only`;
    const [showError, setShowError] = useState(false);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const raw = event.target.value;
      if (!raw) {
        setShowError(false);
      } else if (hasRejectedSearchCharacters(raw)) {
        setShowError(true);
      } else {
        setShowError(false);
      }
      onValueChange(sanitizeHebrewNameSearchInput(raw));
    }

    const input = (
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="search"
        value={value}
        onChange={handleChange}
        className={inputClassName}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
      />
    );

    return (
      <div className={wrapperClassName}>
        {beforeInput || inputWrapClassName ? (
          <div className={inputWrapClassName}>{beforeInput}
            {input}
          </div>
        ) : (
          input
        )}
        {showError ? (
          <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
            {t("common.hebrewOnly")}
          </p>
        ) : null}
      </div>
    );
  },
);

export default HebrewSearchInput;
