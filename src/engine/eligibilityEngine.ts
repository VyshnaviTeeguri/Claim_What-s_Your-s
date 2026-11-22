import andhraSchemesData from '../data/andhraSchemes.json';
import {
  AndhraScheme,
  DocumentSplit,
  EligibilityCheckResult,
  EligibilityVerdict,
  MissingFieldReason,
  RuleDetail,
  WelfareProfile,
} from '../types/scheme';

export const EMPTY_PROFILE: WelfareProfile = {
  age: null,
  gender: null,
  marital_status: null,
  occupation: null,
  monthly_family_income_band: null,
  has_white_ration_card: null,
  land_acres_wet: null,
  land_acres_dry: null,
  is_woman_head_of_household: null,
  has_sadarem_certificate: null,
  has_caste_certificate: null,
  is_shg_member: null,
  is_registered_unorganised_worker: null,
  education_level: null,
  district: null,
  resident_ap: true, // Andhra Pradesh navigator default; turns false only if user states outside AP
  sadarem_disability_percent: null,
  shg_membership_years: null,
  is_tenant_ccrc_farmer: null,
  is_urban: null,
  has_active_pf_or_esi: null,
  not_receiving_other_pension: null,
  attendance_above_75: null,
  has_bank_passbook_first_page: null,
  has_income_certificate: null,
  has_husbands_death_certificate: null,
  has_land_records_meebhoomi: null,
  has_labour_or_eshram_card: null,
  has_education_certificate: null,
  has_aadhaar_card_possession: null,
};

export const ANDHRA_SCHEMES: AndhraScheme[] = andhraSchemesData as AndhraScheme[];

export const STALE_VERIFICATION_LABEL_EN =
  'verification pending — confirm at your Grama/Ward Sachivalayam';
export const STALE_VERIFICATION_LABEL_TE =
  'ధృవీకరణ పెండింగ్‌లో ఉంది — మీ గ్రామ/వార్డు సచివాలయంలో నిర్ధారించుకోండి';

/**
 * Core Principle 5: If last_verified is more than 90 days old, mark as stale.
 */
export function getVerificationAge(
  lastVerifiedIso: string,
  referenceDate: Date = new Date(),
): { daysSinceVerified: number; isStaleOver90Days: boolean } {
  const verifiedDate = new Date(`${lastVerifiedIso}T00:00:00Z`);
  if (Number.isNaN(verifiedDate.getTime())) {
    return { daysSinceVerified: 999, isStaleOver90Days: true };
  }
  const diffMs = referenceDate.getTime() - verifiedDate.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return {
    daysSinceVerified: days,
    isStaleOver90Days: days > 90,
  };
}

/**
 * Splits scheme documents into "You already have" vs "You need to get"
 * based ONLY on possession booleans (never ID numbers).
 */
export function splitDocumentsByPossession(
  documents: string[],
  profile: WelfareProfile,
): DocumentSplit {
  const alreadyHave: string[] = [];
  const needToGet: string[] = [];

  for (const doc of documents) {
    const lower = doc.toLowerCase();
    let hasDoc = false;

    if (lower.includes('white ration card')) {
      hasDoc = profile.has_white_ration_card === true;
    } else if (lower.includes('sadarem')) {
      hasDoc = profile.has_sadarem_certificate === true;
    } else if (lower.includes('death certificate')) {
      hasDoc = profile.has_husbands_death_certificate === true;
    } else if (lower.includes('bank passbook') || lower.includes('bank account')) {
      hasDoc = profile.has_bank_passbook_first_page === true;
    } else if (lower.includes('income proof') || lower.includes('income certificate')) {
      hasDoc = profile.has_income_certificate === true || profile.has_white_ration_card === true;
    } else if (lower.includes('land records') || lower.includes('adangal')) {
      hasDoc = profile.has_land_records_meebhoomi === true;
    } else if (lower.includes('labour registration') || lower.includes('e-shram')) {
      hasDoc =
        profile.has_labour_or_eshram_card === true ||
        profile.is_registered_unorganised_worker === true;
    } else if (
      lower.includes('degree/pg/diploma') ||
      lower.includes('graduate certificate')
    ) {
      hasDoc = profile.has_education_certificate === true;
    } else if (lower.includes('shg membership')) {
      hasDoc = profile.is_shg_member === true;
    } else if (lower.includes('aadhaar') || lower.includes('government id') || lower.includes('age proof')) {
      hasDoc = profile.has_aadhaar_card_possession === true;
    }

    if (hasDoc) {
      alreadyHave.push(doc);
    } else {
      needToGet.push(doc);
    }
  }

  return { alreadyHave, needToGet };
}

