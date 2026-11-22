import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Calendar, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { UI_COPY } from '../i18n/strings';

function compute30DayFollowUpIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function RemindersPage() {
  const { state, schemes, results, dispatch } = useAppState();
  const [searchParams] = useSearchParams();
  const preselectedScheme = searchParams.get('scheme');

  const lang = state.language;
  const copy = UI_COPY[lang];

  const matchedIds = useMemo(
    () => results.filter((r) => r.verdict === 'MATCH').map((r) => r.scheme.scheme_id),
    [results],
  );

  const [phone, setPhone] = useState('');
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>(() => {
    if (preselectedScheme) return [preselectedScheme];
    return matchedIds;
  });
  const [remindDeadlines, setRemindDeadlines] = useState(true);
  const [remindSuperSix, setRemindSuperSix] = useState(true);
  const [remind30Day, setRemind30Day] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const toggleScheme = (id: string) => {
    setSelectedSchemes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSavedNotice(false);

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 12) {
      setNotice(
        lang === 'te'
          ? 'ఆధార్ నంబర్ ఎప్పుడూ ఇవ్వవద్దు — కేవలం 10 అంకెల మొబైల్ నంబర్ మాత్రమే నమోదు చేయండి.'
          : 'Never enter an Aadhaar number — enter only a 10-digit mobile phone number.',
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setNotice(
        lang === 'te'
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి (ఉదా: 9876543210).'
          : 'Please enter a valid 10-digit mobile number (e.g. 9876543210).',
      );
      return;
    }

    if (!remindDeadlines && !remindSuperSix && !remind30Day) {
      setNotice(
        lang === 'te'
          ? 'కనీసం ఒక రిమైండర్‌ను ఎంచుకోండి.'
          : 'Please select at least one reminder option.',
      );
      return;
    }

    dispatch({
      type: 'ADD_REMINDER',
      reminder: {
        id: `rem-${Date.now()}`,
        phoneNumber: digitsOnly,
        schemeIds: selectedSchemes,
        remindDeadlines,
        remindSuperSixReverification: remindSuperSix,
        remind30DayFollowUp: remind30Day,
        followUpDate: compute30DayFollowUpIso(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    });

    setPhone('');
    setSavedNotice(true);
  };

  const getSchemeName = (id: string) =>
    schemes.find((s) => s.scheme_id === id)?.scheme_name ?? id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1F2A28]">
          {copy.remindersHeading}
        </h1>
        <p className="text-[16px] text-[#42524F]">{copy.remindersSubheading}</p>
      </div>

      {/* 6. REMINDERS: Bell-icon card showing saved reminders as simple rows with date + scheme */}
      <section className="cwy-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF2E2] text-[#E8871E] flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#1F2A28]">
              {lang === 'te' ? 'మీ సేవ్ చేసిన రిమైండర్లు' : 'Saved Reminders'} ({state.reminders.length})
            </h2>
            <p className="text-[15px] text-[#42524F]">
              {lang === 'te' ? 'తేదీ మరియు పథకం వివరాలు' : 'Date and scheme schedule'}
            </p>
          </div>
        </div>

        {state.reminders.length === 0 ? (
          <p className="text-[15px] text-[#42524F] bg-[#F4F0EA] rounded-xl p-4">
            {lang === 'te'
              ? 'ఇంకా రిమైండర్లు లేవు — కింద మీ ఫోన్ నంబర్‌తో ఒకటి సెట్ చేయండి.'
              : 'No reminders yet — add one below with your mobile number.'}
          </p>
        ) : (
          <ul className="divide-y divide-[#E5DDD3]">
            {state.reminders.map((rem) => (
              <li
                key={rem.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-[#1F2A28] tabular-nums">
                    <Calendar className="w-4 h-4 text-[#0F6B5C]" aria-hidden="true" />
                    <span>{rem.followUpDate}</span>
                    <span>·</span>
                    <span>+91 {rem.phoneNumber}</span>
                  </div>
                  <p className="text-[15px] text-[#42524F]">
                    {rem.schemeIds.length > 0
                      ? rem.schemeIds.map(getSchemeName).join(', ')
                      : lang === 'te'
                        ? 'సాధారణ AP పథక గడువులు'
                        : 'General AP scheme deadlines'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch({ type: 'DELETE_REMINDER', id: rem.id })}
                  className="cwy-btn-secondary min-h-[48px] px-4 inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>{lang === 'te' ? 'తొలగించు' : 'Remove'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add Reminder Card */}
      <form onSubmit={handleSaveReminder} className="cwy-card p-5 sm:p-6 space-y-5">
        <div className="p-3.5 rounded-xl bg-[#FFF3E0] text-[#B26A00] text-[15px] font-semibold flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{copy.noIdNotice}</span>
        </div>

        <div>
          <label
            htmlFor="reminder-phone"
            className="block text-[16px] font-bold text-[#1F2A28] mb-2"
          >
            {lang === 'te' ? '10 అంకెల మొబైల్ నంబర్' : '10-digit mobile number'}
          </label>
          <input
            id="reminder-phone"
            type="tel"
            inputMode="numeric"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full min-h-[48px] px-4 py-2.5 text-[17px] tabular-nums bg-[#FDF8F2] border border-[#D7CFC4] rounded-[14px] text-[#1F2A28] placeholder:text-[#64748B] focus:bg-white focus:border-[#0F6B5C] focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[16px] font-bold text-[#1F2A28]">
            {lang === 'te' ? 'ఏ రిమైండర్లు కావాలి?' : 'What should we remind you about?'}
          </p>

          <label className="min-h-[48px] flex items-center gap-3 text-[16px] text-[#1F2A28] cursor-pointer">
            <input
              type="checkbox"
              checked={remindDeadlines}
              onChange={(e) => setRemindDeadlines(e.target.checked)}
              className="w-5 h-5 accent-[#0F6B5C]"
            />
            <span>
              {lang === 'te'
                ? 'దరఖాస్తు గడువులు & సచివాలయ సమర్పణ తేదీలు'
                : 'Application deadlines & Sachivalayam dates'}
            </span>
          </label>

          <label className="min-h-[48px] flex items-center gap-3 text-[16px] text-[#1F2A28] cursor-pointer">
            <input
              type="checkbox"
              checked={remindSuperSix}
              onChange={(e) => setRemindSuperSix(e.target.checked)}
              className="w-5 h-5 accent-[#0F6B5C]"
            />
            <span>
              {lang === 'te'
                ? 'సూపర్ సిక్స్ రీ-వెరిఫికేషన్ తేదీలు'
                : 'Super Six re-verification dates'}
            </span>
          </label>

          <label className="min-h-[48px] flex items-center gap-3 text-[16px] text-[#1F2A28] cursor-pointer">
            <input
              type="checkbox"
              checked={remind30Day}
              onChange={(e) => setRemind30Day(e.target.checked)}
              className="w-5 h-5 accent-[#0F6B5C]"
            />
            <span>
              {lang === 'te'
                ? `30 రోజుల ఫాలో-అప్ (${compute30DayFollowUpIso()})`
                : `30-day follow-up (${compute30DayFollowUpIso()})`}
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-[16px] font-bold text-[#1F2A28]">
            {lang === 'te' ? 'పథకాలు ఎంచుకోండి' : 'Choose schemes'}
          </p>
          <div className="max-h-56 overflow-y-auto border border-[#E5DDD3] rounded-2xl divide-y divide-[#F0EAE0]">
            {schemes.map((s) => (
              <label
                key={s.scheme_id}
                className="min-h-[48px] px-3.5 py-2 flex items-center gap-3 text-[15px] text-[#1F2A28] cursor-pointer hover:bg-[#FDF8F2]"
              >
                <input
                  type="checkbox"
                  checked={selectedSchemes.includes(s.scheme_id)}
                  onChange={() => toggleScheme(s.scheme_id)}
                  className="w-5 h-5 accent-[#0F6B5C]"
                />
                <span>{s.scheme_name}</span>
              </label>
            ))}
          </div>
        </div>

        {notice && (
          <p role="alert" className="text-[15px] font-semibold text-[#B26A00]">
            {notice}
          </p>
        )}

        {savedNotice && (
          <p
            role="status"
            className="text-[15px] font-semibold text-[#1B7F4B] inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span>
              {lang === 'te' ? 'రిమైండర్ సేవ్ చేయబడింది.' : 'Reminder saved.'}
            </span>
          </p>
        )}

        <button
          type="submit"
          className="cwy-btn-primary w-full px-5 inline-flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span>{lang === 'te' ? 'రిమైండర్ సెట్ చేయండి' : 'Set Phone Reminder'}</span>
        </button>
      </form>
    </div>
  );
}
