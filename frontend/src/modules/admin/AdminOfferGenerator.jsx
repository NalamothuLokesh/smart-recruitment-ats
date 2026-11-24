import React, { useState, useEffect, useMemo } from 'react';
import { offersApi, applicationsApi } from '../../api/client';
import {
  Gift,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  X,
  User,
  Briefcase,
  Sparkles,
  Download
} from 'lucide-react';

const DEFAULT_OFFER_TEMPLATE = `# Formal Offer of Employment

Dear {{candidateName}},

NovaTech Innovations Inc. is thrilled to extend this formal offer of employment for the position of **{{jobTitle}}**.

### Compensation & Equity Package
- **Base Salary**: \${{salary}} USD gross per annum (paid bi-weekly)
- **Stock Options**: 10,000 ISO Options under the NovaTech 2026 Equity Incentive Plan
- **Benefits**: Comprehensive medical, dental, vision coverage & 401(k) matching

### Commencement of Employment
Your anticipated start date will be **{{joiningDate}}**.

Please review the terms above and accept this offer via your Smart ATS candidate portal.`;

export const AdminOfferGenerator = ({ className = '' }) => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [existingOffers, setExistingOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  // Offer Form
  const [offerForm, setOfferForm] = useState({
    applicationId: '',
    salaryOffered: 165000,
    joiningDate: '2026-03-01',
    offerLetterContent: DEFAULT_OFFER_TEMPLATE
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [candRes, onbRes] = await Promise.all([
        applicationsApi.listApplications({ stage: 'SELECTED', limit: 30 }).catch(() => ({ data: [] })),
        offersApi.getOnboarding(1).catch(() => null)
      ]);

      setSelectedCandidates(candRes.data || []);
      if (candRes.data?.length > 0 && !offerForm.applicationId) {
        setOfferForm((prev) => ({
          ...prev,
          applicationId: candRes.data[0].id
        }));
      }

      // If seed offer 1 is present, populate existing list
      if (onbRes?.data?.offer) {
        setExistingOffers([onbRes.data.offer]);
      }
    } catch (err) {
      console.error('Failed to load offer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4000);
  };

  const selectedCandidateObj = useMemo(() => {
    return selectedCandidates.find((c) => String(c.id) === String(offerForm.applicationId));
  }, [selectedCandidates, offerForm.applicationId]);

  // Interpolated Preview Text
  const previewMarkdown = useMemo(() => {
    const candName = selectedCandidateObj?.candidate_name || 'Candidate Name';
    const jobTitle = selectedCandidateObj?.job_title || 'Software Engineer';
    const salary = Number(offerForm.salaryOffered || 0).toLocaleString();
    const joinDate = offerForm.joiningDate || 'March 1, 2026';

    return offerForm.offerLetterContent
      .replace(/{{candidateName}}/g, candName)
      .replace(/{{jobTitle}}/g, jobTitle)
      .replace(/{{salary}}/g, salary)
      .replace(/{{joiningDate}}/g, joinDate);
  }, [offerForm, selectedCandidateObj]);

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await offersApi.generateOffer({
        applicationId: parseInt(offerForm.applicationId, 10),
        salaryOffered: parseFloat(offerForm.salaryOffered),
        joiningDate: offerForm.joiningDate,
        offerLetterContent: previewMarkdown,
        status: 'ISSUED'
      });

      showToast('Employment offer successfully issued and onboarding checklist provisioned!');
      setIsGenerating(false);

      if (res.data) {
        setExistingOffers((prev) => [
          {
            ...res.data,
            candidate_name: selectedCandidateObj?.candidate_name || 'New Hire',
            job_title: selectedCandidateObj?.job_title || 'Role',
            candidate_email: selectedCandidateObj?.candidate_email || 'hire@example.com',
            status: 'ISSUED',
            salary_offered: String(offerForm.salaryOffered),
            joining_date: offerForm.joiningDate,
            offer_letter_content: previewMarkdown,
            issued_at: new Date().toISOString()
          },
          ...prev
        ]);
      }
    } catch (err) {
      showToast(err.message || 'Failed to issue employment offer.', 'error');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Action Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Formal Employment Offers & Letter Generator</h2>
          <p className="text-xs text-muted-foreground">
            Draft formal compensation packages, preview markdown contracts, and dispatch offers to SELECTED candidates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsGenerating(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Offer</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedbackMsg.text && (
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between animate-fadeIn ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg({ text: '', type: 'success' })}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Issued Offers List */}
      <div className="admin-table-shell">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Candidate & Position</th>
                <th scope="col">Base Compensation</th>
                <th scope="col">Target Start Date</th>
                <th scope="col">Offer Status</th>
                <th scope="col">Issued Timestamp</th>
                <th scope="col" className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {existingOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <Gift className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <span className="font-semibold text-foreground text-sm">No employment offers issued yet</span>
                    <p className="mt-1">Advance a candidate to the SELECTED column in the Pipeline to issue an offer.</p>
                  </td>
                </tr>
              ) : (
                existingOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-muted/50 transition-colors">
                    <td>
                      <div className="font-semibold text-foreground text-xs sm:text-sm">
                        {offer.candidate_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{offer.job_title}</div>
                    </td>

                    <td className="text-xs font-mono font-semibold text-emerald-400">
                      ${Number(offer.salary_offered).toLocaleString()} USD / yr
                    </td>

                    <td className="text-xs font-mono text-muted-foreground">
                      {offer.joining_date}
                    </td>

                    <td>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          offer.status === 'ACCEPTED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : offer.status === 'ISSUED'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </td>

                    <td className="text-xs text-muted-foreground font-mono">
                      {offer.issued_at ? new Date(offer.issued_at).toLocaleDateString() : '—'}
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setViewingOffer(offer)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Preview Letter</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Generate Offer Modal (With Real-Time Markdown Preview) ─────────── */}
      {isGenerating && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-4xl">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Draft & Issue Formal Employment Offer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerating(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit}>
              <div className="admin-modal-body space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Candidate (SELECTED Stage) *
                    </label>
                    {selectedCandidates.length > 0 ? (
                      <select
                        value={offerForm.applicationId}
                        onChange={(e) => setOfferForm({ ...offerForm, applicationId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                      >
                        {selectedCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.candidate_name} ({c.job_title})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                        No candidate currently in SELECTED stage. Advance a candidate in Kanban first.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Annual Base Salary (USD) *
                    </label>
                    <input
                      type="number"
                      step="1000"
                      required
                      value={offerForm.salaryOffered}
                      onChange={(e) => setOfferForm({ ...offerForm, salaryOffered: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Target Joining Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={offerForm.joiningDate}
                      onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>

                {/* Split-Screen: Editor on Left, Live Rendered Preview on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  {/* Left: Template Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                        Offer Content (Markdown Template)
                      </label>
                      <span className="text-[10px] text-muted-foreground">Tokens: &#123;&#123;candidateName&#125;&#125;, &#123;&#123;salary&#125;&#125;, &#123;&#123;joiningDate&#125;&#125;</span>
                    </div>
                    <textarea
                      rows={10}
                      required
                      value={offerForm.offerLetterContent}
                      onChange={(e) => setOfferForm({ ...offerForm, offerLetterContent: e.target.value })}
                      className="w-full p-3 rounded-lg text-xs font-mono bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    />
                  </div>

                  {/* Right: Real-Time Preview */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Candidate Portal Preview</span>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-border/80 h-[215px] overflow-y-auto text-xs leading-relaxed text-foreground space-y-2 whitespace-pre-wrap font-sans">
                      {previewMarkdown}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsGenerating(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCandidates.length}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Issue Offer Letter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Offer Modal ──────────────────────────────────────────────── */}
      {viewingOffer && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-lg">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Offer Dossier: {viewingOffer.candidate_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingOffer(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="admin-modal-body space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1">Base Salary</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    ${Number(viewingOffer.salary_offered).toLocaleString()} USD
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1">Start Date</span>
                  <span className="font-bold text-foreground font-mono">
                    {viewingOffer.joining_date}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background border border-border text-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {viewingOffer.offer_letter_content}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setViewingOffer(null)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOfferGenerator;
