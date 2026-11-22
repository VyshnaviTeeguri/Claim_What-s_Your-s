import { EligibilityVerdict, LanguageCode } from '../types/scheme';

export const VERDICT_LABELS: Record<
  LanguageCode,
  Record<EligibilityVerdict, string>
> = {
  te: {
    MATCH: 'అర్హత ఉండే అవకాశం ఉంది',
    NEEDS_INFORMATION: 'మరో వివరం కావాలి',
    DOES_NOT_MATCH: 'సరిపోలేదు',
    UNVERIFIED: 'ధృవీకరణ పెండింగ్‌లో ఉంది',
  },
  en: {
    MATCH: 'Likely eligible',
    NEEDS_INFORMATION: 'Need one more detail',
    DOES_NOT_MATCH: 'Not eligible',
    UNVERIFIED: 'Verification pending',
  },
};

export const UI_COPY: Record<
  LanguageCode,
  {
    brandTitle: string;
    navAssistant: string;
    navSchemes: string;
    navReminders: string;
    navPrivacy: string;
    heroGreeting: string;
    heroSubtitle: string;
    whoForPrompt: string;
    notSureBtn: string;
    speakButtonLabel: string;
    listeningLabel: string;
    typeInsteadLabel: string;
    sessionPrivacyBanner: string;
    noIdNotice: string;
    whyWeAskLabel: string;
    inputPlaceholder: string;
    sendButton: string;
    viewSchemesCta: string;
    sessionProfileTitle: string;
    resetSessionBtn: string;
    closingLikelyDisclaimer: string;
    alreadyHaveLabel: string;
    needToGetLabel: string;
    nextStepLabel: string;
    matchedOnLabel: string;
    lastVerifiedLabel: string;
    resultsHeading: string;
    resultsSubheading: string;
    remindersHeading: string;
    remindersSubheading: string;
    privacyHeading: string;
  }
> = {
  te: {
    brandTitle: "Claim What's Yours",
    navAssistant: 'హోమ్',
    navSchemes: 'పథకాలు',
    navReminders: 'రిమైండర్లు',
    navPrivacy: 'గోప్యత',
    heroGreeting: 'నమస్కారం! మీ కుటుంబానికి ఏ సహాయం కావాలో తెలుసుకోండి.',
    heroSubtitle: 'కింది వాటిలో ఒక కార్డును ట్యాప్ చేసి ప్రారంభించండి.',
    whoForPrompt: 'మీరు మొదట ఎవరి కోసం సహాయం చూస్తున్నారు?',
    notSureBtn: 'తెలియదా? కలిసి తెలుసుకుందాం',
    speakButtonLabel: 'మాట్లాడి చెప్పండి',
    listeningLabel: 'వింటున్నాము…',
    typeInsteadLabel: 'బదులుగా టైప్ చేయండి',
    sessionPrivacyBanner:
      'మీ వివరాలు ఎక్కడా సేవ్ చేయబడవు. ఆధార్ లేదా బ్యాంకు నంబర్లు అడగము.',
    noIdNotice: 'ఆధార్ లేదా బ్యాంకు ఖాతా నంబర్లు ఎప్పుడూ ఇవ్వవద్దు.',
    whyWeAskLabel: 'ఎందుకు అడుగుతున్నాము?',
    inputPlaceholder: 'ఇతర వివరాలు ఇక్కడ రాయండి...',
    sendButton: 'పథకాలు చూడండి',
    viewSchemesCta: 'పథకాల ఫలితాలు చూడండి',
    sessionProfileTitle: 'సెషన్ వివరాలు',
    resetSessionBtn: 'మళ్ళీ ప్రారంభించండి',
    closingLikelyDisclaimer: 'ఇది అర్హత ఉండే అవకాశం మాత్రమే — హామీ కాదు.',
    alreadyHaveLabel: 'మీ వద్ద ఇప్పటికే ఉన్నవి',
    needToGetLabel: 'మీరు సిద్ధం చేసుకోవాల్సినవి',
    nextStepLabel: 'దరఖాస్తు విధానం',
    matchedOnLabel: 'సరిపోయిన నియమం',
    lastVerifiedLabel: 'ధృవీకరించిన తేదీ',
    resultsHeading: 'మీకు సరిపోయే ఆంధ్రప్రదేశ్ పథకాలు',
    resultsSubheading:
      'నిర్ణయాలన్నీ పథక నియమాల ప్రకారం లెక్కించబడ్డాయి — హామీ కాదు.',
    remindersHeading: 'ఫోన్ నంబర్ రిమైండర్లు',
    remindersSubheading:
      'దరఖాస్తు గడువులు మరియు 30 రోజుల ఫాలో-అప్ కోసం మొబైల్ రిమైండర్ సెట్ చేయండి (ఆధార్ వద్దు).',
    privacyHeading: 'గోప్యత & సురక్షిత నియమాలు',
  },
  en: {
    brandTitle: "Claim What's Yours",
    navAssistant: 'Home',
    navSchemes: 'Schemes',
    navReminders: 'Reminders',
    navPrivacy: 'Privacy',
    heroGreeting: "Greetings! Let's find out what help your family can get.",
    heroSubtitle: 'Tap one card below to begin.',
    whoForPrompt: 'Who are you looking help for first?',
    notSureBtn: "Not sure? Let's find out together",
    speakButtonLabel: 'Tap to speak',
    listeningLabel: 'Listening…',
    typeInsteadLabel: 'Type instead',
    sessionPrivacyBanner:
      'Session-only: nothing is stored. We never ask for Aadhaar or bank numbers.',
    noIdNotice: 'Never enter Aadhaar or bank account numbers.',
    whyWeAskLabel: 'Why we ask',
    inputPlaceholder: 'Type any extra details here...',
    sendButton: 'Check Schemes',
    viewSchemesCta: 'View Scheme Results',
    sessionProfileTitle: 'Session Details',
    resetSessionBtn: 'Start over',
    closingLikelyDisclaimer: 'Likely eligible — not a guarantee.',
    alreadyHaveLabel: 'You already have',
    needToGetLabel: 'You need to get',
    nextStepLabel: 'How to apply',
    matchedOnLabel: 'Matched on',
    lastVerifiedLabel: 'Verified',
    resultsHeading: 'Andhra Pradesh Scheme Results',
    resultsSubheading:
      'Every result is decided by clear rules — never by AI. Likely eligible is not a guarantee.',
    remindersHeading: 'Phone-Number Reminders',
    remindersSubheading:
      'Set a mobile reminder for application deadlines, Super Six re-verification dates, and 30-day follow-ups (never Aadhaar).',
    privacyHeading: 'Privacy & Trust Rules',
  },
};
