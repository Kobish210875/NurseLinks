export type NursingEducationGroup = "qualified" | "student" | "other";

export type NursingEducationOption = {
  value: string;
  label: string;
  group: NursingEducationGroup;
};

export const nursingEducationOptions: NursingEducationOption[] = [
  { value: "practical_nurse", label: "אח/ות מעשי/ת", group: "qualified" },
  { value: "registered_nurse", label: "אח/ות מוסמך/ת", group: "qualified" },
  {
    value: "post_basic_course",
    label: "אח/ות מוסמך/ת – בוגר/ת קורס על-בסיסי (התמחות)",
    group: "qualified",
  },
  { value: "clinical_specialist", label: "אח/ות מומחה/ית קליני/ת", group: "qualified" },
  { value: "masters_nursing", label: "אח/ות בעל/ת תואר שני בסיעוד", group: "qualified" },
  { value: "phd_nursing", label: "אח/ות בעל/ת תואר שלישי בסיעוד", group: "qualified" },
  { value: "student_bachelor", label: "סטודנט/ית לסיעוד – תואר ראשון", group: "student" },
  {
    value: "student_career_change",
    label: "סטודנט/ית לסיעוד – מסלול הסבת אקדמאים",
    group: "student",
  },
  { value: "other", label: "אחר", group: "other" },
];

export const nursingEducationGroups: Record<NursingEducationGroup, string> = {
  qualified: "אחים ואחיות מוסמכים",
  student: "סטודנטים לסיעוד",
  other: "אחר",
};

export const nursingEducationGroupOrder: NursingEducationGroup[] = [
  "qualified",
  "student",
  "other",
];

export function getNursingEducationLabel(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  return nursingEducationOptions.find((o) => o.value === value)?.label ?? null;
}

export function isValidNursingEducationValue(value: string): boolean {
  return nursingEducationOptions.some((o) => o.value === value);
}
