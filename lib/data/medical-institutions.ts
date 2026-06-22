export const INSTITUTION_OTHER_SLUG = "other";

/** Stored in jobs.hospital when institution_slug is "other" (matches profile.institutionOther HE). */
export const INSTITUTION_OTHER_HOSPITAL_LABEL = "אחר";

export type InstitutionRegion = "center" | "jerusalem" | "north" | "south";

export type MedicalInstitution = {
  slug: string;
  shortLabel: string;
  fullName: string;
  address: string;
  /** City/location shown next to name in profiles (e.g. כפר סבא). */
  locationShort: string;
  region: InstitutionRegion;
  /** Terms to match profile headline / job hospital (lowercase). */
  matchTerms: string[];
};

export function cityFromInstitutionAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed.includes(",")) {
    return trimmed;
  }
  return trimmed.split(",").pop()?.trim() ?? trimmed;
}

function locationShortFromAddress(address: string): string {
  return cityFromInstitutionAddress(address);
}

export const INSTITUTION_REGIONS: { id: InstitutionRegion; labelKey: string }[] = [
  { id: "center", labelKey: "hospitals.regionCenter" },
  { id: "jerusalem", labelKey: "hospitals.regionJerusalem" },
  { id: "north", labelKey: "hospitals.regionNorth" },
  { id: "south", labelKey: "hospitals.regionSouth" },
];

type MedicalInstitutionInput = Omit<MedicalInstitution, "locationShort">;

