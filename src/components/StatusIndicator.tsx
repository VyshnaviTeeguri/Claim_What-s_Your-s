import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { VERDICT_LABELS } from '../i18n/strings';
import { EligibilityVerdict, LanguageCode } from '../types/scheme';

interface StatusIndicatorProps {
  verdict: EligibilityVerdict;
  language?: LanguageCode;
}

const VERDICT_STYLES: Record<
  EligibilityVerdict,
  { container: string; Icon: typeof CheckCircle2 }
> = {
  MATCH: {
    container: 'bg-[#E6F4EC] text-[#1B7F4B]',
    Icon: CheckCircle2,
  },
  NEEDS_INFORMATION: {
    container: 'bg-[#FFF3E0] text-[#B26A00]',
    Icon: AlertCircle,
  },
  UNVERIFIED: {
    container: 'bg-[#FFF3E0] text-[#B26A00]',
    Icon: AlertCircle,
  },
  DOES_NOT_MATCH: {
    container: 'bg-[#F1F5F9] text-[#475569]',
    Icon: Info,
  },
};

export function StatusIndicator({ verdict, language = 'te' }: StatusIndicatorProps) {
  const style = VERDICT_STYLES[verdict];
  const Icon = style.Icon;
  const label = VERDICT_LABELS[language][verdict];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[15px] font-semibold whitespace-nowrap ${style.container}`}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
