import React, { useState, useEffect } from 'react';
import { offersApi } from '../../api/client';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Building,
  Mail,
  Loader2
} from 'lucide-react';

export const AdminOnboardingTracker = ({ activeOfferId = 1, className = '' }) => {
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingTaskId, setTogglingTaskId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  const loadOnboarding = async () => {
    try {
      setLoading(true);
      const res = await offersApi.getOnboarding(activeOfferId);
      setOnboardingData(res.data);
    } catch (err) {
      console.warn('Failed to load live onboarding data:', err.message);
      // Fallback sample onboarding for demo
      setOnboardingData({
        offer: {
          id: 1,
          candidate_name: 'Alex Rivera',
          candidate_email: 'alex.rivera@example.com',
          job_title: 'Senior Full-Stack Engineer',
          department: 'Engineering',
          joining_date: '2026-03-01',
          salary_offered: '165000.00',
          status: 'ISSUED'
        },
        tasks: [
          {
            id: 4,
            task_title: 'Complete Background Check Authorization Form',
            is_completed: true,
            due_date: '2026-02-10',
            completed_at: '2026-01-29 10:15:00'
          },
          {
            id: 1,
            task_title: 'Review & Digitally Sign Employment Agreement',
            is_completed: false,
            due_date: '2026-02-15',
            completed_at: null
          },
          {
            id: 2,
            task_title: 'Upload Government ID & Tax Verification Documents',
            is_completed: false,
            due_date: '2026-02-20',
            completed_at: null
          },
          {
            id: 3,
            task_title: 'Select Hardware & Development Machine Preferences',
            is_completed: false,
            due_date: '2026-02-22',
            completed_at: null
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnboarding();
  }, [activeOfferId]);

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4000);
  };

  const handleToggleTask = async (taskId, currentVal) => {
    try {
      setTogglingTaskId(taskId);
      // Optimistic update
      setOnboardingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  is_completed: !currentVal,
                  completed_at: !currentVal ? new Date().toISOString() : null
                }
              : t
          )
        };
      });

      await offersApi.updateOnboardingTask(taskId, !currentVal);
      showToast(
        `Onboarding milestone task marked as ${!currentVal ? 'Complete' : 'Pending'}.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update task completion.', 'error');
      loadOnboarding();
    } finally {
      setTogglingTaskId(null);
    }
  };

  const offer = onboardingData?.offer;
  const tasks = onboardingData?.tasks || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Info */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Employee Onboarding Checklist Tracker</h2>
          <p className="text-xs text-muted-foreground">
            Track pre-hire onboarding readiness, verify employment documentation, and monitor task completion milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOnboarding}
          disabled={loading}
          className="btn btn-outline btn-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Checklist</span>
        </button>
      </div>

      {/* Notification */}
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

      {/* New Hire Profile Banner & Readiness Progress Bar */}
      {offer && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                {offer.candidate_name
                  ? offer.candidate_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'NH'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{offer.candidate_name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Offer {offer.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {offer.job_title}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {offer.department || 'Engineering'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {offer.candidate_email}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right text-xs font-mono">
              <span className="text-muted-foreground block text-[11px] mb-0.5">Target Start Date</span>
              <span className="font-bold text-foreground flex items-center md:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {offer.joining_date}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Pre-Hire Readiness Progress: <strong className="text-primary">{progressPercent}%</strong>
              </span>
              <span className="text-muted-foreground">
                {completedTasks} of {totalTasks} milestones completed
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-muted overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Checklist Tasks */}
      <div className="admin-table-shell">
        <div className="p-4 border-b border-border bg-card-elevated flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Onboarding Task Milestones
          </span>
          <span className="text-xs text-muted-foreground">Click checkbox to update task status</span>
        </div>

        <div className="divide-y divide-border">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No onboarding tasks provisioned for this offer.
            </div>
          ) : (
            tasks.map((task) => {
              const isBusy = togglingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => !isBusy && handleToggleTask(task.id, task.is_completed)}
                  className="p-4 flex items-start justify-between gap-4 hover:bg-muted/40 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      className="mt-0.5 text-primary focus:outline-none"
                    >
                      {isBusy ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : task.is_completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground/60 hover:text-foreground" />
                      )}
                    </button>

                    <div>
                      <div
                        className={`text-sm font-semibold transition-all ${
                          task.is_completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {task.task_title}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          Due: {task.due_date}
                        </span>
                        {task.completed_at && (
                          <span className="text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed on {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        task.is_completed
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {task.is_completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOnboardingTracker;