function getMissingPrompt(
  field: keyof WelfareProfile,
  schemeName: string,
): MissingFieldReason {
  const map: Partial<Record<keyof WelfareProfile, MissingFieldReason>> = {
    age: {
      field: 'age',
      whyEn: `To check ${schemeName}, I need your age.`,
      whyTe: `${schemeName} పథకాన్ని తనిఖీ చేయడానికి నాకు మీ వయస్సు అవసరం.`,
      questionEn: `To check ${schemeName}, I need your age — can you tell me?`,
      questionTe: `${schemeName} పథకం కోసం మీ వయస్సు ఎంతో చెప్పగలరా?`,
    },
    gender: {
      field: 'gender',
      whyEn: `To check ${schemeName}, I need to know whether the applicant is female or male.`,
      whyTe: `${schemeName} పథకం మహిళల కోసమే కాబట్టి వివరాలు అవసరం.`,
      questionEn: `To check ${schemeName}, is the applicant a woman or man?`,
      questionTe: `${schemeName} కోసం దరఖాస్తుదారు మహిళనా లేదా పురుషుడా చెప్పగలరా?`,
    },
    marital_status: {
      field: 'marital_status',
      whyEn: `To check Widow Pension, I need to know marital status.`,
      whyTe: `వితంతు పెన్షన్ అర్హతను తనిఖీ చేయడానికి వైవాహిక స్థితి అవసరం.`,
      questionEn: `To check Widow Pension, is anyone in your home a widow?`,
      questionTe: `వితంతు పెన్షన్ తనిఖీ కోసం మీ ఇంట్లో ఎవరైనా వితంతువులు ఉన్నారా?`,
    },
    has_white_ration_card: {
      field: 'has_white_ration_card',
      whyEn: `To check ${schemeName}, I need to know if your family has a White Ration Card.`,
      whyTe: `${schemeName} కోసం మీ కుటుంబానికి తెల్ల రేషన్ కార్డు ఉందో లేదో తెలుసుకోవాలి.`,
      questionEn: `To check ${schemeName}, do you have a White Ration Card?`,
      questionTe: `${schemeName} కోసం మీకు తెల్ల రేషన్ కార్డు ఉందా? (నంబర్ చెప్పాల్సిన అవసరం లేదు)`,
    },
    monthly_family_income_band: {
      field: 'monthly_family_income_band',
      whyEn: `To check ${schemeName}, I need your approximate monthly family income.`,
      whyTe: `${schemeName} కోసం మీ కుటుంబ నెలవారీ ఆదాయం సుమారు ఎంతో తెలుసుకోవాలి.`,
      questionEn: `To check ${schemeName}, is your monthly family income below ₹10,000, ₹10,000–₹12,000, or above ₹12,000?`,
      questionTe: `${schemeName} కోసం మీ కుటుంబ నెల ఆదాయం ₹10,000 లోపు ఉందా, ₹10,000–₹12,000 మధ్య ఉందా, లేదా అంతకంటే ఎక్కువా?`,
    },
    has_sadarem_certificate: {
      field: 'has_sadarem_certificate',
      whyEn: `To check Disabled Pension (₹6,000/month), I need to know if you have a SADAREM certificate.`,
      whyTe: `దివ్యాంగుల పెన్షన్ (నెలకు ₹6,000) కోసం SADAREM సర్టిఫికెట్ ఉందో లేదో తెలుసుకోవాలి.`,
      questionEn: `To check Disabled Pension, does the person with disability have a SADAREM certificate?`,
      questionTe: `దివ్యాంగుల పెన్షన్ తనిఖీ కోసం SADAREM సర్టిఫికెట్ ఉందా?`,
    },
    occupation: {
      field: 'occupation',
      whyEn: `To check ${schemeName}, I need to know the family's main work or occupation.`,
      whyTe: `${schemeName} కోసం కుటుంబ సభ్యుల ప్రధాన పని లేదా వృత్తి వివరాలు అవసరం.`,
      questionEn: `To check ${schemeName}, what work does your family do (farming, daily wage, student, small business)?`,
      questionTe: `${schemeName} కోసం మీరు ఏ పని చేస్తారు (వ్యవసాయం, రోజువారీ కూలీ, చదువు, లేదా చిన్న వ్యాపారం)?`,
    },
    land_acres_wet: {
      field: 'land_acres_wet',
      whyEn: `To check farmer schemes like ${schemeName}, I need to know your land holding or tenant status.`,
      whyTe: `${schemeName} కోసం మీకు ఎంత వ్యవసాయ భూమి ఉందో లేదా కౌలు రైతు కార్డు (CCRC) ఉందో తెలుసుకోవాలి.`,
      questionEn: `To check ${schemeName}, how many acres of wet/dry land do you own, or do you hold a tenant CCRC card?`,
      questionTe: `${schemeName} కోసం మీకు ఎన్ని ఎకరాల భూమి ఉంది లేదా CCRC కౌలు కార్డు ఉందా?`,
    },
    education_level: {
      field: 'education_level',
      whyEn: `To check ${schemeName}, I need your education level.`,
      whyTe: `${schemeName} కోసం మీ విద్యార్హత స్థాయి తెలుసుకోవాలి.`,
      questionEn: `To check ${schemeName}, what class or degree have you completed or are studying?`,
      questionTe: `${schemeName} కోసం మీరు ఏ తరగతి లేదా డిగ్రీ చదువుతున్నారు / పూర్తి చేశారు?`,
    },
    is_shg_member: {
      field: 'is_shg_member',
      whyEn: `To check Digi-Lakshmi (₹2–2.5 lakh kiosk loan), I need to know if you belong to a women's SHG group.`,
      whyTe: `డిజి-లక్ష్మి పథకం కోసం మీరు మహిళా స్వయం సహాయక సంఘం (SHG) సభ్యురాలా అని తెలుసుకోవాలి.`,
      questionEn: `To check Digi-Lakshmi, have you been a member of a women's SHG group for at least 3 years?`,
      questionTe: `డిజి-లక్ష్మి రుణం కోసం మీరు కనీసం 3 ఏళ్లుగా మహిళా సంఘం (SHG) సభ్యురాలిగా ఉన్నారా?`,
    },
    is_registered_unorganised_worker: {
      field: 'is_registered_unorganised_worker',
      whyEn: `To check Unorganised Worker Welfare benefits, I need to know if you have a Labour or e-Shram registration card.`,
      whyTe: `అసంఘటిత కార్మిక సంక్షేమ పథకం కోసం మీకు లేబర్ కార్డు లేదా ఈ-శ్రమ్ నమోదు ఉందో తెలుసుకోవాలి.`,
      questionEn: `To check worker welfare benefits, do you have a Labour registration or e-Shram card?`,
      questionTe: `కార్మిక సంక్షేమ ప్రయోజనాల కోసం మీకు లేబర్ కార్డు లేదా ఈ-శ్రమ్ కార్డు ఉందా?`,
    },
  };

  return (
    map[field] ?? {
      field,
      whyEn: `To check ${schemeName}, I need this detail.`,
      whyTe: `${schemeName} తనిఖీ కోసం ఈ వివరం అవసరం.`,
      questionEn: `Could you share your ${String(field).replace(/_/g, ' ')}?`,
      questionTe: `దయచేసి ఈ వివరం చెప్పగలరా?`,
    }
  );
}

/**
 * Deterministic Step 3 function:
 * check_eligibility(scheme_id, profile) -> MATCH | NEEDS_INFORMATION | DOES_NOT_MATCH | UNVERIFIED
 * AI NEVER calls or overrides this logic — it runs purely in TypeScript.
 */