const MEDICAL_INSTITUTIONS_RAW: MedicalInstitutionInput[] = [
  {
    slug: "sheba",
    shortLabel: "שיבא תל-השומר",
    fullName: "מרכז רפואי תל-השומר שיבא",
    address: "דרך שיבא 2, רמת גן",
    region: "center",
    matchTerms: ["שיבא", "תל השומר", "תל-השומר", "sheba"],
  },
  {
    slug: "rabin",
    shortLabel: "רבין בילינסון",
    fullName: "מרכז רפואי רבין בילינסון",
    address: "ז'בוטינסקי 39, פתח תקווה",
    region: "center",
    matchTerms: ["בילינסון", "רבין", "belinson", "rabin"],
  },
  {
    slug: "schneider",
    shortLabel: "שניידר ילדים",
    fullName: "מרכז שניידר ילדים",
    address: "קפלן 14, פתח תקווה",
    region: "center",
    matchTerms: ["שניידר", "schneider"],
  },
  {
    slug: "ichilov",
    shortLabel: "איכילוב (סוראסקי)",
    fullName: "מרכז רפואי איכילוב (סוראסקי)",
    address: "ויצמן 6, תל אביב",
    region: "center",
    matchTerms: ["איכילוב", "סוראסקי", "ichilov", "sourasky"],
  },
  {
    slug: "wolfson",
    shortLabel: "וולפסון",
    fullName: "מרכז רפואי וולפסון",
    address: "הלוחמים 62, חולון",
    region: "center",
    matchTerms: ["וולפסון", "wolfson"],
  },
  {
    slug: "maayanei",
    shortLabel: "מעייני הישועה",
    fullName: "מרכז רפואי מעייני הישועה",
    address: "פוברסקי 17, בני ברק",
    region: "center",
    matchTerms: ["מעייני הישועה", "מעייני", "maayanei"],
  },
  {
    slug: "assuta",
    shortLabel: "אסותא",
    fullName: "מרכז רפואי אסותא",
    address: "ז'בוטינסקי 62, תל אביב",
    region: "center",
    matchTerms: ["אסותא", "assuta"],
  },
  {
    slug: "assaf",
    shortLabel: "אסף הרופא",
    fullName: "מרכז רפואי אסף הרופא",
    address: "מחנה צריפין",
    region: "center",
    matchTerms: ["אסף הרופא", "אסף", "assaf"],
  },
  {
    slug: "kaplan",
    shortLabel: "קפלן",
    fullName: "מרכז רפואי קפלן",
    address: "צומת ביל\"ו, רחובות",
    region: "center",
    matchTerms: ["קפלן", "kaplan"],
  },
  {
    slug: "laniado",
    shortLabel: "לניאדו",
    fullName: "מרכז רפואי לניאדו",
    address: "קרית צאנז, נתניה",
    region: "center",
    matchTerms: ["לניאדו", "laniado"],
  },
  {
    slug: "meir",
    shortLabel: "מאיר",
    fullName: "מרכז רפואי מאיר",
    address: "טשרניחובסקי 45, כפר סבא",
    region: "center",
    matchTerms: ["מאיר", "meir"],
  },
  {
    slug: "levinstein",
    shortLabel: "לווינשטיין",
    fullName: "מרכז רפואי ושיקומי לווינשטיין",
    address: "אחוזה 278, רעננה",
    region: "center",
    matchTerms: ["לווינשטיין", "levinstein"],
  },
  {
    slug: "hadassah-ein-kerem",
    shortLabel: "הדסה עין כרם",
    fullName: "מרכז רפואי הדסה עין כרם",
    address: "עין כרם, ירושלים",
    region: "jerusalem",
    matchTerms: ["הדסה עין כרם", "עין כרם", "hadassah", "hadasa"],
  },
  {
    slug: "hadassah-mount-scopus",
    shortLabel: "הדסה הר הצופים",
    fullName: "מרכז רפואי הדסה הר הצופים",
    address: "הר הצופים, ירושלים",
    region: "jerusalem",
    matchTerms: ["הר הצופים", "הדסה הר", "scopus"],
  },
  {
    slug: "bikur-holim",
    shortLabel: "ביקור חולים",
    fullName: "מרכז רפואי ביקור חולים",
    address: "שטראוס 5, ירושלים",
    region: "jerusalem",
    matchTerms: ["ביקור חולים", "bikur"],
  },
  {
    slug: "shaare-zedek",
    shortLabel: "שערי צדק",
    fullName: "מרכז רפואי שערי צדק",
    address: "בית שמואל 12, ירושלים",
    region: "jerusalem",
    matchTerms: ["שערי צדק", "צדק", "shaare zedek", "shaarei"],
  },
  {
    slug: "rambam",
    shortLabel: 'רמב"ם',
    fullName: 'מרכז רפואי רמב"ם',
    address: "העלייה השניה 6, חיפה",
    region: "north",
    matchTerms: ['רמב"ם', "רמבם", "rambam"],
  },
  {
    slug: "carmel",
    shortLabel: "כרמל",
    fullName: "מרכז רפואי כרמל",
    address: 'מיכ"ל 7, חיפה',
    region: "north",
    matchTerms: ["כרמל", "carmel"],
  },
  {
    slug: "bnei-zion",
    shortLabel: "בני ציון",
    fullName: "מרכז רפואי בני ציון",
    address: "גולמב 47, חיפה",
    region: "north",
    matchTerms: ["בני ציון", "bnei zion"],
  },
  {
    slug: "ziv",
    shortLabel: "זיו",
    fullName: "מרכז רפואי זיו",
    address: "צפת",
    region: "north",
    matchTerms: ["זיו", "ziv"],
  },
  {
    slug: "hillel-yaffe",
    shortLabel: "הלל יפה",
    fullName: "מרכז רפואי הלל יפה",
    address: "חדרה",
    region: "north",
    matchTerms: ["הלל יפה", "hillel yaffe"],
  },
  {
    slug: "poria",
    shortLabel: "פוריה",
    fullName: "מרכז רפואי פוריה",
    address: "טבריה",
    region: "north",
    matchTerms: ["פוריה", "poria"],
  },
  {
    slug: "emek",
    shortLabel: "העמק",
    fullName: "מרכז רפואי העמק",
    address: "עפולה",
    region: "north",
    matchTerms: ["העמק", "עמק", "emek"],
  },
  {
    slug: "barzilai",
    shortLabel: "ברזילי",
    fullName: "מרכז רפואי ברזילי",
    address: "ההסתדרות 3, אשקלון",
    region: "south",
    matchTerms: ["ברזילי", "barzilai"],
  },
  {
    slug: "soroka",
    shortLabel: "סורוקה",
    fullName: "מרכז רפואי סורוקה",
    address: "באר שבע",
    region: "south",
    matchTerms: ["סורוקה", "soroka"],
  },
  {
    slug: "yoseftal",
    shortLabel: "יוספטל",
    fullName: "מרכז רפואי יוספטל",
    address: "אילת",
    region: "south",
    matchTerms: ["יוספטל", "yoseftal"],
  },
  {
    slug: "clalit",
    shortLabel: "כללית",
    fullName: "כללית",
    address: "",
    region: "center",
    matchTerms: ["כללית", "clalit"],
  },
  {
    slug: "maccabi",
    shortLabel: "מכבי שירותי בריאות",
    fullName: "מכבי שירותי בריאות",
    address: "",
    region: "center",
    matchTerms: ["מכבי", "מכבי שירותי", "maccabi"],
  },
  {
    slug: "meuhedet",
    shortLabel: "מאוחדת",
    fullName: "מאוחדת",
    address: "",
    region: "center",
    matchTerms: ["מאוחדת", "meuhedet"],
  },
  {
    slug: "leumit",
    shortLabel: "לאומית",
    fullName: "לאומית",
    address: "",
    region: "center",
    matchTerms: ["לאומית", "leumit"],
  },
  {
    slug: "shalvata",
    shortLabel: "שלוותה",
    fullName: "מרכז רפואי שלוותה",
    address: "הוד השרון",
    region: "center",
    matchTerms: ["שלוותה", "shalvata", "הוד השרון"],
  },
];

