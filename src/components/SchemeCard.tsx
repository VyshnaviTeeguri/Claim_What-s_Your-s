import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  Info,
  Link2,
  MapPin,
} from 'lucide-react';
import { useAppState } from '../context/AppContext';
import {
  STALE_VERIFICATION_LABEL_EN,
  STALE_VERIFICATION_LABEL_TE,
} from '../engine/eligibilityEngine';
import { UI_COPY } from '../i18n/strings';
import { EligibilityCheckResult, EligibilityVerdict, WelfareProfile } from '../types/scheme';
import { StatusIndicator } from './StatusIndicator';

interface SchemeCardProps {
  result: EligibilityCheckResult;
  defaultExpanded?: boolean;
}

const LEFT_STRIP_BY_VERDICT: Record<EligibilityVerdict, string> = {
  MATCH: 'border-l-[6px] border-l-[#1B7F4B]',
  NEEDS_INFORMATION: 'border-l-[6px] border-l-[#B26A00]',
  UNVERIFIED: 'border-l-[6px] border-l-[#B26A00]',
  DOES_NOT_MATCH: 'border-l-[6px] border-l-[#64748B]',
};

function getDocFieldForToggle(docName: string): keyof WelfareProfile | null {
  const lower = docName.toLowerCase();
  if (lower.includes('white ration card')) return 'has_white_ration_card';
  if (lower.includes('sadarem')) return 'has_sadarem_certificate';
  if (lower.includes('death certificate')) return 'has_husbands_death_certificate';
  if (lower.includes('bank passbook') || lower.includes('bank account'))
    return 'has_bank_passbook_first_page';
  if (lower.includes('income')) return 'has_income_certificate';
  if (lower.includes('land records') || lower.includes('adangal'))
    return 'has_land_records_meebhoomi';
  if (lower.includes('labour') || lower.includes('e-shram'))
    return 'has_labour_or_eshram_card';
  if (lower.includes('degree') || lower.includes('graduate'))
    return 'has_education_certificate';
  if (lower.includes('shg membership')) return 'is_shg_member';
  if (lower.includes('aadhaar') || lower.includes('government id') || lower.includes('age proof'))
    return 'has_aadhaar_card_possession';
  return null;
}