export function check_eligibility(
  scheme_id: string,
  profile: WelfareProfile,
  referenceDate: Date = new Date(),
): EligibilityCheckResult {
  const scheme = ANDHRA_SCHEMES.find((s) => s.scheme_id === scheme_id);
  if (!scheme) {
    throw new Error(`Unknown scheme_id: ${scheme_id}`);
  }

  const { daysSinceVerified, isStaleOver90Days } = getVerificationAge(
    scheme.last_verified,
    referenceDate,
  );
  const documents = splitDocumentsByPossession(scheme.documents_required, profile);

  const rules: RuleDetail[] = [];
  let hardFailReasonEn: string | null = null;
  let hardFailReasonTe: string | null = null;
  let firstMissing: MissingFieldReason | null = null;
  let nearestAltId: string | null = null;
  let nearestAltEn: string | null = null;
  let nearestAltTe: string | null = null;

  const fail = (
    labelEn: string,
    labelTe: string,
    reasonEn: string,
    reasonTe: string,
    field?: keyof WelfareProfile,
  ) => {
    rules.push({
      labelEn,
      labelTe,
      outcome: 'fail',
      explanationEn: reasonEn,
      explanationTe: reasonTe,
      field,
    });
    if (!hardFailReasonEn) {
      hardFailReasonEn = reasonEn;
      hardFailReasonTe = reasonTe;
    }
  };

  const pass = (
    labelEn: string,
    labelTe: string,
    reasonEn: string,
    reasonTe: string,
    field?: keyof WelfareProfile,
  ) => {
    rules.push({
      labelEn,
      labelTe,
      outcome: 'pass',
      explanationEn: reasonEn,
      explanationTe: reasonTe,
      field,
    });
  };

  const unknown = (
    labelEn: string,
    labelTe: string,
    field: keyof WelfareProfile,
  ) => {
    const prompt = getMissingPrompt(field, scheme.scheme_name);
    rules.push({
      labelEn,
      labelTe,
      outcome: 'unknown',
      explanationEn: prompt.whyEn,
      explanationTe: prompt.whyTe,
      field,
    });
    if (!firstMissing) {
      firstMissing = prompt;
    }
  };

  // Resident AP check (shared across schemes)
  if (profile.resident_ap === false) {
    fail(
      'Andhra Pradesh Residence',
      'ఆంధ్రప్రదేశ్ నివాసం',
      'Only residents of Andhra Pradesh are eligible for this state scheme.',
      'ఈ పథకం ఆంధ్రప్రదేశ్ నివాసితులకు మాత్రమే వర్తిస్తుంది.',
      'resident_ap',
    );
  } else {
    pass(
      'Andhra Pradesh Residence',
      'ఆంధ్రప్రదేశ్ నివాసం',
      profile.district
        ? `Resident of Andhra Pradesh (${profile.district} district).`
        : 'Andhra Pradesh residence assumed for local evaluation.',
      profile.district
        ? `ఆంధ్రప్రదేశ్ నివాసి (${profile.district} జిల్లా).`
        : 'ఆంధ్రప్రదేశ్ నివాసిగా పరిగణించబడింది.',
      'resident_ap',
    );
  }

  // Scheme-specific deterministic rule checks
  switch (scheme_id) {
    case 'AP_NTR_BHAROSA_OAP': {
      if (profile.age === null) {
        unknown('Age (65+)', 'వయస్సు (65+)', 'age');
      } else if (profile.age >= 65) {
        pass(
          'Age (65+)',
          'వయస్సు (65+)',
          `Age ${profile.age} meets the 65+ senior citizen threshold.`,
          `వయస్సు ${profile.age} ఏళ్లు — 65+ వృద్ధాప్య పెన్షన్ నియమానికి సరిపోయింది.`,
          'age',
        );
      } else {
        fail(
          'Age (65+)',
          'వయస్సు (65+)',
          `Age ${profile.age} is below the 65-year Old Age Pension threshold.`,
          `వయస్సు ${profile.age} ఏళ్లు — వృద్ధాప్య పెన్షన్‌కు కనీసం 65 ఏళ్లు ఉండాలి.`,
          'age',
        );
        if (profile.gender === 'female' && profile.age >= 18 && profile.age <= 59) {
          nearestAltId = 'AP_AADABIDDA_NIDHI';
          nearestAltEn = 'Consider Aadabidda Nidhi (₹1,500/month for women aged 18–59).';
          nearestAltTe = '18–59 ఏళ్ల మహిళల కోసం ఆడబిడ్డ నిధి (నెలకు ₹1,500) పరిశీలించండి.';
        } else {
          nearestAltId = 'AP_DEEPAM_2';
          nearestAltEn = 'With a White Ration Card, check Deepam 2.0 (3 free LPG cylinders/year).';
          nearestAltTe = 'తెల్ల రేషన్ కార్డు ఉంటే దీపం 2.0 (ఏడాదికి 3 ఉచిత గ్యాస్ సిలిండర్లు) చూడండి.';
        }
      }

      if (profile.has_white_ration_card === null) {
        unknown('White Ration Card (BPL)', 'తెల్ల రేషన్ కార్డు', 'has_white_ration_card');
      } else if (profile.has_white_ration_card) {
        pass(
          'White Ration Card (BPL)',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card confirms BPL household eligibility.',
          'తెల్ల రేషన్ కార్డు ఉండటం వల్ల BPL కుటుంబ అర్హత సరిపోయింది.',
          'has_white_ration_card',
        );
      } else {
        fail(
          'White Ration Card (BPL)',
          'తెల్ల రేషన్ కార్డు',
          'A White Ration Card is required for NTR Bharosa Old Age Pension.',
          'NTR భరోసా వృద్ధాప్య పెన్షన్‌కు తెల్ల రేషన్ కార్డు తప్పనిసరి.',
          'has_white_ration_card',
        );
      }
      break;
    }

    case 'AP_NTR_BHAROSA_WIDOW': {
      if (profile.marital_status === null) {
        unknown('Widow Status', 'వితంతు స్థితి', 'marital_status');
      } else if (profile.marital_status === 'widow') {
        pass(
          'Widow Status',
          'వితంతు స్థితి',
          'Widow status matches NTR Bharosa Widow Pension (no age limit).',
          'వితంతు స్థితి సరిపోయింది (ఈ పెన్షన్‌కు వయస్సు పరిమితి లేదు).',
          'marital_status',
        );
      } else {
        fail(
          'Widow Status',
          'వితంతు స్థితి',
          'Widow Pension applies specifically to widows.',
          'వితంతు పెన్షన్ వితంతువులకు మాత్రమే వర్తిస్తుంది.',
          'marital_status',
        );
        if (profile.gender === 'female') {
          nearestAltId = 'AP_AADABIDDA_NIDHI';
          nearestAltEn = 'Check Aadabidda Nidhi (women 18–59) or Stree Shakti free bus travel.';
          nearestAltTe = 'మహిళల కోసం ఆడబిడ్డ నిధి లేదా స్త్రీ శక్తి ఉచిత బస్సు ప్రయాణం చూడండి.';
        }
      }

      if (profile.has_white_ration_card === null) {
        unknown('White Ration Card', 'తెల్ల రేషన్ కార్డు', 'has_white_ration_card');
      } else if (profile.has_white_ration_card) {
        pass(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card possession confirmed.',
          'తెల్ల రేషన్ కార్డు ఉంది.',
          'has_white_ration_card',
        );
      } else {
        fail(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card is required for Widow Pension.',
          'వితంతు పెన్షన్ కోసం తెల్ల రేషన్ కార్డు అవసరం.',
          'has_white_ration_card',
        );
      }
      break;
    }

    case 'AP_NTR_BHAROSA_DISABLED': {
      if (profile.has_sadarem_certificate === null) {
        unknown('SADAREM Certificate (≥40%)', 'SADAREM సర్టిఫికెట్ (≥40%)', 'has_sadarem_certificate');
      } else if (profile.has_sadarem_certificate === false) {
        fail(
          'SADAREM Certificate (≥40%)',
          'SADAREM సర్టిఫికెట్ (≥40%)',
          'A SADAREM certificate showing ≥40% disability is required.',
          'కనీసం 40% వైకల్యం ఉన్న SADAREM సర్టిఫికెట్ తప్పనిసరి.',
          'has_sadarem_certificate',
        );
        nearestAltId = 'AP_DEEPAM_2';
        nearestAltEn = 'Book a SADAREM assessment via Sachivalayam, and check Deepam 2.0 meanwhile.';
        nearestAltTe = 'సచివాలయం ద్వారా SADAREM పరీక్షకు దరఖాస్తు చేసుకోండి; అలాగే దీపం 2.0 చూడండి.';
      } else if (
        profile.sadarem_disability_percent !== null &&
        profile.sadarem_disability_percent < 40
      ) {
        fail(
          'Disability Percentage (≥40%)',
          'వైకల్య శాతం (≥40%)',
          `Disability of ${profile.sadarem_disability_percent}% is below the 40% minimum.`,
          `వైకల్యం ${profile.sadarem_disability_percent}% ఉంది — కనీసం 40% ఉండాలి.`,
          'sadarem_disability_percent',
        );
      } else {
        pass(
          'SADAREM Certificate',
          'SADAREM సర్టిఫికెట్',
          'SADAREM disability certificate confirmed (≥40% threshold applies).',
          'SADAREM సర్టిఫికెట్ ఉంది (≥40% వైకల్యం నియమం వర్తిస్తుంది).',
          'has_sadarem_certificate',
        );
      }

      if (profile.has_white_ration_card === null) {
        unknown('White Ration Card', 'తెల్ల రేషన్ కార్డు', 'has_white_ration_card');
      } else if (profile.has_white_ration_card) {
        pass(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card possession confirmed.',
          'తెల్ల రేషన్ కార్డు ఉంది.',
          'has_white_ration_card',
        );
      } else {
        fail(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card is required for Disabled Pension.',
          'దివ్యాంగుల పెన్షన్ కోసం తెల్ల రేషన్ కార్డు అవసరం.',
          'has_white_ration_card',
        );
      }
      break;
    }

    case 'AP_THALLIKI_VANDANAM': {
      if (profile.education_level === null && profile.occupation !== 'student') {
        if (profile.occupation !== null) {
          fail(
            'School Child (Classes 1–12)',
            'పాఠశాల విద్యార్థి (1–12 తరగతులు)',
            'Thalliki Vandanam applies to families with children in Classes 1 to 12.',
            'తల్లికి వందనం 1 నుండి 12వ తరగతి చదువుతున్న పిల్లలున్న కుటుంబాలకు వర్తిస్తుంది.',
            'education_level',
          );
          nearestAltId = 'AP_DEEPAM_2';
          nearestAltEn = 'Check Deepam 2.0 or Aadabidda Nidhi for household support.';
          nearestAltTe = 'కుటుంబ సహాయం కోసం దీపం 2.0 లేదా ఆడబిడ్డ నిధి చూడండి.';
        } else {
          unknown('School Student (Classes 1–12)', 'పాఠశాల విద్యార్థి', 'education_level');
        }
      } else if (profile.education_level === 'school_1_to_12') {
        pass(
          'School Student (Classes 1–12)',
          'పాఠశాల విద్యార్థి (1–12 తరగతులు)',
          'School student in Classes 1–12 matches Thalliki Vandanam.',
          '1–12 తరగతి పాఠశాల విద్యార్థి నియమానికి సరిపోయింది.',
          'education_level',
        );
      } else if (profile.education_level !== null) {
        fail(
          'School Student (Classes 1–12)',
          'పాఠశాల విద్యార్థి (1–12 తరగతులు)',
          'Thalliki Vandanam is only for school students in Classes 1–12.',
          'తల్లికి వందనం 1–12 తరగతి విద్యార్థులకు మాత్రమే.',
          'education_level',
        );
        nearestAltId = 'AP_VIDYA_DEVEEVANA';
        nearestAltEn = 'For college/diploma courses, check Vidya Deevena or Nirudyoga Bruthi.';
        nearestAltTe = 'డిగ్రీ/డిప్లొమా విద్యార్థులు విద్యా దీవెన లేదా నిరుద్యోగ భృతి చూడండి.';
      } else {
        unknown('School Class (1–12)', 'పాఠశాల తరగతి', 'education_level');
      }

      if (profile.has_white_ration_card === null) {
        unknown('White Ration Card', 'తెల్ల రేషన్ కార్డు', 'has_white_ration_card');
      } else if (profile.has_white_ration_card) {
        pass(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card possession confirmed.',
          'తెల్ల రేషన్ కార్డు ఉంది.',
          'has_white_ration_card',
        );
      } else {
        fail(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card is required for Thalliki Vandanam.',
          'తల్లికి వందనం కోసం తెల్ల రేషన్ కార్డు అవసరం.',
          'has_white_ration_card',
        );
      }

      if (profile.monthly_family_income_band === null) {
        unknown(
          'Monthly Family Income (≤₹10,000 rural / ≤₹12,000 urban)',
          'నెలవారీ కుటుంబ ఆదాయం',
          'monthly_family_income_band',
        );
      } else if (profile.monthly_family_income_band === 'above_12000') {
        fail(
          'Monthly Family Income Cap',
          'కుటుంబ ఆదాయ పరిమితి',
          'Monthly income above ₹12,000 exceeds the rural (₹10,000) and urban (₹12,000) limits.',
          'నెల ఆదాయం ₹12,000 దాటినందున ఆదాయ పరిమితికి మించి ఉంది.',
          'monthly_family_income_band',
        );
      } else {
        pass(
          'Monthly Family Income Cap',
          'కుటుంబ ఆదాయ పరిమితి',
          'Monthly family income band fits within the ₹10,000 rural / ₹12,000 urban limit.',
          'కుటుంబ నెల ఆదాయం నిర్దేశిత పరిమితిలోపు ఉంది.',
          'monthly_family_income_band',
        );
      }
      break;
    }

    case 'AP_VIDYA_DEVEEVANA': {
      if (profile.education_level === null && profile.occupation !== 'student') {
        if (profile.occupation !== null) {
          fail(
            'Higher Education Course',
            'ఉన్నత విద్య కోర్సు',
            'Vidya Deevena applies to Degree, PG, Diploma, Polytechnic, or ITI students.',
            'విద్యా దీవెన డిగ్రీ, పీజీ, డిప్లొమా, పాలిటెక్నిక్ లేదా ఐటీఐ విద్యార్థులకు మాత్రమే.',
            'education_level',
          );
        } else {
          unknown('Higher Education Course', 'ఉన్నత విద్య కోర్సు', 'education_level');
        }
      } else if (
        profile.education_level === 'diploma_iti' ||
        profile.education_level === 'graduate' ||
        profile.education_level === 'postgraduate'
      ) {
        pass(
          'Higher Education Course',
          'ఉన్నత విద్య కోర్సు',
          'Higher education / diploma course matches Vidya Deevena scope.',
          'డిగ్రీ / పీజీ / డిప్లొమా కోర్సు సరిపోయింది.',
          'education_level',
        );
      } else if (profile.education_level !== null) {
        fail(
          'Higher Education Course',
          'ఉన్నత విద్య కోర్సు',
          'School students should check Thalliki Vandanam instead of Vidya Deevena.',
          'పాఠశాల విద్యార్థులకు విద్యా దీవెన బదులు తల్లికి వందనం వర్తిస్తుంది.',
          'education_level',
        );
        nearestAltId = 'AP_THALLIKI_VANDANAM';
        nearestAltEn = 'School students (Classes 1–12) can check Thalliki Vandanam (₹15,000/yr).';
        nearestAltTe = '1–12 తరగతి విద్యార్థులు తల్లికి వందనం (ఏడాదికి ₹15,000) చూడండి.';
      } else {
        unknown('Higher Education Course', 'ఉన్నత విద్య కోర్సు', 'education_level');
      }

      if (profile.has_white_ration_card === false) {
        fail(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card is required for fee reimbursement.',
          'ఫీజు రీయింబర్స్‌మెంట్ కోసం తెల్ల రేషన్ కార్డు అవసరం.',
          'has_white_ration_card',
        );
      } else if (profile.has_white_ration_card === null) {
        unknown('White Ration Card', 'తెల్ల రేషన్ కార్డు', 'has_white_ration_card');
      } else {
        pass(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card possession confirmed.',
          'తెల్ల రేషన్ కార్డు ఉంది.',
          'has_white_ration_card',
        );
      }

      if (profile.monthly_family_income_band === 'above_12000') {
        fail(
          'Monthly Family Income Cap',
          'కుటుంబ ఆదాయ పరిమితి',
          'Monthly income above ₹12,000 exceeds scheme limits.',
          'నెల ఆదాయం ₹12,000 దాటినందున అర్హత పరిమితిలో లేదు.',
          'monthly_family_income_band',
        );
      } else if (profile.monthly_family_income_band === null) {
        unknown('Monthly Family Income', 'నెలవారీ ఆదాయం', 'monthly_family_income_band');
      } else {
        pass(
          'Monthly Family Income Cap',
          'కుటుంబ ఆదాయ పరిమితి',
          'Monthly family income band fits within scheme limits.',
          'కుటుంబ నెల ఆదాయం పరిమితిలోపు ఉంది.',
          'monthly_family_income_band',
        );
      }
      break;
    }

    case 'AP_ANNADATA_SUKHIBHAVA': {
      if (profile.occupation === null) {
        unknown('Farmer Occupation', 'రైతు వృత్తి', 'occupation');
      } else if (profile.occupation === 'farmer') {
        pass(
          'Farmer Occupation',
          'రైతు వృత్తి',
          'Occupation is farmer.',
          'వృత్తి రైతుగా నిర్ధారించబడింది.',
          'occupation',
        );
      } else {
        fail(
          'Farmer Occupation',
          'రైతు వృత్తి',
          'Annadata Sukhibhava is for landowning farmers or CCRC tenant farmers.',
          'అన్నదాత సుఖీభవ భూమి ఉన్న రైతులు లేదా CCRC కౌలు రైతులకు మాత్రమే.',
          'occupation',
        );
        if (profile.occupation === 'daily_wage' || profile.occupation === 'construction_worker') {
          nearestAltId = 'AP_UNORGANISED_WELFARE';
          nearestAltEn = 'Check AP Unorganised Worker Welfare for daily-wage/construction benefits.';
          nearestAltTe = 'రోజువారీ కూలీల కోసం అసంఘటిత కార్మిక సంక్షేమ పథకాన్ని చూడండి.';
        }
      }

      const totalLand = (profile.land_acres_wet ?? 0) + (profile.land_acres_dry ?? 0);
      const hasLandInfo =
        profile.land_acres_wet !== null ||
        profile.land_acres_dry !== null ||
        profile.is_tenant_ccrc_farmer !== null;

      if (!hasLandInfo) {
        unknown('Land Ownership or CCRC Tenant Card', 'భూమి లేదా CCRC కౌలు కార్డు', 'land_acres_wet');
      } else if (totalLand > 0 || profile.is_tenant_ccrc_farmer === true) {
        pass(
          'Landholding / CCRC Tenant',
          'భూమి / CCRC కౌలు కార్డు',
          profile.is_tenant_ccrc_farmer
            ? 'CCRC tenant farmer status qualifies for state support.'
            : `Landholding (${totalLand} acres) satisfies farmer family requirement.`,
          profile.is_tenant_ccrc_farmer
            ? 'CCRC కౌలు రైతుగా రాష్ట్ర సహాయానికి అర్హత నియమం సరిపోయింది.'
            : `${totalLand} ఎకరాల భూమి ఉండటం వల్ల రైతు కుటుంబ నియమానికి సరిపోయింది.`,
          'land_acres_wet',
        );
      } else {
        fail(
          'Landholding / CCRC Tenant',
          'భూమి / CCRC కౌలు కార్డు',
          'Requires agricultural land records (Adangal/1-B) or a valid CCRC tenant card.',
          'వ్యవసాయ భూమి రికార్డులు (అడంగల్/1-B) లేదా CCRC కౌలు కార్డు అవసరం.',
          'land_acres_wet',
        );
      }
      break;
    }

    case 'AP_DEEPAM_2': {
      if (profile.has_white_ration_card === null) {
        unknown('White Ration Card', 'తెల్ల రేషన్ కార్డు', 'has_white_ration_card');
      } else if (profile.has_white_ration_card) {
        pass(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'White Ration Card holders in AP match Deepam 2.0 (3 free LPG cylinders/year).',
          'తెల్ల రేషన్ కార్డు ఉండటం వల్ల దీపం 2.0 (ఏడాదికి 3 ఉచిత సిలిండర్లు) నియమానికి సరిపోయింది.',
          'has_white_ration_card',
        );
      } else {
        fail(
          'White Ration Card',
          'తెల్ల రేషన్ కార్డు',
          'Deepam 2.0 requires a White Ration Card.',
          'దీపం 2.0 పథకానికి తెల్ల రేషన్ కార్డు అవసరం.',
          'has_white_ration_card',
        );
        if (profile.gender === 'female') {
          nearestAltId = 'AP_STREE_SHAKTI';
          nearestAltEn = 'Stree Shakti free bus travel requires no White Ration Card or income limit.';
          nearestAltTe = 'స్త్రీ శక్తి ఉచిత బస్సు ప్రయాణానికి రేషన్ కార్డు లేదా ఆదాయ పరిమితి లేదు.';
        }
      }
      break;
    }

    case 'AP_AADABIDDA_NIDHI': {
      if (profile.gender === null) {
        unknown('Gender (Female)', 'మహిళ వివరాలు', 'gender');
      } else if (profile.gender === 'female') {
        pass(
          'Women Beneficiary',
          'మహిళా లబ్ధిదారు',
          'Female applicant matches Aadabidda Nidhi target group.',
          'మహిళా దరఖాస్తుదారు నియమానికి సరిపోయింది.',
          'gender',
        );
      } else {
        fail(
          'Women Beneficiary',
          'మహిళా లబ్ధిదారు',
          'Aadabidda Nidhi is exclusively for women aged 18–59.',
          'ఆడబిడ్డ నిధి 18–59 ఏళ్ల మహిళలకు మాత్రమే.',
          'gender',
        );
        nearestAltId = 'AP_DEEPAM_2';
        nearestAltEn = 'Check Deepam 2.0 (White Ration Card households) or Annadata Sukhibhava.';
        nearestAltTe = 'తెల్ల రేషన్ కార్డు కుటుంబాల కోసం దీపం 2.0 లేదా అన్నదాత సుఖీభవ చూడండి.';
      }

      if (profile.age === null) {
        unknown('Age (18–59)', 'వయస్సు (18–59)', 'age');
      } else if (profile.age >= 18 && profile.age <= 59) {
        pass(
          'Age (18–59)',
          'వయస్సు (18–59)',
          `Age ${profile.age} is within the 18–59 range.`,
          `వయస్సు ${profile.age} ఏళ్లు — 18–59 ఏళ్ల పరిమితిలోపు ఉంది.`,
          'age',
        );
      } else {
        fail(
          'Age (18–59)',
          'వయస్సు (18–59)',
          `Age ${profile.age} is outside the 18–59 range.`,
          `వయస్సు ${profile.age} ఏళ్లు — 18–59 ఏళ్ల పరిమితికి బయట ఉంది.`,
          'age',
        );
        if (profile.age >= 65) {
          nearestAltId = 'AP_NTR_BHAROSA_OAP';
          nearestAltEn = 'At age 65+, check NTR Bharosa Old Age Pension (₹4,000/month).';
          nearestAltTe = '65 ఏళ్లు పైబడిన వారు NTR భరోసా వృద్ధాప్య పెన్షన్ (నెలకు ₹4,000) చూడండి.';
        } else if (profile.gender === 'female') {
          nearestAltId = 'AP_STREE_SHAKTI';
          nearestAltEn = 'Stree Shakti free bus travel applies to AP women of all ages.';
          nearestAltTe = 'స్త్రీ శక్తి ఉచిత బస్సు ప్రయాణం అన్ని వయసుల మహిళలకు వర్తిస్తుంది.';
        }
      }
      break;
    }

    case 'AP_STREE_SHAKTI': {
      if (profile.gender === null) {
        unknown('Gender (Female)', 'మహిళ వివరాలు', 'gender');
      } else if (profile.gender === 'female') {
        pass(
          'Women Domiciled in AP',
          'ఆంధ్రప్రదేశ్ మహిళలు',
          'Universal for women domiciled in Andhra Pradesh (no income limit).',
          'ఆంధ్రప్రదేశ్‌లో నివసించే మహిళలందరికీ వర్తిస్తుంది (ఆదాయ పరిమితి లేదు).',
          'gender',
        );
      } else {
        fail(
          'Women Domiciled in AP',
          'ఆంధ్రప్రదేశ్ మహిళలు',
          'Stree Shakti free bus travel applies to women only.',
          'స్త్రీ శక్తి ఉచిత బస్సు ప్రయాణం మహిళలకు మాత్రమే.',
          'gender',
        );
      }
      break;
    }

    case 'AP_NIRUDYOGA_BRUTHI': {
      if (profile.occupation === null) {
        unknown('Employment Status', 'ఉద్యోగ స్థితి', 'occupation');
      } else if (profile.occupation === 'unemployed') {
        pass(
          'Unemployed Youth',
          'నిరుద్యోగ యువత',
          'Currently unemployed status matches Nirudyoga Bruthi.',
          'ప్రస్తుతం నిరుద్యోగిగా ఉండటం నియమానికి సరిపోయింది.',
          'occupation',
        );
      } else {
        fail(
          'Unemployed Youth',
          'నిరుద్యోగ యువత',
          `Current occupation (${profile.occupation.replace(/_/g, ' ')}) is not unemployed.`,
          'ప్రస్తుతం పని చేస్తున్నందున నిరుద్యోగ భృతి వర్తించదు.',
          'occupation',
        );
        if (profile.occupation === 'student') {
          nearestAltId = 'AP_THALLIKI_VANDANAM';
          nearestAltEn = 'Active students can check Thalliki Vandanam or Vidya Deevena.';
          nearestAltTe = 'ప్రస్తుతం చదువుతున్నవారు తల్లికి వందనం లేదా విద్యా దీవెన చూడండి.';
        }
      }

      if (profile.age === null) {
        unknown('Age (20–35)', 'వయస్సు (20–35)', 'age');
      } else if (profile.age >= 20 && profile.age <= 35) {
        pass(
          'Age (20–35)',
          'వయస్సు (20–35)',
          `Age ${profile.age} is within 20–35 years.`,
          `వయస్సు ${profile.age} ఏళ్లు — 20–35 ఏళ్ల పరిమితిలో ఉంది.`,
          'age',
        );
      } else {
        fail(
          'Age (20–35)',
          'వయస్సు (20–35)',
          `Age ${profile.age} is outside the 20–35 range.`,
          `వయస్సు ${profile.age} ఏళ్లు — 20–35 ఏళ్ల పరిమితికి బయట ఉంది.`,
          'age',
        );
      }

      if (profile.education_level === null) {
        unknown('Degree / PG / Diploma', 'డిగ్రీ / పీజీ / డిప్లొమా', 'education_level');
      } else if (
        profile.education_level === 'diploma_iti' ||
        profile.education_level === 'graduate' ||
        profile.education_level === 'postgraduate'
      ) {
        pass(
          'Education (Degree / PG / Diploma)',
          'విద్యార్హత (డిగ్రీ/పీజీ/డిప్లొమా)',
          'Completed Degree/PG/Diploma satisfies Nirudyoga Bruthi education rule.',
          'డిగ్రీ / పీజీ / డిప్లొమా విద్యార్హత సరిపోయింది.',
          'education_level',
        );
      } else {
        fail(
          'Education (Degree / PG / Diploma)',
          'విద్యార్హత (డిగ్రీ/పీజీ/డిప్లొమా)',
          'Nirudyoga Bruthi requires a Degree, PG, or Diploma qualification.',
          'నిరుద్యోగ భృతికి డిగ్రీ, పీజీ లేదా డిప్లొమా ఉండాలి.',
          'education_level',
        );
      }

      if (profile.has_active_pf_or_esi === true) {
        fail(
          'No Active PF / ESI',
          'యాక్టివ్ PF / ESI ఉండకూడదు',
          'Applicants with active PF or ESI accounts are excluded.',
          'యాక్టివ్ PF లేదా ESI ఉన్నవారు ఈ పథకానికి అనర్హులు.',
          'has_active_pf_or_esi',
        );
      }
      break;
    }

    case 'AP_DIGI_LAKSHMI': {
      if (profile.gender === null) {
        unknown('Women Applicant', 'మహిళా దరఖాస్తుదారు', 'gender');
      } else if (profile.gender === 'female') {
        pass(
          'Women Applicant',
          'మహిళా దరఖాస్తుదారు',
          'Female applicant matches Digi-Lakshmi eligibility.',
          'మహిళా దరఖాస్తుదారు నియమానికి సరిపోయింది.',
          'gender',
        );
      } else {
        fail(
          'Women Applicant',
          'మహిళా దరఖాస్తుదారు',
          'Digi-Lakshmi is exclusively for urban women SHG entrepreneurs.',
          'డిజి-లక్ష్మి పట్టణ మహిళా SHG సభ్యురాళ్లకు మాత్రమే.',
          'gender',
        );
      }

      if (profile.age === null) {
        unknown('Age (21–40)', 'వయస్సు (21–40)', 'age');
      } else if (profile.age >= 21 && profile.age <= 40) {
        pass(
          'Age (21–40)',
          'వయస్సు (21–40)',
          `Age ${profile.age} is within the 21–40 window.`,
          `వయస్సు ${profile.age} ఏళ్లు — 21–40 ఏళ్ల పరిమితిలో ఉంది.`,
          'age',
        );
      } else {
        fail(
          'Age (21–40)',
          'వయస్సు (21–40)',
          `Age ${profile.age} is outside the 21–40 Digi-Lakshmi age rule.`,
          `వయస్సు ${profile.age} ఏళ్లు — 21–40 ఏళ్ల పరిమితికి బయట ఉంది.`,
          'age',
        );
        if (profile.gender === 'female') {
          nearestAltId = 'AP_AADABIDDA_NIDHI';
          nearestAltEn = 'Check Aadabidda Nidhi (18–59) or Stree Shakti.';
          nearestAltTe = 'ఆడబిడ్డ నిధి లేదా స్త్రీ శక్తి పథకాలను చూడండి.';
        }
      }

      if (profile.education_level === null) {
        unknown('Graduate Qualification', 'డిగ్రీ విద్యార్హత', 'education_level');
      } else if (
        profile.education_level === 'graduate' ||
        profile.education_level === 'postgraduate'
      ) {
        pass(
          'Graduate Qualification',
          'డిగ్రీ విద్యార్హత',
          'Graduate qualification meets Digi-Lakshmi requirement.',
          'డిగ్రీ విద్యార్హత సరిపోయింది.',
          'education_level',
        );
      } else {
        fail(
          'Graduate Qualification',
          'డిగ్రీ విద్యార్హత',
          'Digi-Lakshmi requires a graduate degree.',
          'డిజి-లక్ష్మికి డిగ్రీ పట్టా అవసరం.',
          'education_level',
        );
      }

      if (profile.is_shg_member === null) {
        unknown('SHG Membership (≥3 years)', 'SHG సభ్యత్వం (≥3 ఏళ్లు)', 'is_shg_member');
      } else if (profile.is_shg_member === false) {
        fail(
          'SHG Membership (≥3 years)',
          'SHG సభ్యత్వం (≥3 ఏళ్లు)',
          'Requires active women’s SHG membership (≥3 years).',
          'కనీసం 3 ఏళ్ల మహిళా SHG సభ్యత్వం అవసరం.',
          'is_shg_member',
        );
      } else if (profile.shg_membership_years !== null && profile.shg_membership_years < 3) {
        fail(
          'SHG Membership ≥3 Years',
          'కనీసం 3 ఏళ్ల SHG సభ్యత్వం',
          `${profile.shg_membership_years} years of SHG membership is below the 3-year minimum.`,
          `${profile.shg_membership_years} ఏళ్ల SHG సభ్యత్వం కనీసం 3 ఏళ్ల కంటే తక్కువ.`,
          'shg_membership_years',
        );
      } else {
        pass(
          'SHG Membership (≥3 years)',
          'SHG సభ్యత్వం',
          'SHG membership confirmed (3+ years required; pilot rollout across 9,034 ULB CSCs).',
          'SHG సభ్యత్వం ఉంది (పట్టణ ప్రాంత పైలట్ పథకం).',
          'is_shg_member',
        );
      }
      break;
    }

    case 'AP_UNORGANISED_WELFARE': {
      const workerOccupations = [
        'daily_wage',
        'construction_worker',
        'weaver',
        'toddy_tapper',
        'fisherman',
      ];
      if (
        profile.occupation !== null &&
        !workerOccupations.includes(profile.occupation) &&
        profile.is_registered_unorganised_worker !== true
      ) {
        fail(
          'Unorganised / Construction Sector',
          'అసంఘటిత / నిర్మాణ రంగం',
          'Applies to daily-wage, construction, weaving, fishing, or other unorganised workers.',
          'రోజువారీ కూలీలు, నిర్మాణ, చేనేత, మత్స్యకార మరియు అసంఘటిత కార్మికులకు మాత్రమే.',
          'occupation',
        );
      } else if (profile.occupation === null && profile.is_registered_unorganised_worker === null) {
        unknown('Worker Sector / Occupation', 'కార్మిక వృత్తి వివరాలు', 'occupation');
      } else {
        pass(
          'Unorganised / Construction Sector',
          'అసంఘటిత / నిర్మాణ రంగం',
          'Unorganised or construction worker sector matches scheme scope.',
          'అసంఘటిత / నిర్మాణ రంగ కార్మిక వర్గానికి సరిపోయింది.',
          'occupation',
        );
      }

      if (profile.is_registered_unorganised_worker === null) {
        unknown(
          'Labour / e-Shram Registration',
          'లేబర్ / ఈ-శ్రమ్ నమోదు',
          'is_registered_unorganised_worker',
        );
      } else if (profile.is_registered_unorganised_worker) {
        pass(
          'Labour / e-Shram Registration',
          'లేబర్ / ఈ-శ్రమ్ నమోదు',
          'Registered unorganised / construction worker status confirmed.',
          'లేబర్ / ఈ-శ్రమ్ నమోదు ఉంది.',
          'is_registered_unorganised_worker',
        );
      } else {
        fail(
          'Labour / e-Shram Registration',
          'లేబర్ / ఈ-శ్రమ్ నమోదు',
          'Requires active Labour registration or e-Shram card — you can register free at Sachivalayam/ILAC.',
          'లేబర్ కార్డు లేదా ఈ-శ్రమ్ నమోదు తప్పనిసరి — సచివాలయం/లేబర్ ఆఫీసులో ఉచితంగా నమోదు చేసుకోవచ్చు.',
          'is_registered_unorganised_worker',
        );
        nearestAltId = 'AP_DEEPAM_2';
        nearestAltEn = 'Register for e-Shram at Sachivalayam, and check Deepam 2.0 meanwhile.';
        nearestAltTe = 'సచివాలయంలో ఈ-శ్రమ్ నమోదు చేసుకోండి; అలాగే దీపం 2.0 చూడండి.';
      }
      break;
    }

    case 'AP_MICRO_IRRIGATION': {
      if (profile.occupation === null) {
        unknown('Farmer Occupation', 'రైతు వృత్తి', 'occupation');
      } else if (profile.occupation === 'farmer') {
        pass(
          'Farmer Occupation',
          'రైతు వృత్తి',
          'Occupation is farmer.',
          'వృత్తి రైతుగా నిర్ధారించబడింది.',
          'occupation',
        );
      } else {
        fail(
          'Farmer Occupation',
          'రైతు వృత్తి',
          'Micro Irrigation Subsidy applies to farmers with land or registered lease.',
          'సూక్ష్మ నీటిపారుదల సబ్సిడీ భూమి లేదా రిజిస్టర్డ్ లీజు ఉన్న రైతులకు మాత్రమే.',
          'occupation',
        );
      }

      const wet = profile.land_acres_wet ?? 0;
      const dry = profile.land_acres_dry ?? 0;
      const hasLandInfo =
        profile.land_acres_wet !== null ||
        profile.land_acres_dry !== null ||
        profile.is_tenant_ccrc_farmer !== null;

      if (!hasLandInfo) {
        unknown('Land Area (Small / Marginal ≤5 acres)', 'భూమి విస్తీర్ణం', 'land_acres_wet');
      } else if ((wet + dry > 0 && wet <= 2.5 && wet + dry <= 5) || profile.is_tenant_ccrc_farmer) {
        pass(
          'Small & Marginal Farmer Holding',
          'చిన్న & సన్నకారు రైతు భూమి',
          `Holding fits small/marginal farmer category (55% subsidy up to ₹22,000/ha).`,
          `చిన్న & సన్నకారు రైతు పరిమితిలో ఉంది (55% సబ్సిడీ, హెక్టారుకు ₹22,000 వరకు).`,
          'land_acres_wet',
        );
      } else if (wet + dry > 5) {
        fail(
          'Small & Marginal Limit (≤5 acres)',
          'చిన్న & సన్నకారు పరిమితి',
          `Total land (${wet + dry} acres) exceeds 5 acres — general category gets 45% subsidy (cap ₹18,000/ha) at Raitha Samparka Kendra.`,
          `మొత్తం భూమి (${wet + dry} ఎకరాలు) 5 ఎకరాల కంటే ఎక్కువ — ఇతర రైతులకు 45% సబ్సిడీ వర్తించవచ్చు.`,
          'land_acres_wet',
        );
        nearestAltId = 'AP_ANNADATA_SUKHIBHAVA';
        nearestAltEn = 'Check Annadata Sukhibhava (₹20,000/year per farmer family).';
        nearestAltTe = 'రైతు కుటుంబాల కోసం అన్నదాత సుఖీభవ (ఏడాదికి ₹20,000) చూడండి.';
      } else {
        fail(
          'Land Ownership / Registered Lease',
          'భూమి / రిజిస్టర్డ్ లీజు',
          'Requires land ownership (Adangal/1-B) or a registered lease.',
          'భూమి యాజమాన్య పత్రం (అడంగల్/1-B) లేదా రిజిస్టర్డ్ కౌలు ఒప్పందం అవసరం.',
          'land_acres_wet',
        );
      }
      break;
    }
  }

  // Compute deterministic Verdict
  const hasFail = rules.some((r) => r.outcome === 'fail');
  const hasUnknown = rules.some((r) => r.outcome === 'unknown');
  const explicitlyPending = scheme.verification_status
    .toLowerCase()
    .includes('verification pending');

  let verdict: EligibilityVerdict;
  if (hasFail) {
    verdict = 'DOES_NOT_MATCH';
  } else if (hasUnknown) {
    verdict = 'NEEDS_INFORMATION';
  } else if (explicitlyPending) {
    verdict = 'UNVERIFIED';
    rules.push({
      labelEn: 'Portal Verification Status',
      labelTe: 'పోర్టల్ ధృవీకరణ స్థితి',
      outcome: 'unverified',
      explanationEn: `${scheme.verification_status}. ${scheme.notes}`,
      explanationTe: `${scheme.verification_status}. దయచేసి Jnanabhumi పోర్టల్ లేదా సచివాలయంలో ప్రస్తుత నియమాలను నిర్ధారించుకోండి.`,
    });
  } else {
    verdict = 'MATCH';
  }

  const passingRulesEn = rules
    .filter((r) => r.outcome === 'pass')
    .map((r) => r.explanationEn)
    .join(' ');
  const passingRulesTe = rules
    .filter((r) => r.outcome === 'pass')
    .map((r) => r.explanationTe)
    .join(' ');

  return {
    scheme,
    verdict,
    isStaleOver90Days,
    daysSinceVerified,
    matchedRuleSummaryEn: passingRulesEn,
    matchedRuleSummaryTe: passingRulesTe,
    rules,
    missingField: firstMissing,
    doesNotMatchReasonEn: hardFailReasonEn,
    doesNotMatchReasonTe: hardFailReasonTe,
    nearestAlternativeId: nearestAltId,
    nearestAlternativeReasonEn: nearestAltEn,
    nearestAlternativeReasonTe: nearestAltTe,
    documents,
  };
}

