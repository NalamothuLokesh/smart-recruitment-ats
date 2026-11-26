import React from 'react';
import { Calendar } from 'lucide-react';
import AdminInterviewScheduler from '../admin/AdminInterviewScheduler';
import '../admin/admin.css';

export const InterviewSchedulerPage = () => {
  return (
    <div className="admin-module-container space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-primary flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Interview Scheduling & Evaluations
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Coordinate online/in-person interviews, reschedule or cancel sessions, and record structured panel scorecards.
            </p>
          </div>
        </div>
      </div>

      <AdminInterviewScheduler />
    </div>
  );
};

export default InterviewSchedulerPage;
