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
      const res = await jobsApi.listJobs({ status: statusFilter });
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
      alert(err.message);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await jobsApi.createJob(formData);
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
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Requisition Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create, publish, and track recruitment postings across departments.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'Cancel Creation' : 'Create New Requisition'}
        </button>
      </div>

      {feedback && (
        <div className="my-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm rounded-lg flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Creation Modal / Inline Panel */}
      {isCreating && (
        <div className="my-6 p-6 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Post a New Job Requisition</h2>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Remote - USA / New York"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="DRAFT">Draft (Internal Review)</option>
                  <option value="PUBLISHED">Published (Open for applications)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of the role, impact, and daily responsibilities..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requirements & Qualifications *</label>
              <textarea
                rows={3}
                required
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Bullet points of required skills, years of experience, certifications..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Create Job Requisition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Requisitions</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{jobs.length} requisitions found</span>
      </div>

      {/* Jobs Table */}
      <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="py-3 px-4 text-left">Role Title</th>
              <th className="py-3 px-4 text-left">Department & Location</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Applicants</th>
              <th className="py-3 px-4 text-left">Published</th>
              <th className="py-3 px-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-900">{j.title}</td>
                <td className="py-3 px-4 text-slate-600">
                  <div>{j.department}</div>
                  <div className="text-xs text-slate-400">{j.location} • {j.employment_type}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    j.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    j.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    j.status === 'CLOSED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}>
                    {j.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-indigo-600">
                  {j.applications_count || 0}
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {j.published_at ? new Date(j.published_at).toLocaleDateString() : 'Unpublished'}
                </td>
                <td className="py-3 px-4 text-right space-x-1.5">
                  {j.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handleStatusChange(j.id, 'PUBLISHED')}
                      className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 font-medium"
                    >
                      Publish
                    </button>
                  )}
                  {j.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleStatusChange(j.id, 'CLOSED')}
                      className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 font-medium"
                    >
                      Close
                    </button>
                  )}
                  {j.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => handleStatusChange(j.id, 'ARCHIVED')}
                      className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
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
  );
};

export default JobManagementPage;

