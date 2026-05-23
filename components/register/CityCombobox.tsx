"use client";

import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import {
  filterIsraeliCities,
  getCityLabel,
  resolveCityCanonical,
  type CityEntry,
} from "@/lib/data/israeli-cities";
import { useEffect, useId, useRef, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

type CityComboboxProps = {
  error?: string | null;
  required?: boolean;
  defaultCityHe?: string;
  name?: string;
  labelKey?: string;
  placeholderKey?: string;
  inputId?: string;
  disabled?: boolean;
  onChange?: () => void;
};

export default function CityCombobox({
  error,
  required = true,
  defaultCityHe = "",
  name = "city",
  labelKey = "register.city",
  placeholderKey = "register.cityPlaceholder",
  inputId = "city-input",
  disabled = false,
  onChange,
}: CityComboboxProps) {
  const { locale } = useLocale();
  const t = useT();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedCityHe, setSelectedCityHe] = useState(defaultCityHe);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = filterIsraeliCities(query, locale);

  useEffect(() => {
    if (defaultCityHe) {
      setSelectedCityHe(defaultCityHe);
      const entry = filterIsraeliCities(defaultCityHe, locale, 1)[0];
      setQuery(entry ? getCityLabel(entry, locale) : defaultCityHe);
    }
  }, [defaultCityHe, locale]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectCity(entry: CityEntry) {
    setSelectedCityHe(entry.he);
    setQuery(getCityLabel(entry, locale));
    setIsOpen(false);
    setActiveIndex(-1);
    onChange?.();
  }

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedCityHe("");
    setIsOpen(value.trim().length > 0);
    setActiveIndex(-1);
    onChange?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectCity(suggestions[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function tryResolveFromQuery() {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const canonical = resolveCityCanonical(trimmed);
    if (canonical) {
      const entry = suggestions.find((c) => c.he === canonical) ?? {
        he: canonical,
        en: canonical,
      };
      selectCity(entry);
    }
  }

  return (
    <div ref={containerRef} className="grid gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {t(labelKey)}
        {required ? (
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>

      <input type="hidden" name={name} value={selectedCityHe} required={required} />

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={tryResolveFromQuery}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className={`${inputClassName} disabled:opacity-60`}
          placeholder={t(placeholderKey)}
        />

        {isOpen && suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
          >
            {suggestions.map((city, index) => (
              <li key={city.he} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-start text-sm transition hover:bg-secondary ${
                    index === activeIndex ? "bg-secondary text-secondary-foreground" : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCity(city)}
                >
                  <span dir="auto">{getCityLabel(city, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
