import { useState } from 'react';
import { CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { UI_COPY } from '../i18n/strings';

export function PrivacyPage() {
  const { state, dispatch } = useAppState();
  const lang = state.language;
  const copy = UI_COPY[lang];
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearAll = () => {
    dispatch({ type: 'DELETE_ALL_DATA' });
    setConfirmClear(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 4000);
  };

  const rulesList =
    lang === 'te'
      ? [
          'ఎప్పుడూ "హామీ" అని చెప్పము — కేవలం "అర్హత ఉండే అవకాశం ఉంది" అని మాత్రమే చూపిస్తాము.',
          'ఆధార్ నంబర్, బ్యాంకు ఖాతా నంబర్ లేదా గుర్తింపు కార్డు నంబర్లు ఎప్పుడూ అడగము లేదా సేవ్ చేయము.',
          'మీ కుటుంబ వివరాలు కేవలం ఈ సెషన్‌లోనే ఉంటాయి — ఎక్కడా నిల్వ చేయబడవు.',
          'అర్హత నిర్ణయాలను AI తీసుకోదు — నియమాలన్నీ పారదర్శక నియమ ఇంజిన్ ద్వారా లెక్కించబడతాయి.',
          '90 రోజుల కంటే పాత ధృవీకరణ ఉన్న పథకాలపై సచివాలయంలో నిర్ధారించుకోమని స్పష్టంగా చూపిస్తాము.',
        ]
      : [
          'Never claims "guaranteed" — always explains "likely eligible" and shows the exact rule.',
          'Never asks for or stores Aadhaar numbers, bank account numbers, or full ID numbers.',
          'Your household details exist only during this active session and are never stored to disk.',
          'AI only extracts and explains; deterministic TypeScript rules decide every eligibility verdict.',
          'Any scheme verified more than 90 days ago is labeled to confirm at your Grama/Ward Sachivalayam.',
        ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1F2A28]">
          {copy.privacyHeading}
        </h1>
        <p className="text-[16px] text-[#42524F]">{copy.sessionPrivacyBanner}</p>
      </div>

      {cleared && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#E6F4EC] text-[#1B7F4B] text-[16px] font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>
            {lang === 'te'
              ? 'సెషన్ వివరాలు మరియు రిమైండర్లు క్లియర్ చేయబడ్డాయి.'
              : 'Session details and reminders have been cleared.'}
          </span>
        </div>
      )}

      <section className="cwy-card p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E6F2EF] text-[#0F6B5C] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h2 className="text-[20px] font-bold text-[#1F2A28]">
              {lang === 'te' ? 'మా నమ్మకమైన నియమాలు' : 'Our Trust Commitments'}
            </h2>
            <ul className="space-y-2.5 text-[16px] text-[#1F2A28] list-disc pl-5">
              {rulesList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[15px] text-[#42524F] tabular-nums">
            {lang === 'te'
              ? `సెషన్ సందేశాలు: ${state.messages.length} · రిమైండర్లు: ${state.reminders.length}`
              : `Session messages: ${state.messages.length} · Reminders: ${state.reminders.length}`}
          </p>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="cwy-btn-secondary w-full sm:w-auto px-5 inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>
                {lang === 'te' ? 'సెషన్ & రిమైండర్లు క్లియర్ చేయండి' : 'Clear session & reminders'}
              </span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClearAll}
                className="cwy-btn-primary w-full sm:w-auto px-5"
              >
                {lang === 'te' ? 'అవును, క్లియర్ చేయండి' : 'Yes, clear everything'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="cwy-btn-secondary w-full sm:w-auto px-5"
              >
                {lang === 'te' ? 'రద్దు' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
