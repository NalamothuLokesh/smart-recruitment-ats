import React, { useState, useEffect } from 'react';
import { analyticsApi, jobsApi } from '../../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  MailCheck, 
  Filter, 
  RefreshCw,
  Percent
} from 'lucide-react';

/**
 * ============================================================================
 * MODULE: HiringAnalyticsPage.jsx
 * ASSIGNED TO: // TODO: [Teammate 6: Analytics & Business Intelligence Engineer]
 * 
 * RESPONSIBILITIES:
 * 1. Executive Recruitment KPIs: Total open jobs, application volume, time-to-hire, offer acceptance rate.
 * 2. Visual Recruitment Funnel: Stage-to-stage progression conversion rates with documented denominators.
 * 3. Filters: Filter KPIs by Job Requisition, Start Date, and End Date.
 * 4. Zero-Division Safety: Gracefully handles unpopulated states with safe 0.0% fallbacks.
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - analyticsApi.getSummary({ jobId, startDate, endDate })
 * - jobsApi.listJobs()
 * ============================================================================
 */
export const HiringAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, jobsRes] = await Promise.all([
        analyticsApi.getSummary({ jobId: selectedJobId, startDate, endDate }),
        jobsApi.listJobs({ limit: 100 })
      ]);
      setAnalytics(analyticsRes.data || null);
      setJobs(jobsRes.data || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedJobId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment & Pipeline Analytics</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time hiring funnel conversion rates, velocity metrics, and system delivery health.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="">All Requisitions</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            placeholder="Start date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            placeholder="End date"
          />

          <button
            onClick={loadAnalytics}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Open Jobs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Requisitions</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics?.kpis?.totalOpenJobs ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Published & accepting applications</div>
        </div>

        {/* KPI 2: Total Applications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Applicants</div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {analytics?.kpis?.applicationVolume ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Total volume in target scope</div>
        </div>

        {/* KPI 3: Avg Time to Hire */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Time-to-Hire</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics?.kpis?.averageTimeToHireDays ?? 0.0} <span className="text-sm font-normal text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-400">From apply to offer acceptance</div>
        </div>

        {/* KPI 4: Offer Acceptance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offer Acceptance</div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {analytics?.kpis?.offerAcceptanceRate ?? 0.0}%
          </div>
          <div className="text-[11px] text-slate-400">{analytics?.offers?.accepted || 0} accepted of {analytics?.offers?.issued || 0} issued</div>
        </div>

        {/* KPI 5: Notification Delivery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Delivery SLA</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics?.kpis?.notificationDeliveryRate ?? 100.0}%
          </div>
          <div className="text-[11px] text-slate-400">Transactional alert health</div>
        </div>
      </div>

      {/* Visual Pipeline Funnel & Stage Conversion Rates */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recruitment Funnel & Progression Efficiency</h2>
          <p className="text-xs text-slate-500">
            Progression conversion percentages between adjacent recruitment stages (safe zero-division).
          </p>
        </div>

        <div className="space-y-4">
          {/* Funnel Step 1: Applied */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">1. Applied Candidates</span>
              <span className="text-slate-600">{analytics?.funnel?.counts?.applied || 0} candidates</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Conversion Arrow 1 */}
          <div className="flex items-center gap-2 pl-4 text-xs font-mono text-slate-500">
            <span className="text-slate-400">↳ Applied to Screening Conversion:</span>
            <span className="font-bold text-indigo-700">{analytics?.funnel?.conversionRates?.appliedToScreening ?? 0.0}%</span>
          </div>

          {/* Funnel Step 2: Screening */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">2. Reached Screening</span>
              <span className="text-slate-600">{analytics?.funnel?.counts?.screening || 0} candidates</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(100, analytics?.funnel?.conversionRates?.appliedToScreening || 0)}%` }} 
              />
            </div>
          </div>

          {/* Conversion Arrow 2 */}
          <div className="flex items-center gap-2 pl-4 text-xs font-mono text-slate-500">
            <span className="text-slate-400">↳ Screening to Interview Conversion:</span>
            <span className="font-bold text-blue-700">{analytics?.funnel?.conversionRates?.screeningToInterview ?? 0.0}%</span>
          </div>

          {/* Funnel Step 3: Interview */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">3. Scheduled for Interview</span>
              <span className="text-slate-600">{analytics?.funnel?.counts?.interview || 0} candidates</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(100, (analytics?.funnel?.counts?.interview / (analytics?.funnel?.counts?.applied || 1)) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Conversion Arrow 3 */}
          <div className="flex items-center gap-2 pl-4 text-xs font-mono text-slate-500">
            <span className="text-slate-400">↳ Interview to Final Selection:</span>
            <span className="font-bold text-amber-700">{analytics?.funnel?.conversionRates?.interviewToSelected ?? 0.0}%</span>
          </div>

          {/* Funnel Step 4: Selected */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">4. Selected for Offer</span>
              <span className="text-slate-600">{analytics?.funnel?.counts?.selected || 0} candidates</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(100, (analytics?.funnel?.counts?.selected / (analytics?.funnel?.counts?.applied || 1)) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Conversion Arrow 4 */}
          <div className="flex items-center gap-2 pl-4 text-xs font-mono text-slate-500">
            <span className="text-slate-400">↳ Selected to Formal Offer:</span>
            <span className="font-bold text-purple-700">{analytics?.funnel?.conversionRates?.selectedToOffered ?? 0.0}%</span>
          </div>

          {/* Funnel Step 5: Offered */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-800">5. Employment Offer Issued</span>
              <span className="text-slate-600">{analytics?.funnel?.counts?.offered || 0} offers</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(100, (analytics?.funnel?.counts?.offered / (analytics?.funnel?.counts?.applied || 1)) * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Overall Funnel Efficiency Card */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Overall Pipeline End-to-End Efficiency:</span>
          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
            {analytics?.funnel?.conversionRates?.overallFunnelEfficiency ?? 0.0}% of applicants received offers
          </span>
        </div>
      </div>
    </div>
  );
};

export default HiringAnalyticsPage;

