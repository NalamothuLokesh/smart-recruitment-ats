import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Shield,
  Activity,
  ArrowRight,
  User,
  Calendar,
  X,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const STAGE_COLORS = {
  APPLIED: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  SCREENING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  INTERVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  SELECTED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  OFFERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  ROLE_ASSIGNED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DEACTIVATED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export const AuditLogView = ({
  auditLogs = [],
  loading = false,
  onRefresh,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtering
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Stage filter
      if (stageFilter) {
        const matchesFrom = log.from_stage === stageFilter;
        const matchesTo = log.to_stage === stageFilter;
        if (!matchesFrom && !matchesTo) return false;
      }

      // Role filter
      if (roleFilter && log.changed_by_role !== roleFilter) {
        return false;
      }

      // Date range filter
      if (fromDate || toDate) {
        const logDate = log.changed_at ? new Date(log.changed_at) : null;
        if (!logDate || Number.isNaN(logDate.getTime())) return false;
        if (fromDate) {
          const start = new Date(`${fromDate}T00:00:00`);
          if (logDate < start) return false;
        }
        if (toDate) {
          const end = new Date(`${toDate}T23:59:59.999`);
          if (logDate > end) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = String(log.id || '').includes(q);
        const candMatch = (log.candidate_name || '').toLowerCase().includes(q);
        const jobMatch = (log.job_title || '').toLowerCase().includes(q);
        const actorMatch = (log.changed_by_name || '').toLowerCase().includes(q);
        const notesMatch = (log.notes || '').toLowerCase().includes(q);
        const appMatch = String(log.application_id || '').includes(q);
        if (!idMatch && !candMatch && !jobMatch && !actorMatch && !notesMatch && !appMatch) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, stageFilter, roleFilter, fromDate, toDate, searchQuery]);

  const totalLogs = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  // Reset page if out of bounds
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStageFilter('');
    setRoleFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchQuery || stageFilter || roleFilter || fromDate || toDate);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidate, job, executor, or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stage / Transition Filter */}
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by stage transition"
            className="px-3 py-2 rounded-lg text-xs font-medium bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All Stages & Events</option>
            <option value="APPLIED">APPLIED</option>
            <option value="SCREENING">SCREENING</option>
            <option value="INTERVIEW">INTERVIEW</option>
            <option value="SELECTED">SELECTED</option>
            <option value="OFFERED">OFFERED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Actor Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by actor role"
            className="px-3 py-2 rounded-lg text-xs font-medium bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All Executor Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="CANDIDATE">CANDIDATE</option>
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="Filter from date"
              title="From date"
              className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="Filter to date"
              title="To date"
              className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-muted p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Timeline Feed
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Reset
            </button>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Audit Logs"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Info */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{totalLogs}</strong> matching audit events
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-primary hover:underline font-semibold"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── MODE 1: Table View ────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <div className="admin-table-shell">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '180px' }}>Timestamp</th>
                  <th scope="col">Candidate & Job</th>
                  <th scope="col">Stage Transition</th>
                  <th scope="col">Executed By</th>
                  <th scope="col">Audit Notes</th>
                  <th scope="col" className="text-right" style={{ width: '90px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skel-log-${idx}`} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-32 bg-muted rounded mb-1" /><div className="h-3 w-20 bg-muted rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-24 bg-muted rounded-full" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-6 w-12 bg-muted rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-8 h-8 text-muted-foreground/40 mb-2" />
                        <span className="font-semibold text-foreground text-sm">No audit logs match your filter criteria</span>
                        <p className="mt-1">Try modifying the search terms or clearing active filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const toBadgeColor = STAGE_COLORS[log.to_stage] || 'bg-primary/15 text-primary border-primary/30';

                    return (
                      <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                        {/* Timestamp */}
                        <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/80 flex-shrink-0" />
                            <span>{new Date(log.changed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </td>

                        {/* Candidate & Job */}
                        <td>
                          <div className="font-semibold text-foreground text-xs">
                            {log.candidate_name || `Application #${log.application_id}`}
                          </div>
                          {log.job_title && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                              {log.job_title}
                            </div>
                          )}
                        </td>

                        {/* Transition */}
                        <td>
                          <div className="inline-flex items-center gap-1.5 text-xs font-mono">
                            <span className="text-muted-foreground text-[11px]">
                              {log.from_stage || 'START'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${toBadgeColor}`}>
                              {log.to_stage}
                            </span>
                          </div>
                        </td>

                        {/* Executed By */}
                        <td>
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">
                              {log.changed_by_name || 'System'}
                            </span>
                            <span className={`admin-role-badge admin-role-${log.changed_by_role} text-[10px] py-0 px-1 ml-1.5`}>
                              {log.changed_by_role || 'SYSTEM'}
                            </span>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="text-xs text-muted-foreground max-w-xs truncate" title={log.notes}>
                          {log.notes || '—'}
                        </td>

                        {/* Action */}
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1 ml-auto"
                            title="Inspect full audit record"
                          >
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination-bar">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(page * pageSize, totalLogs)}</span> of{' '}
              <span className="font-semibold text-foreground">{totalLogs}</span> events
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded bg-card border border-border text-foreground text-xs"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="admin-page-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="admin-page-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE 2: Timeline Feed ─────────────────────────────────────────── */
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-6">
          <div className="relative border-l-2 border-border/80 ml-4 space-y-6">
            {paginatedLogs.map((log) => {
              const toBadgeColor = STAGE_COLORS[log.to_stage] || 'bg-primary/15 text-primary border-primary/30';

              return (
                <div key={`tl-${log.id}`} className="relative pl-6 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-card border-2 border-primary group-hover:scale-125 transition-transform" />

                  <div className="p-4 rounded-xl bg-muted/40 border border-border hover:border-primary/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">
                          {log.changed_by_name}
                        </span>
                        <span className={`admin-role-badge admin-role-${log.changed_by_role} text-[10px] py-0 px-1`}>
                          {log.changed_by_role}
                        </span>
                        <span className="text-muted-foreground">performed action on</span>
                        <span className="font-semibold text-foreground">
                          {log.candidate_name || `App #${log.application_id}`}
                        </span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.changed_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">{log.job_title}</span>
                      <span className="text-muted-foreground">•</span>
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-muted-foreground text-[11px]">{log.from_stage || 'START'}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${toBadgeColor}`}>
                          {log.to_stage}
                        </span>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Audit Entry Details Inspection Modal ─────────────────────────── */}
      {selectedLog && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
        >
          <div className="admin-modal-dialog max-w-lg">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Audit Log Event Dossier #{selectedLog.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="admin-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1">Timestamp</span>
                  <span className="font-mono font-semibold text-foreground">
                    {new Date(selectedLog.changed_at).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1">Application ID</span>
                  <span className="font-mono font-semibold text-foreground">
                    #{selectedLog.application_id}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1">Target Candidate</span>
                  <span className="font-semibold text-foreground">{selectedLog.candidate_name}</span>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1">Job Requisition</span>
                  <span className="font-semibold text-foreground truncate block">{selectedLog.job_title}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/60 border border-border">
                <span className="text-xs font-semibold text-foreground block mb-2">Stage Transition Flow:</span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-card border border-border text-muted-foreground">
                    {selectedLog.from_stage || 'START'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="px-2.5 py-1 rounded bg-primary/15 border border-primary/30 text-primary font-bold">
                    {selectedLog.to_stage}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-card border border-border">
                <span className="text-xs font-semibold text-foreground block mb-1">Execution Authority:</span>
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-bold text-foreground">{selectedLog.changed_by_name}</span>
                  <span className={`admin-role-badge admin-role-${selectedLog.changed_by_role} text-[10px] py-0 px-1.5`}>
                    {selectedLog.changed_by_role}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-foreground block mb-1">Audit Record Notes:</span>
                <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border leading-relaxed">
                  {selectedLog.notes || 'No contextual notes recorded for this transition.'}
                </p>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
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

export default AuditLogView;
