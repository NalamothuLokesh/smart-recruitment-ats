import React, { useState, useEffect } from 'react';
import { jobsApi } from '../../api/client';
import { Briefcase, Plus, Filter, Edit3, Eye, CheckCircle, Archive, AlertCircle } from 'lucide-react';

/**
 * ============================================================================
 * MODULE: JobManagementPage.jsx
 * ASSIGNED TO: // TODO: [Teammate 2: Recruiter Pipeline & Requisitions Lead]
 * PAIR MODULE: src/modules/hr-pipeline/HrPipelineBoard.jsx
 * 
 * RESPONSIBILITIES:
 * 1. Requisition creation form (title, department, location, employmentType, description, requirements).
 * 2. Job listing with status lifecycle badges (DRAFT, PUBLISHED, CLOSED, ARCHIVED).
 * 3. Status transitions: One-click "Publish", "Close", or "Archive".
 * 4. Inline/modal editing of requisition requirements.
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - jobsApi.listJobs({ status, department, search, page, limit })
 * - jobsApi.createJob(jobData)
 * - jobsApi.updateJob(jobId, jobData)
 * - jobsApi.updateJobStatus(jobId, status)
 * ============================================================================
 */
export const JobManagementPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    description: '',
    requirements: '',
    status: 'DRAFT'
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const res = await jobsApi.listJobs(params);
      setJobs(res.data || []);
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await jobsApi.updateJobStatus(jobId, newStatus);
      setFeedback(`Job status updated to ${newStatus}`);
      loadJobs();
    } catch (err) {
      setFeedback(`Failed to update status: ${err.message}`);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        employmentType: formData.employmentType,
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        status: formData.status
      };
      await jobsApi.createJob(payload);
      setFeedback('Job requisition created successfully.');
      setIsCreating(false);
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        description: '',
        requirements: '',
        status: 'DRAFT'
      });
      loadJobs();
    } catch (err) {
      setFeedback(`Validation Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Job Requisition Management</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create, publish, and track recruitment postings across departments.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn btn-primary text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'Cancel Creation' : 'Create New Requisition'}
        </button>
      </div>

      {feedback && (
        <div className={`my-4 p-3.5 rounded-xl border text-sm flex justify-between items-center animate-fadeIn ${
          feedback.toLowerCase().includes('error')
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.toLowerCase().includes('error') ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback('')} className="text-xs font-semibold hover:underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Creation Modal / Inline Panel */}
      {isCreating && (
        <div className="my-6 p-6 bg-card border border-border rounded-2xl shadow-md animate-fadeIn">
          <h2 className="text-lg font-bold text-foreground mb-4">Post a New Job Requisition</h2>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Remote - USA / New York"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm"
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm"
                >
                  <option value="DRAFT">Draft (Internal Review)</option>
                  <option value="PUBLISHED">Published (Open for applications)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Job Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of the role, impact, and daily responsibilities..."
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Requirements & Qualifications *</label>
              <textarea
                rows={3}
                required
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Bullet points of required skills, years of experience, certifications..."
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                Create Job Requisition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mt-6 flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-sm"
          >
            <option value="">All Requisitions</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{jobs.length} requisitions found</span>
      </div>

      {/* Jobs Table */}
      <div className="mt-4 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">Role Title</th>
                <th className="py-3 px-4 text-left">Department & Location</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Applicants</th>
                <th className="py-3 px-4 text-left">Published</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground">{j.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="text-foreground">{j.department}</div>
                    <div className="text-xs text-muted-foreground">{j.location} • {j.employment_type}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      j.status === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      j.status === 'DRAFT' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      j.status === 'CLOSED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                    }`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary">
                    {j.applications_count || 0}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {j.published_at ? new Date(j.published_at).toLocaleDateString() : 'Unpublished'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {j.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handleStatusChange(j.id, 'PUBLISHED')}
                        className="text-xs px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/30 font-medium transition-colors"
                      >
                        Publish
                      </button>
                    )}
                    {j.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleStatusChange(j.id, 'CLOSED')}
                        className="text-xs px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg border border-rose-500/30 font-medium transition-colors"
                      >
                        Close
                      </button>
                    )}
                    {j.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleStatusChange(j.id, 'ARCHIVED')}
                        className="text-xs px-2.5 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg border border-border font-medium transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobManagementPage;

