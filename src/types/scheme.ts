export type LanguageCode = 'te' | 'en';

export type OccupationType =
  | 'daily_wage'
  | 'farmer'
  | 'student'
  | 'homemaker'
  | 'weaver'
  | 'toddy_tapper'
  | 'fisherman'
  | 'construction_worker'
  | 'small_business'
  | 'unemployed';

export type MonthlyIncomeBand = 'below_10000' | '10000_to_12000' | 'above_12000';

export type MaritalStatusType = 'single' | 'married' | 'widow' | 'widower' | 'divorced';

export type EducationLevelType =
  | 'school_1_to_12'
  | 'diploma_iti'
  | 'graduate'
  | 'postgraduate'
  | 'none';

export interface WelfareProfile {
  age: number | null;
  gender: 'female' | 'male' | 'other' | null;
  marital_status: MaritalStatusType | null;
  occupation: OccupationType | null;
  monthly_family_income_band: MonthlyIncomeBand | null;
  has_white_ration_card: boolean | null;
  land_acres_wet: number | null;
  land_acres_dry: number | null;
  is_woman_head_of_household: boolean | null;
  has_sadarem_certificate: boolean | null;
  has_caste_certificate: boolean | null;
  is_shg_member: boolean | null;
  is_registered_unorganised_worker: boolean | null;
  education_level: EducationLevelType | null;
  district: string | null;

  // Additional possession/eligibility context flags (never ID numbers!)
  resident_ap: boolean | null;
  sadarem_disability_percent: number | null;
  shg_membership_years: number | null;
  is_tenant_ccrc_farmer: boolean | null;
  is_urban: boolean | null;
  has_active_pf_or_esi: boolean | null;
  not_receiving_other_pension: boolean | null;
  attendance_above_75: boolean | null;

  // Document possession indicators (never ID numbers!)
  has_bank_passbook_first_page: boolean | null;
  has_income_certificate: boolean | null;
  has_husbands_death_certificate: boolean | null;
  has_land_records_meebhoomi: boolean | null;
  has_labour_or_eshram_card: boolean | null;
  has_education_certificate: boolean | null;
  has_aadhaar_card_possession: boolean | null;
}

export interface AndhraScheme {
  scheme_id: string;
  scheme_name: string;
  target_group: string;
  benefit_summary: string;
  eligibility_rules: Record<string, unknown>;
  documents_required: string[];
  application_channel: string;
  official_source_url: string;
  last_verified: string;
  verification_status: string;
  notes: string;
}

export type EligibilityVerdict =
  | 'MATCH'
  | 'NEEDS_INFORMATION'
  | 'DOES_NOT_MATCH'
  | 'UNVERIFIED';

export interface RuleDetail {
  labelEn: string;
  labelTe: string;
  outcome: 'pass' | 'fail' | 'unknown' | 'unverified';
  explanationEn: string;
  explanationTe: string;
  field?: keyof WelfareProfile;
}

export interface MissingFieldReason {
  field: keyof WelfareProfile;
  whyEn: string;
  whyTe: string;
  questionEn: string;
  questionTe: string;
}

export interface DocumentSplit {
  alreadyHave: string[];
  needToGet: string[];
}

export interface EligibilityCheckResult {
  scheme: AndhraScheme;
  verdict: EligibilityVerdict;
  isStaleOver90Days: boolean;
  daysSinceVerified: number;
  matchedRuleSummaryEn: string;
  matchedRuleSummaryTe: string;
  rules: RuleDetail[];
  missingField: MissingFieldReason | null;
  doesNotMatchReasonEn: string | null;
  doesNotMatchReasonTe: string | null;
  nearestAlternativeId: string | null;
  nearestAlternativeReasonEn: string | null;
  nearestAlternativeReasonTe: string | null;
  documents: DocumentSplit;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  extractedSummary?: string[];
  isError?: boolean;
}

export interface PhoneReminder {
  id: string;
  phoneNumber: string;
  schemeIds: string[];
  remindDeadlines: boolean;
  remindSuperSixReverification: boolean;
  remind30DayFollowUp: boolean;
  followUpDate: string;
  createdAt: string;
}

export interface WelfareSampleScenario {
  id: string;
  labelEn: string;
  labelTe: string;
  utteranceEn: string;
  utteranceTe: string;
  profile: Partial<WelfareProfile>;
}