export function SchemeCard({ result, defaultExpanded = false }: SchemeCardProps) {
  const { state, dispatch } = useAppState();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const lang = state.language;
  const copy = UI_COPY[lang];

  const {
    scheme,
    verdict,
    isStaleOver90Days,
    matchedRuleSummaryEn,
    matchedRuleSummaryTe,
    rules,
    missingField,
    doesNotMatchReasonEn,
    doesNotMatchReasonTe,
    nearestAlternativeId,
    nearestAlternativeReasonEn,
    nearestAlternativeReasonTe,
    documents,
  } = result;

  const toggleDocPossession = (docName: string, nextValue: boolean) => {
    const field = getDocFieldForToggle(docName);
    if (!field) return;
    dispatch({ type: 'UPDATE_PROFILE', partial: { [field]: nextValue } });
  };

  const quickAnswerBoolean = (field: keyof WelfareProfile, val: boolean) => {
    dispatch({ type: 'UPDATE_PROFILE', partial: { [field]: val } });
  };

  const isBooleanField = (field: keyof WelfareProfile): boolean =>
    field === 'has_white_ration_card' ||
    field === 'has_sadarem_certificate' ||
    field === 'is_shg_member' ||
    field === 'is_registered_unorganised_worker';

  const totalDocs = scheme.documents_required.length;
  const haveDocs = documents.alreadyHave.length;

  return (
    <article
      className={`cwy-card overflow-hidden ${LEFT_STRIP_BY_VERDICT[verdict]}`}
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Top Row: Pill Badge + Likely Eligibility Guarantee Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusIndicator verdict={verdict} language={lang} />
          <span className="text-[15px] font-medium text-[#42524F]">
            {copy.closingLikelyDisclaimer}
          </span>
        </div>

        {/* 90-day Staleness Banner */}
        {isStaleOver90Days && (
          <div className="px-3.5 py-2.5 rounded-xl bg-[#FFF3E0] text-[#B26A00] text-[15px] font-semibold flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {lang === 'te' ? STALE_VERIFICATION_LABEL_TE : STALE_VERIFICATION_LABEL_EN}
            </span>
          </div>
        )}

        {/* Scheme Name (18px bold) + Benefit (1 line) */}
        <div>
          <h3 className="text-[18px] sm:text-[20px] font-bold text-[#1F2A28] leading-snug">
            <Link
              to={`/scheme/${scheme.scheme_id}`}
              className="hover:text-[#0F6B5C] transition-colors"
            >
              {scheme.scheme_name}
            </Link>
          </h3>
          <p className="mt-1 text-[16px] font-medium text-[#42524F]">
            {scheme.benefit_summary}
          </p>
        </div>

        {/* Light Grey Sub-Box: "Matched on: <rule>" (or supportive reason) */}
        {verdict === 'MATCH' && (
          <div className="bg-[#F4F0EA] rounded-xl p-4 text-[15px] text-[#1F2A28] leading-relaxed">
            <span className="font-bold text-[#0F6B5C]">{copy.matchedOnLabel}: </span>
            <span>{lang === 'te' ? matchedRuleSummaryTe : matchedRuleSummaryEn}</span>
          </div>
        )}

        {verdict === 'NEEDS_INFORMATION' && missingField && (
          <div className="bg-[#FFF3E0]/70 rounded-xl p-4 space-y-3 text-[15px] text-[#1F2A28]">
            <p className="font-medium leading-relaxed">
              {lang === 'te' ? missingField.questionTe : missingField.questionEn}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {isBooleanField(missingField.field) ? (
                <>
                  <button
                    type="button"
                    onClick={() => quickAnswerBoolean(missingField.field, true)}
                    className="cwy-btn-primary px-5 min-h-[48px] inline-flex items-center justify-center"
                  >
                    {lang === 'te' ? 'అవును, ఉంది' : 'Yes, I have it'}
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAnswerBoolean(missingField.field, false)}
                    className="cwy-btn-secondary px-5 min-h-[48px] inline-flex items-center justify-center"
                  >
                    {lang === 'te' ? 'లేదు' : 'No'}
                  </button>
                </>
              ) : (
                <Link
                  to="/"
                  className="cwy-btn-primary px-5 min-h-[48px] inline-flex items-center justify-center"
                >
                  {lang === 'te' ? 'సహాయకుడికి చెప్పండి' : 'Answer in Home Assistant'}
                </Link>
              )}
            </div>
          </div>
        )}

        {verdict === 'DOES_NOT_MATCH' && (
          <div className="bg-[#F1F5F9] rounded-xl p-4 space-y-2 text-[15px] text-[#334155]">
            <p>{lang === 'te' ? doesNotMatchReasonTe : doesNotMatchReasonEn}</p>
            {nearestAlternativeReasonEn && (
              <p className="font-semibold text-[#0F6B5C]">
                <span>
                  {lang === 'te' ? 'సమీప ప్రత్యామ్నాయం: ' : 'Nearest option: '}
                  {lang === 'te' ? nearestAlternativeReasonTe : nearestAlternativeReasonEn}
                </span>{' '}
                {nearestAlternativeId && (
                  <Link
                    to={`/scheme/${nearestAlternativeId}`}
                    className="underline inline-block ml-1"
                  >
                    {lang === 'te' ? 'చూడండి' : 'View'}
                  </Link>
                )}
              </p>
            )}
          </div>
        )}

        {verdict === 'UNVERIFIED' && (
          <div className="bg-[#FFF3E0]/70 rounded-xl p-4 text-[15px] text-[#1F2A28]">
            {lang === 'te'
              ? 'ఈ పథకం నియమాలు మారినందున ప్రస్తుత అర్హతను జ్ఞానభూమి లేదా గ్రామ/వార్డు సచివాలయంలో నిర్ధారించుకోండి.'
              : `${scheme.verification_status}. ${scheme.notes}`}
          </div>
        )}

        {/* Footer Row of Chips: Documents · How to apply · Official source · Verified <date> */}
        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-[#42524F]">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <FileText className="w-4 h-4 text-[#0F6B5C]" aria-hidden="true" />
            <span>
              {lang === 'te' ? 'పత్రాలు' : 'Documents'} ({haveDocs}/{totalDocs})
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#0F6B5C]" aria-hidden="true" />
            <span className="truncate max-w-[230px]">
              {scheme.application_channel.split(';')[0]}
            </span>
          </span>

          <a
            href={scheme.official_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#0F6B5C] hover:underline min-h-[48px]"
          >
            <Link2 className="w-4 h-4" aria-hidden="true" />
            <span>{lang === 'te' ? 'అధికారిక సైట్' : 'Official source'}</span>
          </a>

          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <CheckCircle className="w-4 h-4 text-[#1B7F4B]" aria-hidden="true" />
            <span>
              {copy.lastVerifiedLabel} {scheme.last_verified}
            </span>
          </span>
        </div>

        {/* Expand / Collapse Chevron Button (>= 48px) */}
        <div className="pt-2 border-t border-[#E5DDD3] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="min-h-[48px] px-4 py-2 rounded-[14px] border border-[#0F6B5C] text-[#0F6B5C] hover:bg-[#E6F2EF] text-[15px] font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <span>
              {expanded
                ? lang === 'te'
                  ? 'వివరాలు మూసివేయండి'
                  : 'Hide details'
                : lang === 'te'
                  ? 'పత్రాలు & పూర్తి వివరాలు'
                  : 'Documents & full details'}
            </span>
            {expanded ? (
              <ChevronUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5" aria-hidden="true" />
            )}
          </button>

          <Link
            to={`/reminders?scheme=${scheme.scheme_id}`}
            className="min-h-[48px] px-4 py-2 rounded-[14px] bg-[#FFF2E2] text-[#B26A00] hover:bg-[#FFE6C7] text-[15px] font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span>{lang === 'te' ? 'రిమైండర్ పెట్టు' : 'Set reminder'}</span>
          </Link>
        </div>
      </div>

      {/* Expanded Details: Document Checklist (2 Columns) + How to Apply + Rule Breakdown */}
      {expanded && (
        <div className="border-t border-[#E5DDD3] bg-[#FDF8F2]/60 px-5 sm:px-6 py-5 space-y-5">
          {/* 5. DOCUMENT CHECKLIST: Two sections — "You already have" (green check) & "You need to get" (amber circle) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E5DDD3] space-y-2.5">
              <h4 className="text-[16px] font-bold text-[#1B7F4B] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>
                  {copy.alreadyHaveLabel} ({documents.alreadyHave.length})
                </span>
              </h4>

              {documents.alreadyHave.length === 0 ? (
                <p className="text-[15px] text-[#42524F]">
                  {lang === 'te'
                    ? 'మీ వద్ద ఉన్న పత్రాలపై ట్యాప్ చేసి గుర్తించండి.'
                    : 'Tap any document in the other list if you already have it.'}
                </p>
              ) : (
                <ul className="divide-y divide-[#F0EAE0]">
                  {documents.alreadyHave.map((doc) => {
                    const toggleField = getDocFieldForToggle(doc);
                    return (
                      <li key={doc}>
                        <button
                          type="button"
                          onClick={() => toggleField && toggleDocPossession(doc, false)}
                          disabled={!toggleField}
                          className="w-full min-h-[48px] py-2.5 px-2 flex items-center gap-3 text-left text-[15px] text-[#1F2A28] hover:bg-[#E6F4EC]/50 rounded-xl transition-colors"
                        >
                          <CheckCircle2
                            className="w-5 h-5 text-[#1B7F4B] shrink-0"
                            aria-hidden="true"
                          />
                          <span className="flex-1">{doc}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E5DDD3] space-y-2.5">
              <h4 className="text-[16px] font-bold text-[#B26A00] flex items-center gap-2">
                <Circle className="w-5 h-5" aria-hidden="true" />
                <span>
                  {copy.needToGetLabel} ({documents.needToGet.length})
                </span>
              </h4>

              {documents.needToGet.length === 0 ? (
                <p className="text-[15px] font-medium text-[#1B7F4B]">
                  {lang === 'te'
                    ? 'అవసరమైన పత్రాలన్నీ మీ వద్ద ఉన్నాయి.'
                    : 'You already have all listed documents.'}
                </p>
              ) : (
                <ul className="divide-y divide-[#F0EAE0]">
                  {documents.needToGet.map((doc) => {
                    const toggleField = getDocFieldForToggle(doc);
                    return (
                      <li key={doc}>
                        <button
                          type="button"
                          onClick={() => toggleField && toggleDocPossession(doc, true)}
                          disabled={!toggleField}
                          className="w-full min-h-[48px] py-2.5 px-2 flex items-center justify-between gap-3 text-left text-[15px] text-[#1F2A28] hover:bg-[#FFF3E0]/60 rounded-xl transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <Circle
                              className="w-5 h-5 text-[#B26A00] shrink-0"
                              aria-hidden="true"
                            />
                            <span>{doc}</span>
                          </span>
                          {toggleField && (
                            <span className="text-[15px] font-semibold text-[#0F6B5C] shrink-0">
                              {lang === 'te' ? 'ఉంది' : 'Have it'}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Exact Next Step */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DDD3] flex items-start gap-3 text-[15px]">
            <MapPin className="w-5 h-5 text-[#0F6B5C] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-[#1F2A28]">{copy.nextStepLabel}</p>
              <p className="text-[#42524F] mt-0.5">{scheme.application_channel}</p>
            </div>
          </div>

          {/* Rule-by-rule breakdown */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DDD3] space-y-2">
            <h4 className="text-[16px] font-bold text-[#1F2A28]">
              {lang === 'te' ? 'నిర్ధారణ నియమాల వివరాలు' : 'Rule-by-rule check'}
            </h4>
            <ul className="divide-y divide-[#F0EAE0]">
              {rules.map((rule, idx) => {
                const Icon =
                  rule.outcome === 'pass'
                    ? CheckCircle2
                    : rule.outcome === 'fail'
                      ? Info
                      : AlertCircle;
                const color =
                  rule.outcome === 'pass'
                    ? 'text-[#1B7F4B]'
                    : rule.outcome === 'fail'
                      ? 'text-[#64748B]'
                      : 'text-[#B26A00]';
                return (
                  <li key={idx} className="py-2.5 flex items-start gap-2.5 text-[15px]">
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
                    <div>
                      <span className="font-semibold text-[#1F2A28]">
                        {lang === 'te' ? rule.labelTe : rule.labelEn}:{' '}
                      </span>
                      <span className="text-[#42524F]">
                        {lang === 'te' ? rule.explanationTe : rule.explanationEn}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}
