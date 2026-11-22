/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AppProvider, useAppState } from './context/AppContext';
import { HomePage } from './pages/HomePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RemindersPage } from './pages/RemindersPage';
import { ResultsPage } from './pages/ResultsPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';

function Footer() {
  const { state } = useAppState();
  const lang = state.language;

  return (
    <footer className="border-t border-[#E5DDD3] bg-[#FDF8F2] mt-auto mb-16 md:mb-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[15px] text-[#42524F]">
        <p>
          {lang === 'te'
            ? "Claim What's Yours · ఇది అర్హత ఉండే అవకాశం మాత్రమే — హామీ కాదు."
            : "Claim What's Yours · Likely eligible — not a guarantee."}
        </p>
        <div className="flex items-center gap-5 shrink-0 font-semibold text-[#0F6B5C]">
          <Link to="/results" className="min-h-[48px] inline-flex items-center hover:underline">
            {lang === 'te' ? 'పథకాలు' : 'Schemes'}
          </Link>
          <Link to="/reminders" className="min-h-[48px] inline-flex items-center hover:underline">
            {lang === 'te' ? 'రిమైండర్లు' : 'Reminders'}
          </Link>
          <Link to="/privacy" className="min-h-[48px] inline-flex items-center hover:underline">
            {lang === 'te' ? 'గోప్యత' : 'Privacy'}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#FDF8F2] text-[#1F2A28]">
          <Navbar />
          <main className="flex-1 pb-24 md:pb-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/scheme/:id" element={<SchemeDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
