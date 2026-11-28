import React, { useState, useEffect, useMemo } from 'react';
import { interviewsApi, applicationsApi, adminApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Star,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  X,
  User,
  Briefcase,
  FileCheck2,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  MessageSquare
} from 'lucide-react';

// Helper to serialize structured scorecard into backend's feedbackNotes string
const serializeScorecard = (evalForm) => {
  const payload = {
    technicalRating: Number(evalForm.technicalRating),
    communicationRating: Number(evalForm.communicationRating),
    problemSolvingRating: Number(evalForm.problemSolvingRating),
    recommendation: evalForm.recommendation,
    strengths: evalForm.strengths.trim(),
    improvements: evalForm.improvements.trim(),
    comments: evalForm.comments.trim()
  };
  return `[SCORECARD_V1]${JSON.stringify(payload)}`;
};

// Helper to parse structured scorecard or fallback to plain text
const parseScorecard = (notes) => {
  if (!notes) return null;
  if (notes.startsWith('[SCORECARD_V1]')) {
    try {
      return JSON.parse(notes.slice('[SCORECARD_V1]'.length));
    } catch {
      return { comments: notes };
    }
  }
  return { comments: notes };
};

// Helper to encode/decode Offline location in meeting_link URL
const OFFLINE_PREFIX = 'https://office.novatech.io/in-person?location=';
const isOfflineLink = (link) => typeof link === 'string' && link.startsWith(OFFLINE_PREFIX);
const decodeLocation = (link) => {
  if (!isOfflineLink(link)) return link || '';
  try {
    return decodeURIComponent(link.slice(OFFLINE_PREFIX.length));
  } catch {
    return link;
  }
};
const encodeOfflineLocation = (loc) => `${OFFLINE_PREFIX}${encodeURIComponent(loc.trim() || 'NovaTech HQ')}`;

