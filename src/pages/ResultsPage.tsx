import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { SchemeCard } from '../components/SchemeCard';
import { useAppState } from '../context/AppContext';
import { UI_COPY } from '../i18n/strings';
import { EligibilityVerdict } from '../types/scheme';

type VerdictFilter = 'ALL' | EligibilityVerdict;

export function ResultsPage() {
  const { state, results } = useAppState();
  const lang = state.language;
  const copy = UI_COPY[lang];

  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsRefreshing(false), 260);
    return () => clearTimeout(timer);
  }, []);

  const counts = useMemo(
    () => ({
      ALL: results.length,
      MATCH: results.filter((r) => r.verdict === 'MATCH').length,
      NEEDS_INFORMATION: results.filter((r) => r.verdict === 'NEEDS_INFORMATION').length,
      UNVERIFIED: results.filter((r) => r.verdict === 'UNVERIFIED').length,
      DOES_NOT_MATCH: results.filter((r) => r.verdict === 'DOES_NOT_MATCH').length,
    }),
    [results],
  );

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (verdictFilter !== 'ALL' && r.verdict !== verdictFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${r.scheme.scheme_name} ${r.scheme.target_group} ${r.scheme.benefit_summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [results, verdictFilter, searchQuery]);

  const tabs: Array<{ id: VerdictFilter; label: string }> = [
    { id: 'ALL', label: `${lang === 'te' ? 'అన్నీ' : 'All'} (${counts.ALL})` },
    {
      id: 'MATCH',
      label: `${lang === 'te' ? 'అర్హత అవకాశం' : 'Likely eligible'} (${counts.MATCH})`,
    },
    {
      id: 'NEEDS_INFORMATION',
      label: `${lang === 'te' ? 'వివరాలు కావాలి' : 'Need details'} (${counts.NEEDS_INFORMATION})`,
    },
    {
      id: 'DOES_NOT_MATCH',
      label: `${lang === 'te' ? 'సరిపోలేదు' : 'Not eligible'} (${counts.DOES_NOT_MATCH})`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="space-y-2">
        <Link
          to="/"
          className="min-h-[48px] inline-flex items-center gap-2 text-[15px] font-semibold text-[#0F6B5C] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{lang === 'te' ? 'సహాయకుడికి తిరిగి వెళ్ళండి' : 'Back to Assistant'}</span>
        </Link>

        <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1F2A28]">
          {copy.resultsHeading}
        </h1>
        <p className="text-[16px] text-[#42524F]">{copy.resultsSubheading}</p>
      </div>

      {/* Filter Chips & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVerdictFilter(tab.id)}
              className={`min-h-[48px] px-4 py-2 rounded-full text-[15px] font-semibold whitespace-nowrap tabular-nums transition-colors ${
                verdictFilter === tab.id
                  ? 'bg-[#0F6B5C] text-white'
                  : 'bg-white border border-[#E5DDD3] text-[#1F2A28] hover:bg-[#F4F0EA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'te' ? 'పథకం పేరు వెతకండి...' : 'Search schemes...'}
            aria-label="Search schemes"
            className="w-full min-h-[48px] pl-11 pr-4 py-2.5 text-[17px] bg-white border border-[#D7CFC4] rounded-[14px] text-[#1F2A28] placeholder:text-[#64748B] focus:border-[#0F6B5C] focus:outline-none"
          />
        </div>
      </div>

      {/* Gentle Skeleton Loaders instead of blank white */}
      {isRefreshing ? (
        <div aria-busy="true" className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="cwy-card p-6 space-y-3">
              <div className="cwy-skeleton h-6 w-36" />
              <div className="cwy-skeleton h-5 w-2/3" />
              <div className="cwy-skeleton h-14 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="cwy-card p-8 text-center space-y-4">
          <p className="text-[16px] text-[#42524F]">
            {lang === 'te' ? 'ఈ ఫిల్టర్‌లో పథకాలు లేవు.' : 'No schemes in this filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setVerdictFilter('ALL');
              setSearchQuery('');
            }}
            className="cwy-btn-primary px-6"
          >
            {lang === 'te' ? 'అన్ని పథకాలు చూపించు' : 'Show all 13 schemes'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((res, idx) => (
            <SchemeCard
              key={res.scheme.scheme_id}
              result={res}
              defaultExpanded={idx === 0 && res.verdict === 'MATCH'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
