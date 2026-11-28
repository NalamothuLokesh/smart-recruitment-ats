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
  Download,
  Printer,
  Search,
  Loader2
} from 'lucide-react';

const DEFAULT_TERMS = `1. Employment is at-will and contingent upon successful verification of identity, educational credentials, and background check.
2. You agree to execute the company's Confidentiality and Intellectual Property Assignment Agreement prior to your start date.
3. This offer remains valid until the expiration date specified above.`;

const DEFAULT_OFFER_TEMPLATE = `# Formal Offer of Employment

Dear {{candidateName}},

NovaTech Innovations Inc. is thrilled to extend this formal offer of employment for the position of **{{jobTitle}}** ({{employmentType}}).

### Compensation & Benefits Package
- **Base Salary**: \${{salary}} USD gross per annum
- **Employment Type**: {{employmentType}}
- **Anticipated Start Date**: {{joiningDate}}
- **Offer Valid Until**: {{offerValidity}}

### Terms & Conditions
{{terms}}

Please review the terms above and submit your decision via your Smart ATS candidate portal.`;

export const AdminOfferGenerator = ({ className = '' }) => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [existingOffers, setExistingOffers] = useState([]);
  const [lookupId, setLookupId] = useState('1');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  const defaultValidity = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [offerForm, setOfferForm] = useState({
    applicationId: '',
    salaryOffered: 165000,
    joiningDate: '2026-03-01',
    offerValidity: defaultValidity(),
    employmentType: 'Full-Time',
    status: 'ISSUED',
    terms: DEFAULT_TERMS,
    offerLetterContent: DEFAULT_OFFER_TEMPLATE
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [candRes, onbRes] = await Promise.all([
        applicationsApi.listApplications({ stage: 'SELECTED', limit: 30 }).catch(() => ({ data: [] })),
        offersApi.getOnboarding(lookupId || 1).catch(() => null)
      ]);

      setSelectedCandidates(candRes.data || []);
      if (candRes.data?.length > 0 && !offerForm.applicationId) {
        setOfferForm((prev) => ({
          ...prev,
          applicationId: candRes.data[0].id
        }));
      }

      if (onbRes?.data?.offer) {
        setExistingOffers((prev) => {
          const exists = prev.some((o) => o.id === onbRes.data.offer.id);
          return exists
            ? prev.map((o) => (o.id === onbRes.data.offer.id ? onbRes.data.offer : o))
            : [onbRes.data.offer, ...prev];
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to load offer data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4500);
  };

  const selectedCandidateObj = useMemo(() => {
    return selectedCandidates.find((c) => String(c.id) === String(offerForm.applicationId));
  }, [selectedCandidates, offerForm.applicationId]);

  const previewMarkdown = useMemo(() => {
    const candName = selectedCandidateObj?.candidate_name || 'Candidate Name';
    const jobTitle = selectedCandidateObj?.job_title || 'Software Engineer';
    const salary = Number(offerForm.salaryOffered || 0).toLocaleString();
    const joinDate = offerForm.joiningDate || 'TBD';
    const validity = offerForm.offerValidity || 'TBD';

    return offerForm.offerLetterContent
      .replace(/{{candidateName}}/g, candName)
      .replace(/{{jobTitle}}/g, jobTitle)
      .replace(/{{salary}}/g, salary)
      .replace(/{{joiningDate}}/g, joinDate)
      .replace(/{{offerValidity}}/g, validity)
      .replace(/{{employmentType}}/g, offerForm.employmentType)
      .replace(/{{terms}}/g, offerForm.terms);
  }, [offerForm, selectedCandidateObj]);

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!offerForm.applicationId) {
      showToast('Please select a SELECTED candidate first.', 'error');
      return;
    }
    if (!offerForm.salaryOffered || Number(offerForm.salaryOffered) < 1000) {
      showToast('Offered salary must be at least $1,000.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await offersApi.generateOffer({
        applicationId: parseInt(offerForm.applicationId, 10),
        salaryOffered: parseFloat(offerForm.salaryOffered),
        joiningDate: offerForm.joiningDate,
        offerLetterContent: previewMarkdown,
        status: offerForm.status
      });

      showToast(
        offerForm.status === 'ISSUED'
          ? 'Employment offer issued and onboarding checklist provisioned!'
          : 'Employment offer saved as DRAFT.'
      );
      setIsGenerating(false);

      if (res.data) {
        setExistingOffers((prev) => [
          {
            ...res.data,
            candidate_name: selectedCandidateObj?.candidate_name || 'New Hire',
            job_title: selectedCandidateObj?.job_title || 'Role',
            candidate_email: selectedCandidateObj?.candidate_email || 'hire@example.com',
            status: offerForm.status,
            salary_offered: String(offerForm.salaryOffered),
            joining_date: offerForm.joiningDate,
            offer_letter_content: previewMarkdown,
            issued_at: new Date().toISOString()
          },
          ...prev
        ]);
      }
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to generate employment offer.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupOffer = async (e) => {
    e.preventDefault();
    if (!lookupId) return;
    try {
      const res = await offersApi.getOnboarding(lookupId);
      if (res?.data?.offer) {
        setExistingOffers((prev) => {
          const exists = prev.some((o) => o.id === res.data.offer.id);
          return exists
            ? prev.map((o) => (o.id === res.data.offer.id ? res.data.offer : o))
            : [res.data.offer, ...prev];
        });
        showToast(`Loaded Offer #${res.data.offer.id} (${res.data.offer.candidate_name}).`);
      }
    } catch (err) {
      showToast(err.message || `Offer #${lookupId} not found.`, 'error');
    }
  };

  const handlePrintPdf = (offerObj, contentText) => {
    const win = window.open('', '_blank', 'width=850,height=900');
    if (!win) {
      showToast('Pop-up blocked. Please allow pop-ups to print/save PDF.', 'error');
      return;
    }
    const escaped = (contentText || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^# (.*$)/gim, '<h1 style="color:#312e81;margin-bottom:8px;">$1</h1>')
      .replace(/^### (.*$)/gim, '<h3 style="color:#4338ca;margin-top:20px;margin-bottom:8px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li style="margin-left:18px;margin-bottom:4px;">$1</li>')
      .replace(/\n/g, '<br/>');

    win.document.write(`
      <html>
        <head>
          <title>Offer Letter - ${offerObj?.candidate_name || 'Candidate'}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 48px; color: #1e293b; line-height: 1.6; max-width: 780px; margin: auto; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
            .brand { font-size: 20px; font-weight: 800; color: #4f46e5; }
            .meta { font-size: 12px; color: #64748b; text-align: right; }
            .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">NovaTech Innovations Inc.</div>
            <div class="meta">Offer ID: #${offerObj?.id || 'NEW'}<br/>Status: ${offerObj?.status || 'ISSUED'}</div>
          </div>
          <div>${escaped}</div>
          <div class="footer">Generated via Smart ATS Enterprise Recruitment Console</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const handleDownloadMarkdown = (offerObj, contentText) => {
    const blob = new Blob([contentText || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer-letter-${(offerObj?.candidate_name || 'candidate').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple formatted renderer for dark UI preview
  const renderFormattedPreview = (text) => {
    return (text || '').split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h3 key={i} className="text-lg font-extrabold text-foreground mb-2">{line.slice(2)}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-bold text-primary mt-4 mb-1.5">{line.slice(4)}</h4>;
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 text-xs text-foreground/90 ml-2 my-1">
            <span className="text-primary font-bold">•</span>
            <span>{line.slice(2).replace(/\*\*/g, '')}</span>
          </div>
        );
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-xs text-foreground/90 leading-relaxed">{line.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Action Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Formal Employment Offers & Letter Generator</h2>
          <p className="text-xs text-muted-foreground">
            Draft compensation packages, validity terms, live letter previews, and PDF/Markdown exports for SELECTED candidates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleLookupOffer} className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Offer ID"
              className="w-20 px-2.5 py-1.5 rounded-lg text-xs bg-background border border-border text-foreground"
            />
            <button type="submit" className="btn btn-outline btn-sm flex items-center gap-1" title="Fetch Offer by ID">
              <Search className="w-3.5 h-3.5" />
              <span>Load #</span>
            </button>
          </form>

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

      {feedbackMsg.text && (
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between animate-fadeIn ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button type="button" onClick={() => setFeedbackMsg({ text: '', type: 'success' })} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Existing Offers Table */}
      <div className="admin-table-shell">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Issued & Drafted Offers</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedCandidates.length} candidate(s) eligible in SELECTED stage
          </span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Offer ID</th>
                <th scope="col">Candidate & Position</th>
                <th scope="col">Compensation</th>
                <th scope="col">Joining Date</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {existingOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <Gift className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <span className="font-semibold text-foreground text-sm">No offers loaded</span>
                    <p className="mt-1">Generate a new offer or enter an Offer ID above to inspect.</p>
                  </td>
                </tr>
              ) : (
                existingOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-muted/50 transition-colors">
                    <td className="font-mono text-xs text-muted-foreground">#{offer.id}</td>
                    <td>
                      <div className="font-semibold text-foreground text-xs sm:text-sm">{offer.candidate_name}</div>
                      <div className="text-[11px] text-muted-foreground">{offer.job_title}</div>
                    </td>
                    <td className="font-mono text-xs font-bold text-emerald-400">
                      ${Number(offer.salary_offered || 0).toLocaleString()} / yr
                    </td>
                    <td className="text-xs text-muted-foreground font-mono">
                      {offer.joining_date ? new Date(offer.joining_date).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          offer.status === 'ACCEPTED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : offer.status === 'ISSUED'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : offer.status === 'DECLINED'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {offer.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3" />}
                        {offer.status === 'ISSUED' && <Clock className="w-3 h-3" />}
                        {offer.status === 'DECLINED' && <XCircle className="w-3 h-3" />}
                        <span>{offer.status}</span>
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingOffer(offer)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintPdf(offer, offer.offer_letter_content)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all inline-flex items-center gap-1"
                          title="Print / Save as PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-400" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Generate Offer Modal with Live Split-Screen Preview ────────────── */}
      {isGenerating && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-5xl">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Draft & Preview Employment Offer</h3>
              </div>
              <button type="button" onClick={() => setIsGenerating(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit}>
              <div className="admin-modal-body grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
                {/* Left: Configuration Form */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Target Candidate (SELECTED Stage) *
                    </label>
                    {selectedCandidates.length > 0 ? (
                      <>
                        <select
                          value={offerForm.applicationId}
                          onChange={(e) => setOfferForm({ ...offerForm, applicationId: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                        >
                          {selectedCandidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.candidate_name} — {c.job_title}
                            </option>
                          ))}
                        </select>
                        {selectedCandidateObj && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Email: {selectedCandidateObj.candidate_email} • Position: <strong className="text-foreground">{selectedCandidateObj.job_title}</strong>
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                        No candidates in SELECTED stage. Advance a candidate in the Kanban Pipeline first.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                        Offered Salary (USD) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={offerForm.salaryOffered}
                        onChange={(e) => setOfferForm({ ...offerForm, salaryOffered: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                        Employment Type *
                      </label>
                      <select
                        value={offerForm.employmentType}
                        onChange={(e) => setOfferForm({ ...offerForm, employmentType: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground"
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                        Joining Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={offerForm.joiningDate}
                        onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg text-xs bg-card border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                        Offer Validity *
                      </label>
                      <input
                        type="date"
                        required
                        value={offerForm.offerValidity}
                        onChange={(e) => setOfferForm({ ...offerForm, offerValidity: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg text-xs bg-card border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                        Initial Status
                      </label>
                      <select
                        value={offerForm.status}
                        onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg text-xs bg-card border border-border text-foreground"
                      >
                        <option value="ISSUED">ISSUED</option>
                        <option value="DRAFT">DRAFT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Terms & Conditions
                    </label>
                    <textarea
                      rows={3}
                      value={offerForm.terms}
                      onChange={(e) => setOfferForm({ ...offerForm, terms: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Offer Template (Markdown)
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={offerForm.offerLetterContent}
                      onChange={(e) => setOfferForm({ ...offerForm, offerLetterContent: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-card border border-border text-foreground"
                    />
                  </div>
                </div>

                {/* Right: Formatted Letter Preview */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Live Formatted Offer Preview</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePrintPdf({ candidate_name: selectedCandidateObj?.candidate_name, status: offerForm.status }, previewMarkdown)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> Print / Save PDF
                    </button>
                  </div>
                  <div className="flex-1 p-6 rounded-xl bg-background border border-border overflow-y-auto shadow-inner space-y-1">
                    <div className="pb-3 mb-3 border-b border-border flex justify-between items-center text-[11px] text-muted-foreground">
                      <span className="font-bold text-primary">NOVATECH INNOVATIONS INC.</span>
                      <span>OFFICIAL EMPLOYMENT OFFER</span>
                    </div>
                    {renderFormattedPreview(previewMarkdown)}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsGenerating(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedCandidates.length === 0}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                  <span>{submitting ? 'Generating...' : offerForm.status === 'ISSUED' ? 'Issue Offer & Provision Onboarding' : 'Save Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Offer Modal ───────────────────────────────────────────────── */}
      {viewingOffer && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-2xl">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Offer Dossier — {viewingOffer.candidate_name}</h3>
              </div>
              <button type="button" onClick={() => setViewingOffer(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="admin-modal-body space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs p-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground block">Position</span>
                  <span className="font-bold text-foreground">{viewingOffer.job_title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Annual Salary</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ${Number(viewingOffer.salary_offered || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className="font-bold text-primary">{viewingOffer.status}</span>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-background border border-border max-h-96 overflow-y-auto space-y-1">
                {renderFormattedPreview(viewingOffer.offer_letter_content)}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => handleDownloadMarkdown(viewingOffer, viewingOffer.offer_letter_content)}
                className="btn btn-outline btn-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download .md
              </button>
              <button
                type="button"
                onClick={() => handlePrintPdf(viewingOffer, viewingOffer.offer_letter_content)}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOfferGenerator;
