import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SchemeCard } from '../components/SchemeCard';
import { useAppState } from '../context/AppContext';

export function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, results } = useAppState();
  const result = results.find((r) => r.scheme.scheme_id === id);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center space-y-4">
        <h1 className="text-[24px] font-bold text-[#1F2A28]">
          {state.language === 'te' ? 'పథకం కనుగొనబడలేదు' : 'Scheme not found'}
        </h1>
        <Link
          to="/results"
          className="cwy-btn-primary px-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>{state.language === 'te' ? 'ఫలితాలకు తిరిగి వెళ్ళండి' : 'Back to Results'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link
        to="/results"
        className="min-h-[48px] inline-flex items-center gap-2 text-[16px] font-semibold text-[#0F6B5C] hover:underline"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        <span>{state.language === 'te' ? 'అన్ని పథకాలకు తిరిగి వెళ్ళండి' : 'Back to all schemes'}</span>
      </Link>

      <SchemeCard result={result} defaultExpanded />
    </div>
  );
}
