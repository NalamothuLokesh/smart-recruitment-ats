
import React, { useState, useEffect } from 'react';
import { applicationsApi, candidateApi, jobsApi } from '../../api/client';
import {
  Kanban,
  Search,
  FileText,
  Download,
  XCircle,
  Clock
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'APPLIED', label: 'Applied', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { id: 'SCREENING', label: 'Screening', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { id: 'INTERVIEW', label: 'Interview', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { id: 'SELECTED', label: 'Selected', color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { id: 'OFFERED', label: 'Offered', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { id: 'REJECTED', label: 'Rejected', color: 'border-rose-300 bg-rose-50 text-rose-700' }
];

export const HrPipelineBoard = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeCandidate, setActiveCandidate] = useState(null);

  // Activity History State
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  // Stage Transition State
  const [transitioningApp, setTransitioningApp] = useState(null);
  const [targetStage, setTargetStage] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  // Load pipeline and jobs
  const loadPipeline = async () => {
    try {
      setLoading(true);

      const [appRes, jobRes] = await Promise.all([
        applicationsApi.listApplications({
          ...(selectedJobId ? { jobId: selectedJobId } : {}),
          ...(selectedStage ? { stage: selectedStage } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
          limit: 100
        }),
        jobsApi.listJobs({ limit: 100 })
      ]);

      setApplications(appRes.data || []);
      setJobs(jobRes.data || []);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload when job or stage filter changes
  useEffect(() => {
    loadPipeline();
  }, [selectedJobId, selectedStage]);

  // Fetch candidate activity history
  const handleOpenActivityHistory = async () => {
    if (!activeCandidate?.id) return;

    setShowActivityDrawer(true);
    setActivityLoading(true);
    setActivityError('');
    setActivityData(null);

    try {
      const response = await applicationsApi.getApplicationById(
        activeCandidate.id
      );

      setActivityData(response.data);
    } catch (err) {
      console.error('Failed to load activity history:', err);

      setActivityError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load activity history.'
      );
    } finally {
      setActivityLoading(false);
    }
  };

  // Open stage transition dialog
  const handleOpenTransition = (app, stage) => {
    setTransitioningApp(app);
    setTargetStage(stage);
    setTransitionNotes('');
  };

  // Execute stage transition
  const handleExecuteTransition = async (e) => {
    e.preventDefault();

    try {
      await applicationsApi.transitionStage(transitioningApp.id, {
        toStage: targetStage,
        notes: transitionNotes
      });

      setFeedback(
        `Moved ${transitioningApp.candidate_name} to ${targetStage}`
      );

      setTransitioningApp(null);
      await loadPipeline();

      if (activeCandidate?.id === transitioningApp.id) {
        setActiveCandidate((previous) => ({
          ...previous,
          current_stage: targetStage
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update candidate stage.');
    }
  };

  // Download candidate resume
  const handleDownloadResume = (resumeId, filename) => {
    candidateApi
      .downloadResume(resumeId, filename)
      .catch((err) => alert(err.message));
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Kanban className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Applicant Tracking Pipeline
            </h1>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Manage stage progression, review resumes, and audit recruitment state machine transitions.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

            <input
              type="text"
              placeholder="Search candidate name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadPipeline()}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Job Filter */}
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Requisitions</option>

            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Stages</option>

            {PIPELINE_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center">
          <span>{feedback}</span>

          <button
            onClick={() => setFeedback('')}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-5 text-sm text-indigo-600">
          Loading recruitment pipeline...
        </div>
      )}

      {/* Kanban Board */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = applications.filter(
            (a) => a.current_stage === stage.id
          );

          return (
            <div
              key={stage.id}
              className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[600px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${stage.color}`}
                >
                  {stage.label}
                </span>

                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  {stageApps.length}
                </span>
              </div>

              {/* Candidate Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageApps.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No candidates found
                  </p>
                ) : (
                  stageApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setActiveCandidate(app)}
                      className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs hover:shadow-sm hover:border-indigo-400 transition-all cursor-pointer space-y-2.5"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 hover:text-indigo-600">
                          {app.candidate_name}
                        </h4>

                        <p className="text-[11px] text-slate-500 truncate">
                          {app.job_title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{app.experience_years || 0} yrs exp</span>
                      </div>

                      {/* Skills */}
                      {app.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        {app.resume_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadResume(
                                app.resume_id,
                                app.resume_filename
                              );
                            }}
                            title="Download Resume"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          {stage.id !== 'REJECTED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransition(app, 'REJECTED');
                              }}
                              title="Reject Candidate"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {stage.id === 'APPLIED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransition(app, 'SCREENING');
                              }}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                            >
                              Screen →
                            </button>
                          )}

                          {stage.id === 'SCREENING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransition(app, 'INTERVIEW');
                              }}
                              className="px-2 py-0.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[11px] font-semibold"
                            >
                              Interview →
                            </button>
                          )}

                          {stage.id === 'INTERVIEW' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransition(app, 'SELECTED');
                              }}
                              className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-semibold"
                            >
                              Select →
                            </button>
                          )}

                          {stage.id === 'SELECTED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransition(app, 'OFFERED');
                              }}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold"
                            >
                              Offer →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Details Modal */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">

            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeCandidate.candidate_name}
                </h3>

                <p className="text-xs text-slate-500">
                  {activeCandidate.candidate_email} • {activeCandidate.candidate_phone || 'No phone'}
                </p>
              </div>

              <button
                onClick={() => setActiveCandidate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">

                <div>
                  <span className="text-slate-400 block">Applied Position</span>
                  <span className="font-semibold text-slate-800">
                    {activeCandidate.job_title}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Current Stage</span>
                  <span className="font-semibold text-indigo-600">
                    {activeCandidate.current_stage}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Experience</span>
                  <span className="font-semibold text-slate-800">
                    {activeCandidate.experience_years} years
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Applied Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activeCandidate.applied_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  Declared Competencies:
                </span>

                <div className="flex flex-wrap gap-1">
                  {activeCandidate.skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity History Button */}
              <div className="pt-2">
                <button
                  onClick={handleOpenActivityHistory}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-sm border border-indigo-200"
                >
                  View Activity History
                </button>
              </div>

              {/* Resume Download */}
              {activeCandidate.resume_id && (
                <div className="pt-2">
                  <button
                    onClick={() =>
                      handleDownloadResume(
                        activeCandidate.resume_id,
                        activeCandidate.resume_filename
                      )
                    }
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    Download Resume ({activeCandidate.resume_filename})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity History Drawer */}
      {showActivityDrawer && activeCandidate && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">

            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Activity History
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {activeCandidate.candidate_name}
                </p>
              </div>

              <button
                onClick={() => setShowActivityDrawer(false)}
                className="text-slate-500 hover:text-slate-900 text-xl"
              >
                &times;
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 flex-1 overflow-y-auto">

              {/* Loading State */}
              {activityLoading && (
                <div className="text-sm text-indigo-600 py-4">
                  Loading activity history...
                </div>
              )}

              {/* Error State */}
              {activityError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    {activityError}
                  </p>
                </div>
              )}

              {/* Activity Timeline */}
              {!activityLoading && !activityError && activityData && (
                <div className="space-y-4 mb-5">
                  <h4 className="font-semibold text-slate-800">
                    Activity Timeline
                  </h4>

                  {activityData.timeline?.length > 0 ? (
                    activityData.timeline.map((item) => (
                      <div
                        key={item.id}
                        className="border-l-2 border-indigo-300 pl-4 pb-3"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {item.from_stage || 'New Application'} → {item.to_stage}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {item.changed_at
                            ? new Date(item.changed_at).toLocaleString()
                            : 'Date not available'}
                        </p>

                        <p className="text-xs text-slate-600 mt-1">
                          Changed by: {item.changed_by_name || 'Unknown'}
                          {item.changed_by_role
                            ? ` (${item.changed_by_role})`
                            : ''}
                        </p>

                        {item.notes && (
                          <p className="text-sm text-slate-600 mt-2">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No activity recorded yet.
                    </p>
                  )}
                </div>
              )}

              {/* Application Details */}
              <h4 className="text-sm font-semibold text-slate-800 mb-3">
                Application Details
              </h4>

              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Applied Position</p>
                  <p className="text-sm font-medium text-slate-800">
                    {activityData?.job_title || activeCandidate.job_title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Current Stage</p>
                  <p className="text-sm font-semibold text-indigo-600">
                    {activityData?.current_stage || activeCandidate.current_stage}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Application Date</p>
                  <p className="text-sm font-medium text-slate-800">
                    {(activityData?.applied_at || activeCandidate.applied_at)
                      ? new Date(
                        activityData?.applied_at || activeCandidate.applied_at
                      ).toLocaleDateString()
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => setShowActivityDrawer(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transition Dialog */}
      {transitioningApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">

            <h3 className="text-lg font-bold text-slate-900">
              Confirm Stage Promotion
            </h3>

            <p className="text-xs text-slate-600">
              Transition{' '}
              <span className="font-semibold">
                {transitioningApp.candidate_name}
              </span>{' '}
              from{' '}
              <span className="font-mono font-bold text-slate-700">
                {transitioningApp.current_stage}
              </span>{' '}
              to{' '}
              <span className="font-mono font-bold text-indigo-600">
                {targetStage}
              </span>.
            </p>

            <form onSubmit={handleExecuteTransition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Audit Log Notes *
                </label>

                <textarea
                  required
                  rows={3}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Reason for stage transition, review summary, or interviewer feedback..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransitioningApp(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrPipelineBoard;
