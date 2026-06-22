"use client";

import {
  nursingEducationGroupOrder,
  nursingEducationGroups,
  nursingEducationOptions,
} from "@/lib/data/nursing-education-options";
import { useEffect, useId, useState } from "react";

const selectClassName =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

type NursingEducationSelectProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: () => void;
};

export default function NursingEducationSelect({
  name = "educationLevel",
  defaultValue = "",
  placeholder = "בחר/י סוג השכלה",
  onChange,
}: NursingEducationSelectProps) {
  const selectId = useId();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <div className="grid gap-1.5" dir="rtl">
      <select
        id={selectId}
        name={name}
        dir="rtl"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onChange?.();
        }}
        className={selectClassName}
      >
        <option value="">{placeholder}</option>
        {nursingEducationGroupOrder.map((groupKey) => (
          <optgroup key={groupKey} label={nursingEducationGroups[groupKey]}>
            {nursingEducationOptions
              .filter((option) => option.group === groupKey)
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
