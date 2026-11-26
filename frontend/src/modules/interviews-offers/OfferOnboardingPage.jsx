import React, { useState } from 'react';
import { Gift, CheckSquare } from 'lucide-react';
import AdminOfferGenerator from '../admin/AdminOfferGenerator';
import AdminOnboardingTracker from '../admin/AdminOnboardingTracker';
import '../admin/admin.css';

export const OfferOnboardingPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('offers'); // 'offers' | 'onboarding'

  return (
    <div className="admin-module-container space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-primary flex items-center justify-center shadow-sm">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Offers & Pre-Hire Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Generate formal employment letters, export PDFs, and track candidate onboarding readiness checklists.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-muted p-1 rounded-xl border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('offers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'offers'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Offer Generator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('onboarding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'onboarding'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Onboarding Checklist</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'offers' ? <AdminOfferGenerator /> : <AdminOnboardingTracker />}
    </div>
  );
};

export default OfferOnboardingPage;
