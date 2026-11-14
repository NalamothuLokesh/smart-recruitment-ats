import React, { useState, useEffect } from 'react';
import { interviewsApi, applicationsApi } from '../../api/client';
import { Calendar, Clock, Video, Star, CheckCircle, XCircle, Plus, AlertCircle } from 'lucide-react';

/**
 * ============================================================================
 * MODULE: InterviewSchedulerPage.jsx
 * ASSIGNED TO: // TODO: [Teammate 4: Interviews & Offers Specialist]
 * 
 * RESPONSIBILITIES:
 * 1. Interview Scheduling Dialog: Select candidate application, date/time, duration, video link.
 * 2. Scheduled Interviews Calendar / List View with status filtering.
 * 3. Evaluation & Rating Panel: Submit 1-5 star ratings and detailed interviewer feedback notes.
 * 4. Interview Status Lifecycle: Reschedule, Cancel, or Complete.
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - interviewsApi.listInterviews({ status, applicationId })
 * - interviewsApi.scheduleInterview(payload)
 * - interviewsApi.updateInterview(interviewId, payload)
 * - applicationsApi.listApplications({ stage: 'INTERVIEW' })
 * ============================================================================
 */
export const InterviewSchedulerPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [candidatesInInterview, setCandidatesInInterview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);
  const [feedback, setFeedback] = useState('');

  // Scheduling Form
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    scheduledAt: '',
    durationMinutes: 45,
    meetingLink: 'https://meet.novatech.io/ats-' + Math.random().toString(36).substring(7)
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
        interviewsApi.listInterviews(),
        applicationsApi.listApplications({ stage: 'INTERVIEW', limit: 50 })
      ]);
      setInterviews(intRes.data || []);
      setCandidatesInInterview(appRes.data || []);
      if (appRes.data?.length > 0 && !scheduleForm.applicationId) {
        setScheduleForm(prev => ({ ...prev, applicationId: appRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await interviewsApi.scheduleInterview({
        applicationId: parseInt(scheduleForm.applicationId, 10),
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        durationMinutes: parseInt(scheduleForm.durationMinutes, 10),
        meetingLink: scheduleForm.meetingLink
      });
      setFeedback('Interview scheduled successfully and invitation dispatched.');
      setIsScheduling(false);
      loadData();
    } catch (err) {
      alert(err.message);
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
      setFeedback('Interview evaluation & scorecard recorded.');
      setEvaluatingInterview(null);
      loadData();
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
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Scheduling & Evaluations</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate virtual interviews, generate video room links, and collect structured panel feedback.
          </p>
        </div>

        <button
          onClick={() => setIsScheduling(!isScheduling)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isScheduling ? 'Cancel Scheduling' : 'Schedule New Interview'}
        </button>
      </div>

      {feedback && (
        <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Scheduling Panel */}
      {isScheduling && (
        <div className="my-6 p-6 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Book Candidate Interview</h3>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate (Active Interview Stage) *
                </label>
                {candidatesInInterview.length > 0 ? (
                  <select
                    value={scheduleForm.applicationId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, applicationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {candidatesInInterview.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.candidate_name} — {c.job_title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No candidates currently in INTERVIEW stage. Advance a candidate in the Pipeline Board first.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                <select
                  value={scheduleForm.durationMinutes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (Technical Deep Dive)</option>
                  <option value={90}>90 Minutes (System Design Panel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link *</label>
                <input
                  type="url"
                  required
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsScheduling(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!candidatesInInterview.length}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Confirm Interview
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interviews Table */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="py-3 px-4 text-left">Candidate & Requisition</th>
              <th className="py-3 px-4 text-left">Scheduled Time</th>
              <th className="py-3 px-4 text-left">Interviewer</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Evaluation</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {interviews.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{item.candidate_name}</div>
                  <div className="text-xs text-slate-500">{item.job_title}</div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(item.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.duration_minutes} mins</div>
                </td>
                <td className="py-3 px-4 text-slate-700 text-xs">
                  {item.interviewer_name}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs">
                  {item.rating ? (
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{item.rating} / 5</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Pending Evaluation</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <a
                    href={item.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                  >
                    <Video className="w-3 h-3 text-indigo-600" />
                    Join Link
                  </a>
                  <button
                    onClick={() => {
                      setEvaluatingInterview(item);
                      setEvalForm({
                        rating: item.rating || 5,
                        feedbackNotes: item.feedback_notes || '',
                        status: 'COMPLETED'
                      });
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold"
                  >
                    Scorecard
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evaluation Scorecard Modal */}
      {evaluatingInterview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Submit Scorecard: {evaluatingInterview.candidate_name}
            </h3>

            <form onSubmit={handleEvaluationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Rating (1 - 5)</label>
                <select
                  value={evalForm.rating}
                  onChange={(e) => setEvalForm({ ...evalForm, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value={5}>5 - Strong Hire (Exceeds Bar)</option>
                  <option value={4}>4 - Hire (Meets Bar)</option>
                  <option value={3}>3 - Neutral / Leaning Hire</option>
                  <option value={2}>2 - Leaning No Hire</option>
                  <option value={1}>1 - Strong No Hire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interviewer Feedback Notes *</label>
                <textarea
                  rows={4}
                  required
                  value={evalForm.feedbackNotes}
                  onChange={(e) => setEvalForm({ ...evalForm, feedbackNotes: e.target.value })}
                  placeholder="System design performance, code structure, communication, strengths and risks..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingInterview(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Scorecard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSchedulerPage;

