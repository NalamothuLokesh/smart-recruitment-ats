import React from 'react';
import {
  Eye,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  UserX,
  Power,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';

export const UserTable = ({
  users = [],
  totalUsers = 0,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  sortField = 'date',
  sortOrder = 'desc',
  onSort,
  onViewUser,
  onEditRole,
  onToggleStatus,
  loading = false,
  togglingUserId = null,
  onResetFilters,
}) => {
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline" />
    );
  };

  const startIndex = totalUsers === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalUsers);

  // Compute page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="admin-table-shell">
      <div className="admin-table-wrapper">
        <table className="admin-table" aria-label="Users Directory Table">
          <thead>
            <tr>
              <th scope="col" style={{ width: '80px' }}>User ID</th>
              <th
                scope="col"
                className="sortable-th"
                onClick={() => onSort('name')}
                title="Click to sort by Full Name"
              >
                <div className="flex items-center">
                  <span>Full Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th scope="col">Email Address</th>
              <th scope="col">Role</th>
              <th scope="col">Account Status</th>
              <th
                scope="col"
                className="sortable-th"
                onClick={() => onSort('date')}
                title="Click to sort by Registration Date"
              >
                <div className="flex items-center">
                  <span>Registration Date</span>
                  {getSortIcon('date')}
                </div>
              </th>
              <th scope="col" className="text-right" style={{ minWidth: '170px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 w-10 bg-muted rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-36 bg-muted rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-muted rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-muted rounded" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <div className="h-7 w-14 bg-muted rounded" />
                      <div className="h-7 w-16 bg-muted rounded" />
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                      <UserX className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">No users found</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      No user accounts match the selected search keywords or filter criteria.
                    </p>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="btn btn-outline btn-sm text-xs"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Active User Rows
              users.map((u) => {
                const initials = u.full_name
                  ? u.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'U';

                const formattedDate = u.created_at
                  ? new Date(u.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                const isToggling = togglingUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    {/* User ID */}
                    <td className="font-mono text-xs text-muted-foreground font-semibold">
                      #{u.id}
                    </td>

                    {/* Full Name & Avatar */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="admin-user-avatar">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {u.full_name}
                          </div>
                          {u.org_name && (
                            <div className="text-[11px] text-muted-foreground truncate">
                              {u.org_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="text-muted-foreground text-xs font-mono">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`admin-role-badge admin-role-${u.role}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`admin-status-badge ${
                          u.is_active ? 'admin-status-active' : 'admin-status-inactive'
                        }`}
                      >
                        <span className="admin-status-dot" />
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="text-muted-foreground text-xs whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Actions */}
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => onViewUser(u)}
                          title="View user dossier"
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-foreground transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="hidden sm:inline">View</span>
                        </button>

                        {/* Edit Role */}
                        <button
                          type="button"
                          onClick={() => onEditRole(u)}
                          title="Change user authorization role"
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all flex items-center gap-1"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit Role</span>
                        </button>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => onToggleStatus(u.id, u.is_active)}
                          title={u.is_active ? 'Deactivate user account' : 'Reactivate user account'}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 ${
                            u.is_active
                              ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="admin-pagination-bar">
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{startIndex}</span> to{' '}
          <span className="font-semibold text-foreground">{endIndex}</span> of{' '}
          <span className="font-semibold text-foreground">{totalUsers}</span> users
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="px-2 py-1 rounded bg-card border border-border text-foreground text-xs outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per page</span>
          </div>

          {/* Previous Page Button */}
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous Page"
            className="admin-page-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((p) => (
            <button
              key={p}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(p)}
              className={`admin-page-btn ${p === page ? 'active' : ''}`}
            >
              {p}
            </button>
          ))}

          {/* Next Page Button */}
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next Page"
            className="admin-page-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
