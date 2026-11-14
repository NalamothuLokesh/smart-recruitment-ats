import React, { useState, useEffect } from 'react';
import { offersApi, applicationsApi } from '../../api/client';
import { Gift, CheckSquare, Square, DollarSign, Calendar, FileText, CheckCircle2, Plus } from 'lucide-react';

/**
 * ============================================================================
 * MODULE: OfferOnboardingPage.jsx
 * ASSIGNED TO: // TODO: [Teammate 3: Interviews, Offers & Onboarding Specialist]
 * PAIR MODULE: src/modules/interviews-offers/InterviewSchedulerPage.jsx
 * 
 * RESPONSIBILITIES:
 * 1. Employment Offer Generator: Draft compensation, start date, and markdown letter for SELECTED candidates.
 * 2. Automated Onboarding Task Checklist: Inspect generated tasks for issued offers.
 * 3. Interactive Task Checkbox: Mark onboarding milestones complete (background checks, equipment, direct deposit).
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - offersApi.generateOffer(offerData)
 * - offersApi.getOnboarding(offerId)
 * - offersApi.updateOnboardingTask(taskId, isCompleted)
 * - applicationsApi.listApplications({ stage: 'SELECTED' })
 * ============================================================================
 */
export const OfferOnboardingPage = () => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [activeOfferId, setActiveOfferId] = useState(1); // default seed offer 1
  const [onboardingData, setOnboardingData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Offer Generator Form
  const [offerForm, setOfferForm] = useState({
    applicationId: '',
    salaryOffered: 160000,
    joiningDate: '2026-03-01',
    offerLetterContent: '# Formal Offer of Employment\n\nDear Candidate,\n\nNovaTech is excited to extend a formal offer of employment...'
  });

  const loadData = async () => {
    try {
      const [candRes, onbRes] = await Promise.all([
        applicationsApi.listApplications({ stage: 'SELECTED', limit: 20 }),
        offersApi.getOnboarding(activeOfferId).catch(() => null)
      ]);
      setSelectedCandidates(candRes.data || []);
      if (candRes.data?.length > 0 && !offerForm.applicationId) {
        setOfferForm(prev => ({ ...prev, applicationId: candRes.data[0].id }));
      }
      if (onbRes?.data) {
        setOnboardingData(onbRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeOfferId]);

  const handleGenerateOffer = async (e) => {
    e.preventDefault();
    try {
      const res = await offersApi.generateOffer({
        applicationId: parseInt(offerForm.applicationId, 10),
        salaryOffered: parseFloat(offerForm.salaryOffered),
        joiningDate: offerForm.joiningDate,
        offerLetterContent: offerForm.offerLetterContent,
        status: 'ISSUED'
      });
      setFeedback('Offer letter issued and automated onboarding tasks provisioned!');
      setIsGenerating(false);
      setActiveOfferId(res.data.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleTask = async (taskId, currentVal) => {
    try {
      await offersApi.updateOnboardingTask(taskId, !currentVal);
      // Refresh checklist
      const res = await offersApi.getOnboarding(activeOfferId);
      setOnboardingData(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Offers & Pre-Hire Onboarding</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Generate formal employment letters and track candidate readiness checklist tasks.
          </p>
        </div>

        <button
          onClick={() => setIsGenerating(!isGenerating)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isGenerating ? 'Cancel' : 'Issue New Employment Offer'}
        </button>
      </div>

      {feedback && (
        <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Offer Generation Dialog */}
      {isGenerating && (
        <div className="my-6 p-6 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Generate Offer Letter (SELECTED Candidates)</h3>
          <form onSubmit={handleGenerateOffer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Candidate *
                </label>
                {selectedCandidates.length > 0 ? (
                  <select
                    value={offerForm.applicationId}
                    onChange={(e) => setOfferForm({ ...offerForm, applicationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {selectedCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.candidate_name} ({c.job_title})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No candidates currently in SELECTED stage. Advance a candidate in the Pipeline first.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Annual Base Salary (USD) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={offerForm.salaryOffered}
                  onChange={(e) => setOfferForm({ ...offerForm, salaryOffered: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={offerForm.joiningDate}
                  onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Offer Letter Content (Markdown)
              </label>
              <textarea
                rows={5}
                required
                value={offerForm.offerLetterContent}
                onChange={(e) => setOfferForm({ ...offerForm, offerLetterContent: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGenerating(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCandidates.length}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Issue Formal Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offer Inspector & Onboarding Checklist */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Offer Details Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Active Offer Overview</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              onboardingData?.offer?.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              onboardingData?.offer?.status === 'ISSUED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              'bg-slate-100 text-slate-600'
            }`}>
              {onboardingData?.offer?.status || 'No Offer'}
            </span>
          </div>

          {onboardingData?.offer ? (
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Candidate</span>
                <span className="text-sm font-semibold text-slate-800">{onboardingData.offer.candidate_name}</span>
                <span className="text-slate-500 block">{onboardingData.offer.job_title}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Compensation</span>
                <span className="text-sm font-bold text-emerald-600">
                  ${parseFloat(onboardingData.offer.salary_offered).toLocaleString()} / year
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Anticipated Start Date</span>
                <span className="font-medium text-slate-800">{onboardingData.offer.joining_date}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Generated Letter Terms</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {onboardingData.offer.offer_letter_content}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading offer metadata...</p>
          )}
        </div>

        {/* Right: Interactive Onboarding Checklist */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900">Pre-Hire Onboarding Checklist</h3>
              <p className="text-xs text-slate-500">Tasks automatically provisioned upon offer issuance.</p>
            </div>
            {onboardingData?.tasks && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {onboardingData.tasks.filter(t => t.is_completed).length} / {onboardingData.tasks.length} Completed
              </span>
            )}
          </div>

          <div className="space-y-3">
            {onboardingData?.tasks?.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id, task.is_completed)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  task.is_completed 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-700' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.is_completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  )}
                  <div>
                    <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.task_title}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      Due: {task.due_date || 'Before first day'}
                    </div>
                  </div>
                </div>

                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  task.is_completed ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                }`}>
                  {task.is_completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferOnboardingPage;