export const AdminInterviewScheduler = ({ className = '' }) => {
  const { user: currentUser } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [candidatesInInterview, setCandidatesInInterview] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isScheduling, setIsScheduling] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [cancellingInterview, setCancellingInterview] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);
  const [viewingFeedback, setViewingFeedback] = useState(null);

  // Filters
  const [timeScope, setTimeScope] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'PAST'
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  // Schedule / Edit Form State
  const defaultMeetingLink = () => 'https://meet.novatech.io/ats-panel-' + Math.random().toString(36).substring(2, 8);
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    interviewerId: currentUser?.id || '',
    scheduledAt: '',
    durationMinutes: 45,
    mode: 'ONLINE',
    meetingLink: defaultMeetingLink(),
    location: 'NovaTech HQ - Boardroom A',
    notes: ''
  });

  // Evaluation Scorecard State
  const [evalForm, setEvalForm] = useState({
    technicalRating: 5,
    communicationRating: 5,
    problemSolvingRating: 5,
    overallRating: 5,
    strengths: '',
    improvements: '',
    comments: '',
    recommendation: 'SELECTED',
    status: 'COMPLETED'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const promises = [
        interviewsApi.listInterviews().catch(() => ({ data: [] })),
        applicationsApi.listApplications({ stage: 'INTERVIEW', limit: 50 }).catch(() => ({ data: [] }))
      ];
      if (currentUser?.role === 'ADMIN') {
        promises.push(adminApi.getUsers({ limit: 100 }).catch(() => ({ data: [] })));
      }

      const [intRes, appRes, usersRes] = await Promise.all(promises);
      setInterviews(intRes.data || []);
      setCandidatesInInterview(appRes.data || []);

      if (usersRes?.data) {
        const staff = usersRes.data.filter((u) => u.role === 'HR' || u.role === 'ADMIN');
        setInterviewers(staff);
      } else if (currentUser) {
        setInterviewers([{ id: currentUser.id, full_name: currentUser.fullName, role: currentUser.role }]);
      }

      if (appRes.data?.length > 0 && !scheduleForm.applicationId) {
        setScheduleForm((prev) => ({
          ...prev,
          applicationId: appRes.data[0].id,
          interviewerId: prev.interviewerId || currentUser?.id || ''
        }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to load interview schedule.', 'error');
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

  const selectedCandidate = useMemo(
    () => candidatesInInterview.find((c) => String(c.id) === String(scheduleForm.applicationId)),
    [candidatesInInterview, scheduleForm.applicationId]
  );

  // Schedule or Reschedule Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!scheduleForm.scheduledAt) {
      showToast('Please select a valid date and time.', 'error');
      return;
    }

    const linkPayload =
      scheduleForm.mode === 'OFFLINE'
        ? encodeOfflineLocation(scheduleForm.location)
        : scheduleForm.meetingLink.trim();

    if (!linkPayload) {
      showToast('Please provide a valid meeting link or office location.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingInterview) {
        await interviewsApi.updateInterview(editingInterview.id, {
          status: 'RESCHEDULED',
          scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
          meetingLink: linkPayload,
          ...(scheduleForm.notes.trim() ? { feedbackNotes: scheduleForm.notes.trim() } : {})
        });
        showToast('Interview rescheduled and updated successfully.');
        setEditingInterview(null);
      } else {
        await interviewsApi.scheduleInterview({
          applicationId: parseInt(scheduleForm.applicationId, 10),
          scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
          durationMinutes: parseInt(scheduleForm.durationMinutes, 10),
          meetingLink: linkPayload
        });
        showToast('Interview scheduled successfully.');
        setIsScheduling(false);
      }
      setScheduleForm((prev) => ({
        ...prev,
        scheduledAt: '',
        mode: 'ONLINE',
        meetingLink: defaultMeetingLink(),
        location: 'NovaTech HQ - Boardroom A',
        notes: ''
      }));
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save interview schedule.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Interview
  const handleConfirmCancel = async () => {
    if (!cancellingInterview || submitting) return;
    try {
      setSubmitting(true);
      await interviewsApi.updateInterview(cancellingInterview.id, {
        status: 'CANCELLED'
      });
      showToast(`Interview with ${cancellingInterview.candidate_name} cancelled.`);
      setCancellingInterview(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel interview.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Evaluation Scorecard
  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!evaluatingInterview || submitting) return;
    if (!evalForm.comments.trim() && !evalForm.strengths.trim()) {
      showToast('Please enter strengths or interviewer comments before submitting.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const serializedNotes = serializeScorecard(evalForm);
      await interviewsApi.updateInterview(evaluatingInterview.id, {
        status: evalForm.status,
        rating: parseInt(evalForm.overallRating, 10),
        feedbackNotes: serializedNotes
      });
      showToast('Interview scorecard and recommendation saved.');
      setEvaluatingInterview(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit interview evaluation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (item) => {
    const offline = isOfflineLink(item.meeting_link);
    const localDt = item.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : '';
    setEditingInterview(item);
    setScheduleForm({
      applicationId: item.application_id,
      interviewerId: item.interviewer_id || currentUser?.id || '',
      scheduledAt: localDt,
      durationMinutes: item.duration_minutes || 45,
      mode: offline ? 'OFFLINE' : 'ONLINE',
      meetingLink: offline ? defaultMeetingLink() : item.meeting_link || '',
      location: offline ? decodeLocation(item.meeting_link) : 'NovaTech HQ - Boardroom A',
      notes: ''
    });
  };

  const openEvaluateModal = (item) => {
    const parsed = parseScorecard(item.feedback_notes);
    setEvaluatingInterview(item);
    setEvalForm({
      technicalRating: parsed?.technicalRating || item.rating || 5,
      communicationRating: parsed?.communicationRating || item.rating || 5,
      problemSolvingRating: parsed?.problemSolvingRating || item.rating || 5,
      overallRating: item.rating || 5,
      strengths: parsed?.strengths || '',
      improvements: parsed?.improvements || '',
      comments: parsed?.comments || '',
      recommendation: parsed?.recommendation || 'SELECTED',
      status: 'COMPLETED'
    });
  };

  // Update overall rating automatically when sub-ratings change
  const updateSubRating = (field, val) => {
    setEvalForm((prev) => {
      const next = { ...prev, [field]: Number(val) };
      const avg = Math.round((next.technicalRating + next.communicationRating + next.problemSolvingRating) / 3);
      return { ...next, overallRating: Math.min(5, Math.max(1, avg)) };
    });
  };

  const now = new Date();
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const itemDate = new Date(item.scheduled_at);
      if (timeScope === 'UPCOMING') {
        if (itemDate < now && item.status === 'COMPLETED') return false;
        if (item.status === 'CANCELLED' || item.status === 'COMPLETED') return false;
      } else if (timeScope === 'PAST') {
        if (itemDate >= now && item.status !== 'COMPLETED' && item.status !== 'CANCELLED') return false;
      }
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
  }, [interviews, timeScope, statusFilter, searchQuery]);

  const totalCount = interviews.length;
  const upcomingCount = interviews.filter((i) => i.status === 'SCHEDULED' || i.status === 'RESCHEDULED').length;
  const completedCount = interviews.filter((i) => i.status === 'COMPLETED').length;

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
          <p className="text-[11px] text-muted-foreground mt-1">All scheduled, rescheduled & past rounds</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Upcoming / Active</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-400">{upcomingCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Pending panel evaluation</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Completed & Scored</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">{completedCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Scorecards archived on candidate dossier</p>
        </div>
      </div>

      {/* Action Header */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Interview Sessions & Evaluation Panels</h2>
          <p className="text-xs text-muted-foreground">
            Schedule online or in-person interviews, reschedule or cancel sessions, and record structured scorecards.
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
            onClick={() => {
              setEditingInterview(null);
              setScheduleForm({
                applicationId: candidatesInInterview[0]?.id || '',
                interviewerId: currentUser?.id || '',
                scheduledAt: '',
                durationMinutes: 45,
                mode: 'ONLINE',
                meetingLink: defaultMeetingLink(),
                location: 'NovaTech HQ - Boardroom A',
                notes: ''
              });
              setIsScheduling(true);
            }}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Search, Upcoming/Past Tabs & Status Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-muted p-0.5 rounded-lg border border-border text-xs">
            {[
              { id: 'ALL', label: 'All Sessions' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'PAST', label: 'Past & Completed' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeScope(t.id)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  timeScope === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="RESCHEDULED">RESCHEDULED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidate, job, or interviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Interviews Table */}
      <div className="admin-table-shell">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Candidate & Position</th>
                <th scope="col">Schedule & Mode</th>
                <th scope="col">Interviewer</th>
                <th scope="col">Status</th>
                <th scope="col">Evaluation</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    Loading interview schedule...
                  </td>
                </tr>
              ) : filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <span className="font-semibold text-foreground text-sm">No matching interviews found</span>
                    <p className="mt-1">Advance candidates to INTERVIEW stage or adjust your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredInterviews.map((item) => {
                  const offline = isOfflineLink(item.meeting_link);
                  const scorecard = parseScorecard(item.feedback_notes);
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td>
                        <div className="font-semibold text-foreground text-xs sm:text-sm">{item.candidate_name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span>{item.job_title}</span>
                        </div>
                      </td>

                      <td className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-foreground font-mono">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{new Date(item.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] mt-0.5">
                          <span>{item.duration_minutes} min</span>
                          <span>•</span>
                          {offline ? (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <MapPin className="w-3 h-3" />
                              In-Person: {decodeLocation(item.meeting_link)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-indigo-400">
                              <Video className="w-3 h-3" />
                              Online Video
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="text-xs text-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.interviewer_name || 'Assigned Interviewer'}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : item.status === 'SCHEDULED'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : item.status === 'RESCHEDULED'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        {item.rating ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{item.rating} / 5</span>
                              {scorecard?.recommendation && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    scorecard.recommendation === 'SELECTED'
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : scorecard.recommendation === 'REJECTED'
                                      ? 'bg-rose-500/15 text-rose-400'
                                      : 'bg-amber-500/15 text-amber-400'
                                  }`}
                                >
                                  {scorecard.recommendation.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Pending Scorecard</span>
                        )}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {!offline && item.status !== 'CANCELLED' && (
                            <a
                              href={item.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1"
                              title="Join Video Room"
                            >
                              <Video className="w-3 h-3 text-primary" />
                              <span>Join</span>
                            </a>
                          )}

                          {item.feedback_notes && (
                            <button
                              type="button"
                              onClick={() => setViewingFeedback(item)}
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1"
                              title="View Detailed Feedback"
                            >
                              <Eye className="w-3 h-3 text-indigo-400" />
                              <span>View</span>
                            </button>
                          )}

                          {item.status !== 'CANCELLED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="px-2 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1"
                                title="Edit / Reschedule"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEvaluateModal(item)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center gap-1"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>{item.rating ? 'Edit' : 'Scorecard'}</span>
                              </button>

                              {item.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => setCancellingInterview(item)}
                                  className="px-2 py-1 text-xs font-medium rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                                  title="Cancel Interview"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Schedule / Edit Interview Modal ────────────────────────────────── */}
      {(isScheduling || editingInterview) && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-lg">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {editingInterview ? 'Reschedule Interview Session' : 'Schedule Candidate Interview'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScheduling(false);
                  setEditingInterview(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="admin-modal-body space-y-4">
                {editingInterview ? (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                    <div className="font-bold text-foreground">{editingInterview.candidate_name}</div>
                    <div className="text-muted-foreground mt-0.5">Position: {editingInterview.job_title}</div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Candidate & Job Position (INTERVIEW stage) *
                    </label>
                    {candidatesInInterview.length > 0 ? (
                      <>
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
                        {selectedCandidate && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Position: <strong className="text-foreground">{selectedCandidate.job_title}</strong> • {selectedCandidate.candidate_email}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                        No candidates currently in INTERVIEW stage. Advance an applicant in the Kanban Pipeline first.
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Interviewer
                    </label>
                    <select
                      value={scheduleForm.interviewerId}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, interviewerId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    >
                      {interviewers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Backend records active logged-in staff as organizer.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Duration
                    </label>
                    <select
                      value={scheduleForm.durationMinutes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: e.target.value })}
                      disabled={Boolean(editingInterview)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    >
                      <option value={30}>30 Minutes (Screen)</option>
                      <option value={45}>45 Minutes (Standard)</option>
                      <option value={60}>60 Minutes (Deep Dive)</option>
                      <option value={90}>90 Minutes (Panel)</option>
                    </select>
                  </div>
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
                      Interview Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setScheduleForm({ ...scheduleForm, mode: 'ONLINE' })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                          scheduleForm.mode === 'ONLINE'
                            ? 'bg-primary/15 border-primary text-primary'
                            : 'bg-card border-border text-muted-foreground'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" /> Online
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleForm({ ...scheduleForm, mode: 'OFFLINE' })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                          scheduleForm.mode === 'OFFLINE'
                            ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                            : 'bg-card border-border text-muted-foreground'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" /> Offline
                      </button>
                    </div>
                  </div>
                </div>

                {scheduleForm.mode === 'ONLINE' ? (
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
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Office / Interview Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={scheduleForm.location}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                      placeholder="e.g. NovaTech HQ, Floor 4, Room B"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                    Interview Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    placeholder="Agenda, focus areas, or preparation instructions..."
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduling(false);
                    setEditingInterview(null);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!editingInterview && candidatesInInterview.length === 0)}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{submitting ? 'Saving...' : editingInterview ? 'Save Reschedule' : 'Confirm & Book'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Structured Evaluation Scorecard Modal ──────────────────────────── */}
      {evaluatingInterview && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-xl">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                <h3 className="text-base font-bold text-foreground">Structured Interview Feedback Scorecard</h3>
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
              <div className="admin-modal-body space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-foreground">{evaluatingInterview.candidate_name}</div>
                    <div className="text-muted-foreground">{evaluatingInterview.job_title}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Overall Score</span>
                    <span className="text-lg font-extrabold text-amber-400">{evalForm.overallRating} / 5</span>
                  </div>
                </div>

                {/* 3 Competency Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'technicalRating', label: 'Technical Skills' },
                    { key: 'communicationRating', label: 'Communication' },
                    { key: 'problemSolvingRating', label: 'Problem-Solving' }
                  ].map((metric) => (
                    <div key={metric.key} className="p-2.5 rounded-xl bg-background border border-border">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        {metric.label}
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateSubRating(metric.key, star)}
                            className={`p-1 rounded transition-colors ${
                              evalForm[metric.key] >= star ? 'text-amber-400' : 'text-muted-foreground/30'
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Overall Rating (1–5) *
                    </label>
                    <select
                      value={evalForm.overallRating}
                      onChange={(e) => setEvalForm({ ...evalForm, overallRating: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-card border border-border text-foreground"
                    >
                      <option value={5}>5 — Exceptional (Strong Hire)</option>
                      <option value={4}>4 — Strong Fit (Hire)</option>
                      <option value={3}>3 — Meets Bar (On Hold / Neutral)</option>
                      <option value={2}>2 — Below Bar (No Hire)</option>
                      <option value={1}>1 — Poor Fit (Strong No Hire)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Hiring Recommendation *
                    </label>
                    <select
                      value={evalForm.recommendation}
                      onChange={(e) => setEvalForm({ ...evalForm, recommendation: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-card border border-border text-foreground"
                    >
                      <option value="SELECTED">Selected (Advance / Offer)</option>
                      <option value="ON_HOLD">On Hold (Needs Second Round)</option>
                      <option value="REJECTED">Rejected (Do Not Advance)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Key Strengths
                    </label>
                    <textarea
                      rows={2}
                      value={evalForm.strengths}
                      onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                      placeholder="System architecture, clean code, clarity..."
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Areas for Improvement
                    </label>
                    <textarea
                      rows={2}
                      value={evalForm.improvements}
                      onChange={(e) => setEvalForm({ ...evalForm, improvements: e.target.value })}
                      placeholder="Edge case handling, concurrency depth..."
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                    Interviewer Comments *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={evalForm.comments}
                    onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
                    placeholder="Detailed summary of interview discussion and final decision rationale..."
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setEvaluatingInterview(null)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{submitting ? 'Submitting...' : 'Submit Scorecard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Detailed Feedback Modal ───────────────────────────────────── */}
      {viewingFeedback && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-lg">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Interview Evaluation Report</h3>
              </div>
              <button type="button" onClick={() => setViewingFeedback(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="admin-modal-body space-y-4">
              {(() => {
                const parsed = parseScorecard(viewingFeedback.feedback_notes);
                return (
                  <>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-foreground">{viewingFeedback.candidate_name}</div>
                        <div className="text-muted-foreground">{viewingFeedback.job_title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold text-sm">{viewingFeedback.rating || '—'} / 5 Overall</div>
                        {parsed?.recommendation && (
                          <span className="text-[11px] font-bold text-primary">{parsed.recommendation}</span>
                        )}
                      </div>
                    </div>

                    {parsed?.technicalRating && (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <div className="text-muted-foreground text-[10px] uppercase">Technical</div>
                          <div className="font-bold text-foreground mt-0.5">{parsed.technicalRating} / 5</div>
                        </div>
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <div className="text-muted-foreground text-[10px] uppercase">Communication</div>
                          <div className="font-bold text-foreground mt-0.5">{parsed.communicationRating} / 5</div>
                        </div>
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <div className="text-muted-foreground text-[10px] uppercase">Problem Solving</div>
                          <div className="font-bold text-foreground mt-0.5">{parsed.problemSolvingRating} / 5</div>
                        </div>
                      </div>
                    )}

                    {parsed?.strengths && (
                      <div>
                        <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1">Strengths</div>
                        <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-foreground">
                          {parsed.strengths}
                        </div>
                      </div>
                    )}
                    {parsed?.improvements && (
                      <div>
                        <div className="text-[11px] font-bold uppercase text-amber-400 mb-1">Improvements</div>
                        <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-foreground">
                          {parsed.improvements}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] font-bold uppercase text-muted-foreground mb-1">Interviewer Comments</div>
                      <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-foreground whitespace-pre-wrap">
                        {parsed?.comments || viewingFeedback.feedback_notes}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="admin-modal-footer">
              <button type="button" onClick={() => setViewingFeedback(null)} className="btn btn-outline btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ──────────────────────────────────────── */}
      {cancellingInterview && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog max-w-md">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-base font-bold">Cancel Interview Session?</h3>
              </div>
              <button type="button" onClick={() => setCancellingInterview(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="admin-modal-body text-xs text-muted-foreground space-y-2">
              <p>
                Are you sure you want to cancel the scheduled interview for{' '}
                <strong className="text-foreground">{cancellingInterview.candidate_name}</strong> ({cancellingInterview.job_title})?
              </p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" onClick={() => setCancellingInterview(null)} className="btn btn-outline btn-sm">
                Keep Interview
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={submitting}
                className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white"
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInterviewScheduler;
