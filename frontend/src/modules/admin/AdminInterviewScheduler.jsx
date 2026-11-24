import React, { useState, useEffect, useMemo } from 'react';
import { interviewsApi, applicationsApi } from '../../api/client';
import {
  Calendar,
  Clock,
  Video,
  Star,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  X,
  ExternalLink,
  User,
  Briefcase,
  AlertCircle,
  FileCheck2,
  Copy,
  Check
} from 'lucide-react';

export const AdminInterviewScheduler = ({ className = '' }) => {
  const [interviews, setInterviews] = useState([]);
  const [candidatesInInterview, setCandidatesInInterview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);

  // Scheduling Form
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    scheduledAt: '',
    durationMinutes: 45,
    meetingLink: 'https://meet.novatech.io/ats-panel-' + Math.random().toString(36).substring(7)
  });

  // Evaluation Form
  const [evalForm, setEvalForm] = useState({
    rating: 5,
    feedbackNotes: '',
    status: 'COMPLETED'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [intRes, appRes] = await Promise.all([
        interviewsApi.listInterviews().catch(() => ({ data: [] })),
        applicationsApi.listApplications({ stage: 'INTERVIEW', limit: 50 }).catch(() => ({ data: [] }))
      ]);
      setInterviews(intRes.data || []);
      setCandidatesInInterview(appRes.data || []);
      if (appRes.data?.length > 0 && !scheduleForm.applicationId) {
        setScheduleForm((prev) => ({ ...prev, applicationId: appRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load interview data:', err);
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

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await interviewsApi.scheduleInterview({
        applicationId: parseInt(scheduleForm.applicationId, 10),
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        durationMinutes: parseInt(scheduleForm.durationMinutes, 10),
        meetingLink: scheduleForm.meetingLink
      });
      showToast('Interview successfully booked and virtual invite dispatched.');
      setIsScheduling(false);
      setScheduleForm({
        applicationId: candidatesInInterview[0]?.id || '',
        scheduledAt: '',
        durationMinutes: 45,
        meetingLink: 'https://meet.novatech.io/ats-panel-' + Math.random().toString(36).substring(7)
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to schedule interview.', 'error');
    }
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    try {
      await interviewsApi.updateInterview(evaluatingInterview.id, {
        status: evalForm.status,
        rating: parseInt(evalForm.rating, 10),
        feedbackNotes: evalForm.feedbackNotes
      });
      showToast('Evaluation scorecard and candidate rating recorded successfully.');
      setEvaluatingInterview(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit scorecard evaluation.', 'error');
    }
  };

  // Filtered Interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const candMatch = (item.candidate_name || '').toLowerCase().includes(q);
        const jobMatch = (item.job_title || '').toLowerCase().includes(q);
        const intMatch = (item.interviewer_name || '').toLowerCase().includes(q);
        if (!candMatch && !jobMatch && !intMatch) return false;
      }
      return true;
    });
  }, [interviews, statusFilter, searchQuery]);

  const totalCount = interviews.length;
  const completedCount = interviews.filter((i) => i.status === 'COMPLETED').length;
  const scheduledCount = interviews.filter((i) => i.status === 'SCHEDULED').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Executive KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Total Sessions</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Booked technical & behavioral rounds</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Upcoming / Scheduled</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-400">{scheduledCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Pending panel evaluation</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Completed & Scored</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">{completedCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Scorecards archived in candidate profile</p>
        </div>
      </div>

      {/* Action Header & Feedback Notification */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Interview Sessions & Evaluation Panels</h2>
          <p className="text-xs text-muted-foreground">
            Schedule candidate discussions, assign interviewers, and review panel scorecards.
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
            onClick={() => setIsScheduling(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* Dismissible Feedback Banner */}
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidate, job, or interviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All Session Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Interviews Table */}
      <div className="admin-table-shell">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Candidate & Requisition</th>
                <th scope="col">Scheduled Time</th>
                <th scope="col">Interviewer</th>
                <th scope="col">Status</th>
                <th scope="col">Panel Rating</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <span className="font-semibold text-foreground text-sm">No interviews scheduled yet</span>
                    <p className="mt-1">Advance candidates to the INTERVIEW stage and click Schedule Interview above.</p>
                  </td>
                </tr>
              ) : (
                filteredInterviews.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td>
                      <div className="font-semibold text-foreground text-xs sm:text-sm">
                        {item.candidate_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{item.job_title}</div>
                    </td>

                    <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{new Date(item.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{item.duration_minutes} minutes duration</span>
                    </td>

                    <td className="text-xs text-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.interviewer_name || 'Designated Interviewer'}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.status === 'SCHEDULED'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {item.rating ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{item.rating} / 5</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            ({item.rating >= 4 ? 'Hire' : item.rating === 3 ? 'Neutral' : 'No Hire'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Pending Scorecard</span>
                      )}
                    </td>

                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <a
                          href={item.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1"
                        >
                          <Video className="w-3 h-3 text-primary" />
                          <span>Join Room</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setEvaluatingInterview(item);
                            setEvalForm({
                              rating: item.rating || 5,
                              feedbackNotes: item.feedback_notes || '',
                              status: 'COMPLETED'
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center gap-1"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>{item.rating ? 'Edit Scorecard' : 'Scorecard'}</span>
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

      {/* ── Schedule Interview Modal ──────────────────────────────────────── */}
      {isScheduling && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-lg">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Book Candidate Interview</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduling(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="admin-modal-body space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                    Candidate (Active in INTERVIEW stage) *
                  </label>
                  {candidatesInInterview.length > 0 ? (
                    <select
                      value={scheduleForm.applicationId}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, applicationId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      {candidatesInInterview.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.candidate_name} — {c.job_title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                      No candidates currently in INTERVIEW stage. Advance an applicant in the Kanban Pipeline Board first.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduleForm.scheduledAt}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Duration
                    </label>
                    <select
                      value={scheduleForm.durationMinutes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={30}>30 Minutes (Screen)</option>
                      <option value={45}>45 Minutes (Standard)</option>
                      <option value={60}>60 Minutes (Deep Dive)</option>
                      <option value={90}>90 Minutes (Panel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                    Virtual Meeting Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!candidatesInInterview.length}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Evaluation Scorecard Modal ────────────────────────────────────── */}
      {evaluatingInterview && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-lg">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-bold text-foreground">
                  Scorecard: {evaluatingInterview.candidate_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingInterview(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEvaluationSubmit}>
              <div className="admin-modal-body space-y-4">
                <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs">
                  <span className="text-muted-foreground block">Position Requisition:</span>
                  <span className="font-semibold text-foreground">{evaluatingInterview.job_title}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Overall Candidate Rating (1 - 5 Stars) *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEvalForm({ ...evalForm, rating: star })}
                        className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= evalForm.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-xs font-bold text-foreground">
                      {evalForm.rating === 5 && '5 - Strong Hire (Exceeds Bar)'}
                      {evalForm.rating === 4 && '4 - Hire (Meets Bar)'}
                      {evalForm.rating === 3 && '3 - Neutral / Leaning'}
                      {evalForm.rating === 2 && '2 - Leaning No Hire'}
                      {evalForm.rating === 1 && '1 - Strong No Hire'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                    Interviewer Structured Feedback Notes *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={evalForm.feedbackNotes}
                    onChange={(e) => setEvalForm({ ...evalForm, feedbackNotes: e.target.value })}
                    placeholder="Document architecture performance, code clarity, system design reasoning, strengths, and any flags..."
                    className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                    Session Completion Status
                  </label>
                  <select
                    value={evalForm.status}
                    onChange={(e) => setEvalForm({ ...evalForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="COMPLETED">COMPLETED (Scorecard Finalized)</option>
                    <option value="SCHEDULED">SCHEDULED (Keep Open for Updates)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setEvaluatingInterview(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Scorecard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInterviewScheduler;
