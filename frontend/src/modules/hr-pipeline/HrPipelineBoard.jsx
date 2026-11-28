import React, { useState, useEffect } from 'react';
import { applicationsApi, candidateApi, jobsApi } from '../../api/client';
import {
  Kanban,
  Search,
  ArrowRight,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Briefcase,
  X
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 'APPLIED',
    label: 'Applied',
    dotColor: 'bg-slate-400 dark:bg-slate-400'
  },
  {
    id: 'SCREENING',
    label: 'Screening',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'INTERVIEW',
    label: 'Interview',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'SELECTED',
    label: 'Selected',
    dotColor: 'bg-purple-500'
  },
  {
    id: 'OFFERED',
    label: 'Offered',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'REJECTED',
    label: 'Rejected',
    dotColor: 'bg-rose-500'
  }
];

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const HrPipelineBoard = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCandidate, setActiveCandidate] = useState(null);

  // Resume Preview State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

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

  // Scroll Lock for overlays (Modals, Dialogs, Drawers)
  const isOverlayOpen = Boolean(activeCandidate || transitioningApp || showActivityDrawer);

  useEffect(() => {
    if (isOverlayOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOverlayOpen]);

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
  // Preview candidate resume
  const handlePreviewResume = async (resumeId) => {
    try {
      setPreviewLoading(true);
      setPreviewError('');

      // Close and clean up any previous preview URL
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      const url = await candidateApi.previewResume(resumeId);

      setPreviewUrl(url);
    } catch (err) {
      console.error('Failed to preview resume:', err);
      setPreviewError(err.message || 'Failed to preview resume.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close resume preview
  const handleClosePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPreviewError('');
  };

  return (
    <div className="max-w-[1750px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200 dark:border-slate-800 gap-4 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex-shrink-0">
              <Kanban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Applicant Tracking Pipeline
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Manage stage progression, review resumes, and audit recruitment state machine transitions.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadPipeline()}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm bg-white dark:bg-[#161b22] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Job Filter */}
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm bg-white dark:bg-[#161b22] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm bg-white dark:bg-[#161b22] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

      {/* Feedback Toast */}
      {feedback && (
        <div className="my-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm rounded-xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback('')}
            className="text-xs font-semibold hover:underline ml-4 text-emerald-700 dark:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          Loading recruitment pipeline...
        </div>
      )}

      {/* SaaS Kanban Board: Adaptive Grid + Smooth Natural Scroll (No Scroll Trap) */}
      <div className="mt-6 overflow-x-auto pb-8 overscroll-contain custom-scrollbar">
        <div className="flex gap-4 min-w-[1280px] xl:min-w-0 xl:grid xl:grid-cols-6 items-start">
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = applications.filter(
              (a) => a.current_stage === stage.id
            );

            return (
              <div
                key={stage.id}
                className="w-[280px] sm:w-[290px] xl:w-auto flex flex-col min-h-[420px] transition-all"
              >
                {/* Column Header - Frameless Linear Style with Status Dot */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800/80 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor} shadow-2xs flex-shrink-0`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {stage.label}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards List - Clean Natural Flow */}
                <div className="space-y-3 flex-1 flex flex-col">
                  {stageApps.map((app) => {
                    const appSkills = Array.isArray(app.skills)
                      ? app.skills
                      : typeof app.skills === 'string'
                      ? app.skills.split(/[\s,]+/).filter(Boolean)
                      : [];

                    return (
                      <div
                        key={app.id}
                        onClick={() => setActiveCandidate(app)}
                        className="group bg-white dark:bg-[#161b22] rounded-xl p-3.5 border border-slate-200/90 dark:border-[#30363d] shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          {/* Candidate Avatar Initials + Name + Title */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                              {getInitials(app.candidate_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                {app.candidate_name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {app.job_title}
                              </p>
                            </div>
                          </div>

                          {/* SaaS Property-Style Key Metrics Strip */}
                          <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 text-[11px]">
                              <Briefcase className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="tabular-nums font-medium">
                                {app.experience_years != null ? `${app.experience_years} yrs` : 'Entry'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 text-[11px] truncate">
                              <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="tabular-nums truncate">
                                {app.applied_at ? new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                              </span>
                            </div>
                          </div>

                          {/* Competency Chips */}
                          {appSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {appSkills.slice(0, 2).map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[110px]"
                                >
                                  {skill}
                                </span>
                              ))}
                              {appSkills.length > 2 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded">
                                  +{appSkills.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions Bottom Row */}
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5 mt-auto">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCandidate(app);
                              }}
                              title="View Candidate Details"
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {stage.id !== 'REJECTED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransition(app, 'REJECTED');
                                }}
                                title="Reject Candidate"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Stage Advance Buttons with consistent height & padding */}
                          <div>
                            {stage.id === 'APPLIED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransition(app, 'SCREENING');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md text-[11px] font-semibold border border-blue-200/60 dark:border-blue-800/60 transition-colors whitespace-nowrap"
                              >
                                <span>Screen</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {stage.id === 'SCREENING' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransition(app, 'INTERVIEW');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-md text-[11px] font-semibold border border-amber-200/60 dark:border-amber-800/60 transition-colors whitespace-nowrap"
                              >
                                <span>Interview</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {stage.id === 'INTERVIEW' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransition(app, 'SELECTED');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-md text-[11px] font-semibold border border-purple-200/60 dark:border-purple-800/60 transition-colors whitespace-nowrap"
                              >
                                <span>Select</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {stage.id === 'SELECTED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransition(app, 'OFFERED');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md text-[11px] font-semibold border border-emerald-200/60 dark:border-emerald-800/60 transition-colors whitespace-nowrap"
                              >
                                <span>Offer</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageApps.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-slate-200/70 dark:border-slate-800/60 rounded-xl bg-slate-50/40 dark:bg-white/[0.01]">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">No candidates in {stage.label.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Details Modal (z-50) */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain overflow-y-auto">
          <div className="bg-white dark:bg-[#161b22] max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-[#30363d] space-y-5 my-auto relative overscroll-contain">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-[#30363d] pb-4">
              <div className="min-w-0 pr-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {activeCandidate.candidate_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate font-mono">
                  {activeCandidate.candidate_email} • {activeCandidate.candidate_phone || 'No phone'}
                </p>
              </div>
              <button
                onClick={() => setActiveCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standardized Key-Value Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-xl bg-slate-50 dark:bg-[#1c2128] border border-slate-200/80 dark:border-[#30363d]">
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  Applied Position
                </span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {activeCandidate.job_title}
                </span>
              </div>

              <div className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  Current Stage
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {activeCandidate.current_stage}
                </span>
              </div>

              <div className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  Experience
                </span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {activeCandidate.experience_years != null ? activeCandidate.experience_years : '0'} years
                </span>
              </div>

              <div className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  Applied Date
                </span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {activeCandidate.applied_at
                    ? new Date(activeCandidate.applied_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Declared Competencies */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2">
                Declared Competencies
              </span>
              <div className="flex flex-wrap gap-2">
                {activeCandidate.skills && activeCandidate.skills.length > 0 ? (
                  activeCandidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium border border-indigo-200/60 dark:border-indigo-800/60"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No competencies listed</span>
                )}
              </div>
            </div>

            {/* Action Buttons: Activity History & Resume Download */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={handleOpenActivityHistory}
                className="w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-xs sm:text-sm border border-indigo-200/80 dark:border-indigo-800/80 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>View Activity History</span>
              </button>

              {activeCandidate.resume_id && (
                <div className="space-y-2">
                  <button
                    onClick={() => handlePreviewResume(activeCandidate.resume_id)}
                    disabled={previewLoading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{previewLoading ? 'Loading Preview...' : 'Preview Resume'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleDownloadResume(
                        activeCandidate.resume_id,
                        activeCandidate.resume_filename
                      )
                    }
                    className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="truncate">Download Resume ({activeCandidate.resume_filename})</span>
                  </button>

                  {previewError && (
                    <p className="text-xs text-rose-500 text-center font-medium">{previewError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal (z-[80]) */}
      {(previewUrl || previewLoading || previewError) && (
        <div className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-[#30363d]">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#30363d] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Resume Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeCandidate?.resume_filename || 'Candidate Resume'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClosePreview}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
              {previewLoading && (
                <div className="h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium">
                  Loading resume preview...
                </div>
              )}

              {previewError && (
                <div className="h-full flex items-center justify-center p-6 text-center">
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-medium">{previewError}</p>
                </div>
              )}

              {previewUrl && !previewLoading && (
                <iframe
                  src={previewUrl}
                  title="Resume Preview"
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity History Slide-Over Drawer (z-[70]) */}
      {showActivityDrawer && activeCandidate && (
        <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-xs flex justify-end overscroll-contain">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-[#30363d] flex flex-col overscroll-contain">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between flex-shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Activity History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {activeCandidate.candidate_name}
                </p>
              </div>

              <button
                onClick={() => setShowActivityDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close activity history"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-6 custom-scrollbar">
              {/* Loading State */}
              {activityLoading && (
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2 py-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  Loading activity history...
                </div>
              )}

              {/* Error State */}
              {activityError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5">
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                    {activityError}
                  </p>
                </div>
              )}

              {/* Activity Timeline */}
              {!activityLoading && !activityError && activityData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Activity Timeline
                  </h4>

                  {activityData.timeline?.length > 0 ? (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {activityData.timeline.map((item) => (
                        <div
                          key={item.id}
                          className="relative pl-8 space-y-1"
                        >
                          <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#161b22] border-2 border-indigo-600 dark:border-indigo-400" />

                          <div className="p-3 bg-slate-50 dark:bg-[#1c2128] rounded-xl border border-slate-200/80 dark:border-[#30363d] space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                {item.from_stage || 'New Application'} → <span className="text-indigo-600 dark:text-indigo-400">{item.to_stage}</span>
                              </p>
                            </div>

                            <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              {item.changed_at
                                ? new Date(item.changed_at).toLocaleString()
                                : 'Date not available'}
                            </p>

                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Changed by: <span className="font-medium">{item.changed_by_name || 'System / Recruiter'}</span>
                              {item.changed_by_role ? ` (${item.changed_by_role})` : ''}
                            </p>

                            {item.notes && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-[#161b22] p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 mt-1 italic">
                                "{item.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      No activity recorded yet.
                    </p>
                  )}
                </div>
              )}

              {/* Application Details Summary */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Application Overview
                </h4>

                <div className="border border-slate-200 dark:border-[#30363d] rounded-xl p-4 bg-slate-50/70 dark:bg-[#1c2128] grid grid-cols-2 gap-x-6 gap-y-3">
                  <div className="col-span-2 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">Applied Position</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {activityData?.job_title || activeCandidate.job_title}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">Current Stage</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {activityData?.current_stage || activeCandidate.current_stage}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">Application Date</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                      {(activityData?.applied_at || activeCandidate.applied_at)
                        ? new Date(
                            activityData?.applied_at || activeCandidate.applied_at
                          ).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#30363d] flex-shrink-0">
              <button
                onClick={() => setShowActivityDrawer(false)}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transition Dialog (z-[60]) */}
      {transitioningApp && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain overflow-y-auto">
          <div className="bg-white dark:bg-[#161b22] max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-[#30363d] space-y-4 my-auto relative overscroll-contain">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-[#30363d] pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirm Stage Transition
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Moving <span className="font-semibold text-slate-800 dark:text-slate-200">{transitioningApp.candidate_name}</span> from{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{transitioningApp.current_stage}</span> to{' '}
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{targetStage}</span>.
                </p>
              </div>
              <button
                onClick={() => setTransitioningApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mandatory Audit Log Notes *
                </label>

                <textarea
                  required
                  rows={3}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Reason for stage transition, review summary, or interviewer feedback..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTransitioningApp(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
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