export const MEDICAL_INSTITUTIONS: MedicalInstitution[] = MEDICAL_INSTITUTIONS_RAW.map(
  (institution) => ({
    ...institution,
    locationShort: locationShortFromAddress(institution.address),
  }),
);

const bySlug = new Map(MEDICAL_INSTITUTIONS.map((i) => [i.slug, i]));

/** All institutions for profile dropdown, plus "other" at the end. */
export const PROFILE_INSTITUTION_SLUGS: string[] = [
  ...MEDICAL_INSTITUTIONS.map((i) => i.slug),
  INSTITUTION_OTHER_SLUG,
];

export function isValidProfileInstitutionSlug(slug: string): boolean {
  return PROFILE_INSTITUTION_SLUGS.includes(slug);
}

export function getInstitutionBySlug(slug: string): MedicalInstitution | undefined {
  return bySlug.get(slug);
}

export function getInstitutionsByRegion(region: InstitutionRegion) {
  return MEDICAL_INSTITUTIONS.filter((i) => i.region === region);
}

/** Institutions in a region, sorted א–ת (Hebrew). */
export function getInstitutionsByRegionSorted(region: InstitutionRegion) {
  return getInstitutionsByRegion(region).sort((a, b) =>
    a.shortLabel.localeCompare(b.shortLabel, "he"),
  );
}

export function headlineMatchesInstitution(
  headline: string | null,
  institution: MedicalInstitution,
): boolean {
  if (!headline?.trim()) {
    return false;
  }
  const hay = headline.toLowerCase();
  return institution.matchTerms.some((term) => hay.includes(term.toLowerCase()));
}

/** Whether a profile's current workplace matches an institution (slug only; no headline guess). */
export function profileMatchesInstitution(
  workplaceInstitutionSlug: string | null | undefined,
  _headline: string | null,
  institution: MedicalInstitution,
): boolean {
  return workplaceInstitutionSlug === institution.slug;
}