const VERDICT_ORDER: Record<EligibilityVerdict, number> = {
  MATCH: 0,
  UNVERIFIED: 1,
  NEEDS_INFORMATION: 2,
  DOES_NOT_MATCH: 3,
};

export function checkAllSchemes(
  profile: WelfareProfile,
  referenceDate: Date = new Date(),
): EligibilityCheckResult[] {
  return ANDHRA_SCHEMES.map((s) =>
    check_eligibility(s.scheme_id, profile, referenceDate),
  ).sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict]);
}

/**
 * Picks the single highest-priority missing field across relevant schemes
 * so Step 1 follow-ups ask ONE question at a time and always explain WHY.
 */
export function getNextFollowUpPrompt(profile: WelfareProfile): MissingFieldReason | null {
  if (profile.occupation === null) {
    return {
      field: 'occupation',
      whyEn: 'To find schemes for workers, farmers, students, or youth, I need to know what work your family does.',
      whyTe: 'రైతులు, కార్మికులు, విద్యార్థులు లేదా యువత పథకాలను తనిఖీ చేయడానికి మీరు ఏ పని చేస్తారో తెలుసుకోవాలి.',
      questionEn:
        'To match work-based schemes, what work do you or your family members do (farmer, daily wage, student, homemaker, small business)?',
      questionTe:
        'వృత్తి ఆధారిత పథకాలను చూపించడానికి — మీరు లేదా మీ కుటుంబ సభ్యులు ఏ పని చేస్తారు (రైతు, రోజువారీ కూలీ, విద్యార్థి, గృహిణి, చిన్న వ్యాపారం)?',
    };
  }
  if (profile.age === null) {
    return {
      field: 'age',
      whyEn: 'To check pension (65+) and women or youth schemes (18–59 / 20–35), I need your age.',
      whyTe: 'వృద్ధాప్య పెన్షన్ (65+), ఆడబిడ్డ నిధి (18–59) మరియు యువత పథకాలను తనిఖీ చేయడానికి నాకు వయస్సు అవసరం.',
      questionEn: 'To check pension and age-based schemes, what is your age (or the eldest member’s age)?',
      questionTe: 'పెన్షన్ మరియు వయస్సు ఆధారిత పథకాలను తనిఖీ చేయడానికి నాకు మీ వయస్సు అవసరం — మీరు చెప్పగలరా?',
    };
  }
  if (profile.has_white_ration_card === null) {
    return {
      field: 'has_white_ration_card',
      whyEn: 'To check pensions, Deepam 2.0, and education support, I need to know if you have a White Ration Card.',
      whyTe: 'పెన్షన్లు, దీపం 2.0, మరియు విద్యా పథకాలను తనిఖీ చేయడానికి మీకు తెల్ల రేషన్ కార్డు ఉందో లేదో తెలుసుకోవాలి.',
      questionEn: 'To check BPL benefits like pensions and Deepam 2.0, do you have a White Ration Card? (Never share the card number.)',
      questionTe: 'పెన్షన్లు, దీపం 2.0 వంటి పథకాలను తనిఖీ చేయడానికి — మీకు తెల్ల రేషన్ కార్డు ఉందా? (కార్డు నంబర్ చెప్పవద్దు.)',
    };
  }
  if (profile.gender === null) {
    return {
      field: 'gender',
      whyEn: 'To check women’s schemes like Aadabidda Nidhi (₹1,500/month) and Stree Shakti free bus travel, I need gender details.',
      whyTe: 'ఆడబిడ్డ నిధి, స్త్రీ శక్తి వంటి మహిళా పథకాలను తనిఖీ చేయడానికి దరఖాస్తుదారు మహిళా కాదా అని తెలుసుకోవాలి.',
      questionEn: 'To check women-focused schemes like Aadabidda Nidhi and Stree Shakti, is the main applicant a woman?',
      questionTe: 'ఆడబిడ్డ నిధి, స్త్రీ శక్తి వంటి మహిళా పథకాలను తనిఖీ చేయడానికి — దరఖాస్తుదారు మహిళనా?',
    };
  }

  // Return first NEEDS_INFORMATION missing field from any partially matching scheme
  const results = checkAllSchemes(profile);
  const needsInfo = results.find((r) => r.verdict === 'NEEDS_INFORMATION' && r.missingField);
  return needsInfo?.missingField ?? null;
}
