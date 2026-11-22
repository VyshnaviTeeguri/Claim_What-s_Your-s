import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Delete,
  GraduationCap,
  HardHat,
  HeartHandshake,
  HelpCircle,
  Home,
  Info,
  Mic,
  MicOff,
  Pencil,
  RotateCcw,
  ShieldAlert,
  User,
  Users,
  Wheat,
} from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { EMPTY_PROFILE } from '../engine/eligibilityEngine';
import { UI_COPY } from '../i18n/strings';
import {
  LanguageCode,
  MonthlyIncomeBand,
  OccupationType,
  WelfareProfile,
} from '../types/scheme';

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function containsAadhaarLikeNumber(text: string): boolean {
  return /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text);
}

type EntryGroupId = 'senior' | 'farmer' | 'student' | 'woman' | 'worker' | 'unsure';

function WhyWeAskTooltip({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        className="min-h-[48px] px-3 py-1.5 rounded-full bg-[#F4F0EA] hover:bg-[#E6F2EF] text-[#0F6B5C] text-[15px] font-semibold inline-flex items-center gap-1.5 transition-colors"
      >
        <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </button>
      {open && (
        <div
          role="tooltip"
          className="mt-2 p-3.5 rounded-xl bg-[#F4F0EA] border border-[#E5DDD3] text-[15px] text-[#1F2A28] italic text-left"
        >
          {text}
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const lang: LanguageCode = state.language;
  const copy = UI_COPY[lang];

  // Wizard step: 0 = Entry Cards Screen, 1..4 = Guided Wizard Steps
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [selectedGroup, setSelectedGroup] = useState<EntryGroupId | null>(null);

  // Local draft fields synced to session profile
  const [ageDigits, setAgeDigits] = useState<string>(
    state.profile.age !== null ? String(state.profile.age) : '',
  );
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [step4Notes, setStep4Notes] = useState('');
  const [selectedExtraChips, setSelectedExtraChips] = useState<string[]>([]);
  const [showTypeBox, setShowTypeBox] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState<'age' | 'step4' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idWarning, setIdWarning] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const step4InputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const updateProfile = (partial: Partial<WelfareProfile>) => {
    dispatch({ type: 'UPDATE_PROFILE', partial });
  };

  // Entry Cards (Screen 0)
  const entryCards: Array<{
    id: Exclude<EntryGroupId, 'unsure'>;
    emoji: string;
    Icon: typeof User;
    titleTe: string;
    titleEn: string;
    seed: Partial<WelfareProfile>;
  }> = [
    {
      id: 'senior',
      emoji: '👵',
      Icon: HeartHandshake,
      titleTe: 'వృద్ధులు / పెన్షన్',
      titleEn: 'Senior Citizen / Pension',
      seed: { occupation: 'homemaker' },
    },
    {
      id: 'farmer',
      emoji: '🌾',
      Icon: Wheat,
      titleTe: 'రైతు / వ్యవసాయం',
      titleEn: 'Farmer / Agriculture',
      seed: { occupation: 'farmer' },
    },
    {
      id: 'student',
      emoji: '🎓',
      Icon: GraduationCap,
      titleTe: 'విద్యార్థి / చదువు',
      titleEn: 'Student / Education',
      seed: { occupation: 'student', education_level: 'school_1_to_12' },
    },
    {
      id: 'woman',
      emoji: '👩',
      Icon: Users,
      titleTe: 'మహిళ / కుటుంబ సహాయం',
      titleEn: 'Woman / Family Support',
      seed: { gender: 'female', is_woman_head_of_household: true },
    },
    {
      id: 'worker',
      emoji: '👷',
      Icon: HardHat,
      titleTe: 'రోజువారీ కూలీ',
      titleEn: 'Daily-Wage Worker',
      seed: { occupation: 'daily_wage' },
    },
  ];

  const handleSelectEntry = (id: EntryGroupId, seed: Partial<WelfareProfile>) => {
    setSelectedGroup(id);
    const fresh: WelfareProfile = { ...EMPTY_PROFILE, ...seed };
    dispatch({ type: 'SET_PROFILE', profile: fresh });
    setAgeDigits('');
    setStep4Notes('');
    setSelectedExtraChips([]);
    setErrorMsg(null);
    setIdWarning(false);
    setWizardStep(1);
  };

  // Voice Recognition helper for Step 1 (small age mic) or Step 4 (big orange mic)
  const startOrStopMic = (target: 'age' | 'step4') => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setListeningTarget(null);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      if (target === 'step4') {
        setShowTypeBox(true);
        step4InputRef.current?.focus();
      } else {
        setShowNumberPad(true);
      }
      setErrorMsg(
        lang === 'te'
          ? 'ఈ బ్రౌజర్‌లో మైక్ లేదు — దయచేసి బటన్లు లేదా టైపింగ్ ఉపయోగించండి.'
          : 'Microphone unavailable in this browser — please tap buttons or type.',
      );
      return;
    }

    const recognition = new Ctor();
    recognition.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (!transcript) return;
      if (target === 'age') {
        const digits = transcript.match(/\b(\d{1,2})\b/);
        if (digits) {
          const num = Number(digits[1]);
          if (num >= 1 && num <= 99) {
            setAgeDigits(String(num));
            updateProfile({ age: num });
          }
        }
      } else {
        setShowTypeBox(true);
        setStep4Notes((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setListeningTarget(null);
      setErrorMsg(
        lang === 'te'
          ? 'వాయిస్ వినలేకపోయింది — దయచేసి టైప్ చేయండి.'
          : 'Could not capture audio — please type instead.',
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningTarget(null);
    };

    recognitionRef.current = recognition;
    setErrorMsg(null);
    setListeningTarget(target);
    setIsListening(true);
    recognition.start();
  };

  // Step 1: Age helpers
  const ageGroups = [
    { id: '18-25', label: '18–25', representativeAge: 22 },
    { id: '26-45', label: '26–45', representativeAge: 35 },
    { id: '46-60', label: '46–60', representativeAge: 52 },
    { id: '60+', label: '60+', representativeAge: 66 },
  ];

  const handleAgeGroupTap = (ageValue: number) => {
    setAgeDigits(String(ageValue));
    updateProfile({ age: ageValue });
  };

  const handlePadDigit = (d: string) => {
    const next = (ageDigits + d).slice(0, 2);
    setAgeDigits(next);
    const num = Number(next);
    updateProfile({ age: next && num > 0 ? num : null });
  };

  const handlePadBackspace = () => {
    const next = ageDigits.slice(0, -1);
    setAgeDigits(next);
    const num = Number(next);
    updateProfile({ age: next && num > 0 ? num : null });
  };

  // Step 2: Family & Work options
  const workOptions: Array<{
    id: string;
    occupation: OccupationType;
    Icon: typeof Wheat;
    labelTe: string;
    labelEn: string;
  }> = [
    {
      id: 'farmer',
      occupation: 'farmer',
      Icon: Wheat,
      labelTe: 'రైతు',
      labelEn: 'Farmer',
    },
    {
      id: 'daily_wage',
      occupation: 'daily_wage',
      Icon: HardHat,
      labelTe: 'రోజువారీ కూలీ',
      labelEn: 'Coolie / Daily Wage',
    },
    {
      id: 'small_business',
      occupation: 'small_business',
      Icon: Briefcase,
      labelTe: 'చిన్న దుకాణం',
      labelEn: 'Small Shop',
    },
    {
      id: 'homemaker',
      occupation: 'homemaker',
      Icon: Home,
      labelTe: 'ఇంట్లో / ఏదీ లేదు',
      labelEn: 'None / Home',
    },
  ];

  // Step 4: Example Chips
  const step4Chips: Array<{
    id: string;
    labelTe: string;
    labelEn: string;
    patch: Partial<WelfareProfile>;
  }> = [
    {
      id: 'widow',
      labelTe: 'నేను వితంతువును',
      labelEn: 'I am a widow',
      patch: { marital_status: 'widow', gender: 'female' },
    },
    {
      id: 'college_daughter',
      labelTe: 'మా అమ్మాయి కాలేజీలో చదువుతోంది',
      labelEn: 'My daughter is in college',
      patch: { education_level: 'graduate' },
    },
    {
      id: 'disability_cert',
      labelTe: 'నాకు దివ్యాంగుల సర్టిఫికెట్ ఉంది',
      labelEn: 'I have a disability certificate',
      patch: { has_sadarem_certificate: true, sadarem_disability_percent: 40 },
    },
  ];

  const toggleStep4Chip = (chip: (typeof step4Chips)[number]) => {
    const isAlready = selectedExtraChips.includes(chip.id);
    if (isAlready) {
      setSelectedExtraChips((prev) => prev.filter((c) => c !== chip.id));
    } else {
      setSelectedExtraChips((prev) => [...prev, chip.id]);
      updateProfile(chip.patch);
    }
  };

  // Step 4 Finalize: Merge tapped inputs + chips + spoken/typed text -> AI extraction -> Results
  const handleFinishWizard = async () => {
    const chipSentences = step4Chips
      .filter((c) => selectedExtraChips.includes(c.id))
      .map((c) => (lang === 'te' ? c.labelTe : c.labelEn));

    const combinedStep4Text = [...chipSentences, step4Notes.trim()]
      .filter(Boolean)
      .join('. ');

    if (containsAadhaarLikeNumber(combinedStep4Text)) {
      setIdWarning(true);
      return;
    }

    setErrorMsg(null);
    setIdWarning(false);

    // If user didn't enter free-text beyond the tapped buttons/chips, evaluate immediately
    if (!step4Notes.trim()) {
      navigate('/results');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: combinedStep4Text,
          currentProfile: state.profile,
          conversationHistory: [],
          nextFollowUpPrompt: null,
          preferredLanguage: lang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.extractedProfile) {
        const extracted = data.extractedProfile as Partial<WelfareProfile>;
        const mergedUpdates: Partial<WelfareProfile> = {};
        (Object.keys(extracted) as Array<keyof WelfareProfile>).forEach((key) => {
          const val = extracted[key];
          if (val !== null && val !== undefined && val !== '') {
            (mergedUpdates as Record<string, unknown>)[key] = val;
          }
        });
        if (Object.keys(mergedUpdates).length > 0) {
          dispatch({ type: 'UPDATE_PROFILE', partial: mergedUpdates });
        }
      }
      navigate('/results');
    } catch {
      // Even if offline/API fails, all tapped inputs & chips are already in state.profile — proceed cleanly
      navigate('/results');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* SCREEN 0: GUIDED VISUAL ENTRY CARDS (NO blank mic button!) */}
      {wizardStep === 0 && (
        <div className="space-y-6">
          <section className="text-center space-y-2.5 pt-2">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1F2A28] leading-snug">
              {copy.heroGreeting}
            </h1>
            <p className="text-[17px] font-semibold text-[#0F6B5C]">
              {copy.whoForPrompt}
            </p>
          </section>

          {/* 5 Visual Tappable Cards */}
          <section
            aria-label="Choose who you are looking help for"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
          >
            {entryCards.map((card) => {
              const Icon = card.Icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelectEntry(card.id, card.seed)}
                  className="cwy-card min-h-[84px] p-5 flex items-center gap-4 text-left hover:border-[#0F6B5C] hover:bg-[#E6F2EF]/40 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF2E2] text-[#E8871E] flex items-center justify-center shrink-0 text-[28px]">
                    <span role="img" aria-hidden="true">
                      {card.emoji}
                    </span>
                    <Icon className="sr-only" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[18px] font-bold text-[#1F2A28] leading-snug">
                      {lang === 'te' ? card.titleTe : card.titleEn}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#0F6B5C] shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </section>

          {/* Small "Not sure? Let's find out together" button */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => handleSelectEntry('unsure', {})}
              className="cwy-btn-secondary w-full sm:w-auto px-6 inline-flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              <span>{copy.notSureBtn}</span>
            </button>
          </div>

          <p className="text-center text-[15px] text-[#42524F]">
            {copy.sessionPrivacyBanner}
          </p>
        </div>
      )}

      {/* GUIDED 4-STEP WIZARD */}
      {wizardStep >= 1 && (
        <div className="space-y-5">
          {/* Top Wizard Progress Bar (Step X of 4) */}
          <div className="cwy-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setWizardStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 0))
                }
                className="min-h-[48px] px-3 rounded-xl text-[15px] font-semibold text-[#0F6B5C] hover:bg-[#E6F2EF] inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'te' ? 'వెనుకకు' : 'Back'}</span>
              </button>

              <span className="text-[16px] font-bold text-[#1F2A28] tabular-nums">
                {lang === 'te' ? `దశ ${wizardStep} / 4` : `Step ${wizardStep} of 4`}
              </span>

              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'RESET_SESSION' });
                  setWizardStep(0);
                  setSelectedGroup(null);
                }}
                className="min-h-[48px] px-3 rounded-xl text-[15px] font-semibold text-[#64748B] hover:text-[#1F2A28] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'te' ? 'మళ్ళీ' : 'Reset'}</span>
              </button>
            </div>

            <div className="w-full h-2.5 bg-[#EFE9E0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0F6B5C] transition-all duration-300"
                style={{ width: `${(wizardStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: BASIC DETAILS — Age */}
          {wizardStep === 1 && (
            <section className="cwy-card p-5 sm:p-7 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-[22px] sm:text-[24px] font-bold text-[#1F2A28]">
                    {lang === 'te' ? 'మీ వయస్సు ఎంత?' : 'How old are you?'}
                  </h2>
                  <WhyWeAskTooltip
                    label={copy.whyWeAskLabel}
                    text={
                      lang === 'te'
                        ? 'పెన్షన్లు (65+), మహిళా పథకాలు (18–59), యువత పథకాలను తనిఖీ చేయడానికి వయస్సు అవసరం.'
                        : 'Age checks pensions (65+), women’s support (18–59), and youth schemes (20–35).'
                    }
                  />
                </div>

                {/* Small mic icon if they want to speak the number */}
                <button
                  type="button"
                  onClick={() => startOrStopMic('age')}
                  aria-label={lang === 'te' ? 'వయస్సు చెప్పండి' : 'Speak age'}
                  className={`min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isListening && listeningTarget === 'age'
                      ? 'bg-[#E8871E] text-white animate-saffron-pulse'
                      : 'bg-[#FFF2E2] text-[#E8871E] hover:bg-[#FFE6C7]'
                  }`}
                >
                  {isListening && listeningTarget === 'age' ? (
                    <MicOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Mic className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Age-group buttons */}
              <div className="grid grid-cols-2 gap-3">
                {ageGroups.map((grp) => {
                  const active =
                    (grp.id === '18-25' && state.profile.age !== null && state.profile.age >= 18 && state.profile.age <= 25) ||
                    (grp.id === '26-45' && state.profile.age !== null && state.profile.age >= 26 && state.profile.age <= 45) ||
                    (grp.id === '46-60' && state.profile.age !== null && state.profile.age >= 46 && state.profile.age <= 60) ||
                    (grp.id === '60+' && state.profile.age !== null && state.profile.age > 60);

                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => handleAgeGroupTap(grp.representativeAge)}
                      className={`min-h-[60px] px-4 py-3 rounded-2xl border-2 text-[20px] font-bold tabular-nums transition-colors ${
                        active
                          ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                          : 'bg-white border-[#E5DDD3] text-[#1F2A28] hover:border-[#0F6B5C]'
                      }`}
                    >
                      {grp.label}
                    </button>
                  );
                })}
              </div>

              {/* Toggle Exact Number Pad */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowNumberPad((v) => !v)}
                  className="min-h-[48px] text-[15px] font-semibold text-[#0F6B5C] hover:underline"
                >
                  {showNumberPad
                    ? lang === 'te'
                      ? 'నంబర్ ప్యాడ్ దాచు'
                      : 'Hide number pad'
                    : lang === 'te'
                      ? 'ఖచ్చితమైన వయస్సు నొక్కండి (ఉదా: 14 లేదా 67)'
                      : 'Or tap exact age on number pad'}
                </button>

                {showNumberPad && (
                  <div className="bg-[#F4F0EA] p-4 rounded-2xl space-y-3">
                    <div className="bg-white rounded-xl min-h-[52px] px-4 flex items-center justify-between border border-[#E5DDD3]">
                      <span className="text-[15px] text-[#42524F]">
                        {lang === 'te' ? 'వయస్సు:' : 'Age:'}
                      </span>
                      <span className="text-[22px] font-bold text-[#1F2A28] tabular-nums">
                        {ageDigits || '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handlePadDigit(d)}
                          className="min-h-[52px] rounded-xl bg-white border border-[#E5DDD3] text-[20px] font-bold text-[#1F2A28] hover:bg-[#E6F2EF] tabular-nums"
                        >
                          {d}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handlePadBackspace}
                        aria-label="Backspace"
                        className="col-span-2 min-h-[52px] rounded-xl bg-white border border-[#E5DDD3] text-[16px] font-semibold text-[#1F2A28] hover:bg-[#FFF3E0] inline-flex items-center justify-center gap-2"
                      >
                        <Delete className="w-5 h-5" aria-hidden="true" />
                        <span>{lang === 'te' ? 'తొలగించు' : 'Clear'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {state.profile.age !== null && (
                <p className="text-[15px] font-semibold text-[#1B7F4B] tabular-nums">
                  {lang === 'te'
                    ? `ఎంచుకున్న వయస్సు: ${state.profile.age} ఏళ్లు`
                    : `Selected age: ${state.profile.age}`}
                </p>
              )}

              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="cwy-btn-primary w-full px-5 inline-flex items-center justify-center gap-2"
              >
                <span>{lang === 'te' ? 'తదుపరి దశ' : 'Next'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </section>
          )}

          {/* STEP 2: FAMILY & WORK — Multiple Choice */}
          {wizardStep === 2 && (
            <section className="cwy-card p-5 sm:p-7 space-y-5">
              <div className="space-y-2">
                <h2 className="text-[22px] sm:text-[24px] font-bold text-[#1F2A28]">
                  {lang === 'te'
                    ? 'మీ కుటుంబం ఏ పని చేస్తుంది?'
                    : 'What work does your family do?'}
                </h2>
                <WhyWeAskTooltip
                  label={copy.whyWeAskLabel}
                  text={
                    lang === 'te'
                      ? 'రైతు సహాయం (₹20,000), కార్మిక భీమా, మరియు వ్యాపార రుణాలను గుర్తించడానికి పని వివరాలు అవసరం.'
                      : 'Work matches farmer aid (₹20,000/yr), worker welfare, and small shop support.'
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workOptions.map((opt) => {
                  const Icon = opt.Icon;
                  const active = state.profile.occupation === opt.occupation;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateProfile({ occupation: opt.occupation })}
                      className={`min-h-[68px] p-4 rounded-2xl border-2 flex items-center gap-3.5 text-left transition-colors ${
                        active
                          ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                          : 'bg-white border-[#E5DDD3] text-[#1F2A28] hover:border-[#0F6B5C]'
                      }`}
                    >
                      <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
                      <span className="text-[18px] font-bold">
                        {lang === 'te' ? opt.labelTe : opt.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedGroup === 'student' && (
                <button
                  type="button"
                  onClick={() => updateProfile({ occupation: 'student' })}
                  className={`w-full min-h-[56px] p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-colors ${
                    state.profile.occupation === 'student'
                      ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                      : 'bg-white border-[#E5DDD3] text-[#1F2A28]'
                  }`}
                >
                  <GraduationCap className="w-6 h-6 shrink-0" aria-hidden="true" />
                  <span className="text-[17px] font-bold">
                    {lang === 'te' ? 'విద్యార్థి (చదువుతున్నారు)' : 'Student (Studying)'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="cwy-btn-primary w-full px-5 inline-flex items-center justify-center gap-2"
              >
                <span>{lang === 'te' ? 'తదుపరి దశ' : 'Next'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </section>
          )}

          {/* STEP 3: INCOME & DOCUMENTS — Yes/No + Income Band */}
          {wizardStep === 3 && (
            <section className="cwy-card p-5 sm:p-7 space-y-6">
              {/* Question 3A: White Ration Card */}
              <div className="space-y-3">
                <h2 className="text-[22px] sm:text-[24px] font-bold text-[#1F2A28]">
                  {lang === 'te'
                    ? 'మీకు తెల్ల రేషన్ కార్డు ఉందా?'
                    : 'Do you have a White Ration Card?'}
                </h2>
                <WhyWeAskTooltip
                  label={copy.whyWeAskLabel}
                  text={
                    lang === 'te'
                      ? 'పెన్షన్లు, తల్లికి వందనం మరియు దీపం 2.0 కోసం కార్డు ఉందో లేదో మాత్రమే చూస్తాము — నంబర్ అడగము.'
                      : 'Needed for pensions, Thalliki Vandanam, and Deepam 2.0 — we never ask the number.'
                  }
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => updateProfile({ has_white_ration_card: true })}
                    className={`min-h-[56px] rounded-2xl border-2 text-[18px] font-bold inline-flex items-center justify-center gap-2 transition-colors ${
                      state.profile.has_white_ration_card === true
                        ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                        : 'bg-white border-[#E5DDD3] text-[#1F2A28] hover:border-[#0F6B5C]'
                    }`}
                  >
                    <Check className="w-5 h-5" aria-hidden="true" />
                    <span>{lang === 'te' ? 'అవును (ఉంది)' : 'Yes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateProfile({ has_white_ration_card: false })}
                    className={`min-h-[56px] rounded-2xl border-2 text-[18px] font-bold transition-colors ${
                      state.profile.has_white_ration_card === false
                        ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                        : 'bg-white border-[#E5DDD3] text-[#1F2A28] hover:border-[#0F6B5C]'
                    }`}
                  >
                    {lang === 'te' ? 'లేదు' : 'No'}
                  </button>
                </div>
              </div>

              {/* Question 3B: Monthly Family Income */}
              <div className="pt-4 border-t border-[#E5DDD3] space-y-3">
                <h2 className="text-[22px] sm:text-[24px] font-bold text-[#1F2A28]">
                  {lang === 'te'
                    ? 'మీ కుటుంబ నెల ఆదాయం ఎంత?'
                    : 'What is your monthly family income?'}
                </h2>
                <WhyWeAskTooltip
                  label={copy.whyWeAskLabel}
                  text={
                    lang === 'te'
                      ? 'నెలకు ₹10,000 (గ్రామీణ) / ₹12,000 (పట్టణ) లోపు ఆదాయం ఉన్న కుటుంబాలకు విద్యా సహాయం అందుతుంది.'
                      : 'School and college schemes check whether monthly income is below ₹10,000–₹12,000.'
                  }
                />

                <div className="space-y-2.5 pt-1">
                  {(
                    [
                      {
                        band: 'below_10000' as MonthlyIncomeBand,
                        te: '₹10,000 కంటే తక్కువ',
                        en: 'Less than ₹10,000',
                      },
                      {
                        band: '10000_to_12000' as MonthlyIncomeBand,
                        te: '₹10,000 – ₹12,000',
                        en: '₹10,000 - ₹12,000',
                      },
                      {
                        band: 'above_12000' as MonthlyIncomeBand,
                        te: '₹12,000 కంటే ఎక్కువ',
                        en: 'More than ₹12,000',
                      },
                    ]
                  ).map((item) => {
                    const active = state.profile.monthly_family_income_band === item.band;
                    return (
                      <button
                        key={item.band}
                        type="button"
                        onClick={() => updateProfile({ monthly_family_income_band: item.band })}
                        className={`w-full min-h-[54px] px-4 py-3 rounded-2xl border-2 text-[17px] font-bold text-left transition-colors tabular-nums ${
                          active
                            ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                            : 'bg-white border-[#E5DDD3] text-[#1F2A28] hover:border-[#0F6B5C]'
                        }`}
                      >
                        {lang === 'te' ? item.te : item.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWizardStep(4)}
                className="cwy-btn-primary w-full px-5 inline-flex items-center justify-center gap-2"
              >
                <span>{lang === 'te' ? 'తదుపరి దశ' : 'Next'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </section>
          )}

          {/* STEP 4: VOICE / TEXT — Big Saffron Mic ONLY Here */}
          {wizardStep === 4 && (
            <section className="cwy-card p-5 sm:p-7 space-y-6">
              <div className="space-y-2">
                <h2 className="text-[22px] sm:text-[24px] font-bold text-[#1F2A28]">
                  {lang === 'te'
                    ? 'ఇంకా ఏమైనా చెప్పాలా? (ఉదాహరణకు ఇంట్లో దివ్యాంగులు లేదా చదువుతున్న కూతురు?)'
                    : 'Is there anything else we should know? (Like a disability in the family, or a daughter studying?)'}
                </h2>
                <WhyWeAskTooltip
                  label={copy.whyWeAskLabel}
                  text={
                    lang === 'te'
                      ? 'వితంతు పెన్షన్ (₹4,000), దివ్యాంగుల పెన్షన్ (₹6,000) మరియు చదువు సహాయాన్ని జోడించడానికి ఇది సహాయపడుతుంది.'
                      : 'Helps include Widow Pension (₹4,000), Disabled Pension (₹6,000), and student support.'
                  }
                />
              </div>

              {/* Big Saffron Mic Button (ONLY in Step 4!) + Type Instead */}
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => startOrStopMic('step4')}
                  aria-label={isListening ? copy.listeningLabel : copy.speakButtonLabel}
                  className={`w-[72px] h-[72px] rounded-full bg-[#E8871E] hover:bg-[#D47714] text-white flex items-center justify-center transition-transform active:scale-95 ${
                    isListening && listeningTarget === 'step4' ? 'animate-saffron-pulse' : ''
                  }`}
                  style={{ boxShadow: 'var(--cwy-shadow-mic)' }}
                >
                  {isListening && listeningTarget === 'step4' ? (
                    <MicOff className="w-8 h-8" aria-hidden="true" />
                  ) : (
                    <Mic className="w-8 h-8" aria-hidden="true" />
                  )}
                </button>
                <span className="text-[16px] font-bold text-[#1F2A28]">
                  {isListening && listeningTarget === 'step4'
                    ? copy.listeningLabel
                    : copy.speakButtonLabel}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setShowTypeBox(true);
                    setTimeout(() => step4InputRef.current?.focus(), 50);
                  }}
                  className="cwy-btn-secondary w-full sm:w-auto px-6 inline-flex items-center justify-center gap-2"
                >
                  <Pencil className="w-5 h-5" aria-hidden="true" />
                  <span>{copy.typeInsteadLabel}</span>
                </button>
              </div>

              {/* Example Chips (Tap to add) */}
              <div className="space-y-2">
                <p className="text-[15px] font-semibold text-[#42524F]">
                  {lang === 'te' ? 'జోడించడానికి ట్యాప్ చేయండి:' : 'Tap to add:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step4Chips.map((chip) => {
                    const selected = selectedExtraChips.includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => toggleStep4Chip(chip)}
                        className={`min-h-[48px] px-4 py-2 rounded-full border text-[15px] font-semibold inline-flex items-center gap-2 transition-colors ${
                          selected
                            ? 'bg-[#0F6B5C] border-[#0F6B5C] text-white'
                            : 'bg-[#F4F0EA] border-[#E5DDD3] text-[#1F2A28] hover:border-[#0F6B5C]'
                        }`}
                      >
                        {selected && <Check className="w-4 h-4" aria-hidden="true" />}
                        <span>{lang === 'te' ? chip.labelTe : chip.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Text Box */}
              {(showTypeBox || step4Notes.length > 0) && (
                <div>
                  <label htmlFor="step4-text" className="sr-only">
                    {copy.inputPlaceholder}
                  </label>
                  <input
                    ref={step4InputRef}
                    id="step4-text"
                    type="text"
                    value={step4Notes}
                    onChange={(e) => {
                      setStep4Notes(e.target.value);
                      if (idWarning && !containsAadhaarLikeNumber(e.target.value)) {
                        setIdWarning(false);
                      }
                    }}
                    placeholder={copy.inputPlaceholder}
                    className="w-full min-h-[48px] px-4 py-2.5 text-[17px] bg-[#FDF8F2] border border-[#D7CFC4] rounded-[14px] text-[#1F2A28] placeholder:text-[#64748B] focus:bg-white focus:border-[#0F6B5C] focus:outline-none"
                  />
                </div>
              )}

              {idWarning && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-[#FFF3E0] text-[#B26A00] text-[15px] font-semibold flex items-start gap-2"
                >
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{copy.noIdNotice}</span>
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-[#FFF3E0] text-[#B26A00] text-[15px] font-semibold"
                >
                  {errorMsg}
                </div>
              )}

              {/* Skeleton loader during AI extraction */}
              {isSubmitting ? (
                <div aria-busy="true" className="space-y-2.5 py-2">
                  <div className="cwy-skeleton h-12 w-full" />
                  <p className="text-center text-[15px] text-[#42524F]">
                    {lang === 'te'
                      ? 'మీ వివరాలతో పథకాలను తనిఖీ చేస్తున్నాము…'
                      : 'Checking schemes with your details…'}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishWizard}
                  className="cwy-btn-primary w-full px-5 inline-flex items-center justify-center gap-2"
                >
                  <span>{copy.sendButton}</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
