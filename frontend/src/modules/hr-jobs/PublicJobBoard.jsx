import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi, applicationsApi, candidateApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, MapPin, Search, CheckCircle2, AlertCircle, ArrowUpRight, Upload } from 'lucide-react';

/**
 * ============================================================================
 * MODULE: PublicJobBoard.jsx
 * ASSIGNED TO: // TODO: [Teammate 2: Job Catalog & Requisitions Engineer]
 * 
 * RESPONSIBILITIES:
 * 1. Public Requisition Discovery: Search by keyword, department, location.
 * 2. Role Description & Requirements Modal / Expanded View.
 * 3. One-Click Application: Candidate attaches uploaded resume or submits profile.
 * 4. Unauthenticated guest redirect: Prompts login/registration when clicking Apply.
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - jobsApi.listJobs({ search, department })
 * - applicationsApi.apply({ jobId, resumeId })
 * - candidateApi.getProfile()
 * ============================================================================
 */
export const PublicJobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyResumeId, setApplyResumeId] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  const { isAuthenticated, isCandidate } = useAuth();
  const navigate = useNavigate();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await jobsApi.listJobs({ search, department, status: 'PUBLISHED' });
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [department]);

  // If candidate is logged in, load resumes for quick application
  useEffect(() => {
    if (isAuthenticated && isCandidate) {
      candidateApi.getProfile().then(res => {
        setCandidateProfile(res.data);
        if (res.data?.resumes?.length > 0) {
          setApplyResumeId(res.data.resumes[0].id);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, isCandidate]);

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/jobs' } } });
      return;
    }
    if (!isCandidate) {
      alert('Internal staff accounts (HR/Admin) cannot submit candidate applications.');
      return;
    }
    setApplyingJobId(job.id);
    setSelectedJob(job);
    setApplyError('');
    setApplySuccess('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');
    try {
      await applicationsApi.apply({
        jobId: applyingJobId,
        resumeId: applyResumeId ? parseInt(applyResumeId, 10) : null
      });
      setApplySuccess('Application submitted successfully! Track progress in your Candidate Dashboard.');
      setTimeout(() => {
        setApplyingJobId(null);
        setApplySuccess('');
      }, 3000);
    } catch (err) {
      setApplyError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="bg-indigo-900 text-white rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Careers at NovaTech</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 mb-3">
            Build the Future of Intelligent Systems
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed mb-6">
            Explore our open engineering, product, and operational requisitions. We offer competitive equity, 
            remote flexibility, and high-impact distributed challenges.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-indigo-300 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search job title, skills, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
                className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 rounded-lg text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={loadJobs}
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Search Openings
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Job Cards List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center text-sm font-medium text-slate-500 pb-2">
            <span>Showing {jobs.length} published positions</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Product & Design">Product & Design</option>
            </select>
          </div>

          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`p-6 bg-white rounded-xl border transition-all cursor-pointer ${
                selectedJob?.id === job.id 
                  ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600' 
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-indigo-600">{job.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{job.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span>•</span>
                    <span>{job.employment_type}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyClick(job);
                  }}
                  className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
                >
                  Apply Now
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            </div>
          ))}
        </div>

        {/* Right Column: Sticky Job Detail Inspector & Apply Panel */}
        <div className="sticky top-24 h-fit bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {selectedJob ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Requisition #{selectedJob.id}</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedJob.title}</h2>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedJob.department} • {selectedJob.location}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Role Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedJob.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Requirements</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedJob.requirements}
                </p>
              </div>

              <button
                onClick={() => handleApplyClick(selectedJob)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                Apply for this Role
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a position to inspect requirements and apply.
            </div>
          )}
        </div>
      </div>

      {/* Application Dialog Modal */}
      {applyingJobId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Submit Application: {selectedJob?.title}
            </h3>

            {applySuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{applySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {applyError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Uploaded Resume
                  </label>
                  {candidateProfile?.resumes?.length > 0 ? (
                    <select
                      value={applyResumeId}
                      onChange={(e) => setApplyResumeId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      {candidateProfile.resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.original_filename} ({new Date(r.uploaded_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      No resume uploaded yet. Your profile details will be submitted. You can upload a resume in your Candidate Dashboard.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyingJobId(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Confirm & Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicJobBoard;

