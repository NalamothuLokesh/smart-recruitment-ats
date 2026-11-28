import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applicationsApi, candidateApi, offersApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { buildInterviewCalendarContent, groupInterviews } from './interviewUtils';
import { 
  User, 
  Briefcase, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  Clock, 
  Gift, 
  ArrowRight,
  AlertCircle,
  Calendar,
  CalendarPlus,
  MoreVertical,
  Eye,
  Share2,
  Copy,
  Mail,
  Trash2,
  CircleX
} from 'lucide-react';

/**
 * ============================================================================
 * MODULE: CandidateDashboard.jsx
 * ASSIGNED TO: // TODO: [Teammate 1: Candidate Experience & Public Portal Engineer]
 * PAIR MODULE: src/modules/hr-jobs/PublicJobBoard.jsx
 * 
 * RESPONSIBILITIES:
 * 1. Candidate Application Tracker: Timeline showing stage transitions.
 * 2. Secure Resume Management: Drag-and-drop / file selector upload with 5MB validation.
 * 3. Offer Letter Review & Response: Formal modal to Accept or Decline offers.
 * 4. Profile Editor: Update phone, skills, experience, and LinkedIn URL.
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - applicationsApi.getMyApplications()
 * - candidateApi.getProfile()
 * - candidateApi.updateProfile(data)
 * - candidateApi.uploadResume(file)
 * - candidateApi.downloadResume(resumeId, filename)
 * - offersApi.respondToOffer(offerId, decision)
 * ============================================================================
 */
export const CandidateDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const candidateTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local timezone';
  const [applications, setApplications] = useState([]);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState(null);
  const [withdrawingApplicationId, setWithdrawingApplicationId] = useState(null);
  const [withdrawalError, setWithdrawalError] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [applicationToDismiss, setApplicationToDismiss] = useState(null);
  const [dismissingApplicationId, setDismissingApplicationId] = useState(null);
  const [dismissalError, setDismissalError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [resumeMenuId, setResumeMenuId] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [previewingResumeId, setPreviewingResumeId] = useState(null);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [deletingResumeId, setDeletingResumeId] = useState(null);
  const [resumeActionMessage, setResumeActionMessage] = useState('');
  const [resumeActionError, setResumeActionError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [feedback, setFeedback] = useState(() =>
    location.state?.registrationSuccess ? 'Your candidate account is ready. Welcome to Smart ATS.' : ''
  );
  const [offerRespondingId, setOfferRespondingId] = useState(null);
  const [offerRespondingDecision, setOfferRespondingDecision] = useState('');
  const [offerResponseError, setOfferResponseError] = useState(null);
  const [offerPreviewLoadingId, setOfferPreviewLoadingId] = useState(null);
  const [offerPreviewError, setOfferPreviewError] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('ALL');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    experienceYears: 0,
    skills: '',
    linkedinUrl: ''
  });

  const handleCancelProfileEdit = () => {
    setProfileForm({
      phone: profile?.phone || '',
      experienceYears: profile?.experienceYears ?? 0,
      skills: profile?.skills?.join(', ') || '',
      linkedinUrl: profile?.linkedinUrl || ''
    });
    setIsEditingProfile(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [appRes, profRes] = await Promise.all([
        applicationsApi.getMyApplications(),
        candidateApi.getProfile()
      ]);
      setApplications(appRes.data || []);
      setProfile(profRes.data || null);
      if (profRes.data) {
        setProfileForm({
          phone: profRes.data.phone || '',
          experienceYears: profRes.data.experienceYears || 0,
          skills: profRes.data.skills?.join(', ') || '',
          linkedinUrl: profRes.data.linkedinUrl || ''
        });
      }
    } catch (err) {
      console.error(err);
      setLoadError(err.message || 'Could not load your candidate dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => () => {
    if (resumePreview?.url) window.URL.revokeObjectURL(resumePreview.url);
  }, [resumePreview]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const input = e.currentTarget;
    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    setUploadError('');
    setFeedback('');

    if (!allowedExtensions.test(file.name)) {
      setUploadError('Choose a PDF, DOC, or DOCX file.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5MB size limit.');
      input.value = '';
      return;
    }

    try {
      setUploading(true);
      await candidateApi.uploadResume(file);
      await loadData();
      setFeedback('Resume uploaded successfully.');
    } catch (err) {
      setUploadError(err.message || 'Could not upload your resume. Please try again.');
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveError('');
    try {
      const skillsArray = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean);
      await candidateApi.updateProfile({
        phone: profileForm.phone,
        experienceYears: parseFloat(profileForm.experienceYears) || 0,
        skills: skillsArray,
        linkedinUrl: profileForm.linkedinUrl.trim() || undefined
      });
      await loadData();
      setFeedback('Profile successfully updated.');
      setIsEditingProfile(false);
    } catch (err) {
      setProfileSaveError(err.message || 'Could not save your profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRespondOffer = async (offerId, decision) => {
    if (offerRespondingId !== null) return;
    setOfferRespondingId(offerId);
    setOfferRespondingDecision(decision);
    setOfferResponseError(null);
    try {
      await offersApi.respondToOffer(offerId, decision);
      await loadData();
      setFeedback(`You have ${decision.toLowerCase()} the offer!`);
      setActiveOffer(null);
    } catch (err) {
      setOfferResponseError({ offerId, message: err.message || 'Could not update your offer response. Please try again.' });
    } finally {
      setOfferRespondingId(null);
      setOfferRespondingDecision('');
    }
  };

  const handleViewOffer = async (application) => {
    if (offerPreviewLoadingId !== null) return;
    setOfferPreviewLoadingId(application.offer_id);
    setOfferPreviewError(null);
    setOfferResponseError(null);
    try {
      const response = await offersApi.getOnboarding(application.offer_id);
      const offer = response.data?.data?.offer;
      if (!offer) throw new Error('Offer details are unavailable. Please try again later.');
      setActiveOffer(offer);
    } catch (err) {
      setOfferPreviewError({
        offerId: application.offer_id,
        message: err.message || 'Could not load the offer details.'
      });
    } finally {
      setOfferPreviewLoadingId(null);
    }
  };

  const handleResumeDownload = async (resume) => {
    setDownloadError('');
    setDownloadingResumeId(resume.id);
    try {
      await candidateApi.downloadResume(resume.id, resume.original_filename);
    } catch (err) {
      setDownloadError(err.message || 'Could not download your resume. Please try again.');
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const handleResumePreview = async (resume) => {
    setResumeMenuId(null);
    setResumeActionError('');
    setResumeActionMessage('');
    setPreviewingResumeId(resume.id);
    try {
      const file = await candidateApi.getResumeFile(resume.id, resume.original_filename);
      if (file.type !== 'application/pdf' && !resume.original_filename.toLowerCase().endsWith('.pdf')) {
        throw new Error('This file is not a PDF. Download DOC or DOCX resumes to open them in a document app.');
      }
      if (file.type && file.type !== 'application/pdf') {
        throw new Error('The server did not return a valid PDF file. Try downloading it or upload the resume again.');
      }
      const url = window.URL.createObjectURL(file);
      setResumePreview({ filename: resume.original_filename, url });
    } catch (err) {
      setResumeActionError(err.message || 'Could not preview this resume. Try downloading it instead.');
    } finally {
      setPreviewingResumeId(null);
    }
  };

  const handleResumeShare = async (resume) => {
    setResumeMenuId(null);
    setResumeActionMessage('');
    setResumeActionError('');
    try {
      if (!navigator.share || !navigator.canShare) {
        throw new Error('File sharing is not supported in this browser. Download the resume to share it manually.');
      }
      const file = await candidateApi.getResumeFile(resume.id, resume.original_filename);
      if (!navigator.canShare({ files: [file] })) {
        throw new Error('This browser cannot share resume files. Download the resume to share it manually.');
      }
      await navigator.share({ title: resume.original_filename, files: [file] });
      setResumeActionMessage('Resume file shared successfully.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setResumeActionError(err.message || 'Could not share this resume.');
      }
    }
  };

  const handleCopyResumeName = async (resume) => {
    setResumeMenuId(null);
    setResumeActionMessage('');
    setResumeActionError('');
    try {
      await navigator.clipboard.writeText(resume.original_filename);
      setResumeActionMessage('Resume file name copied.');
    } catch {
      setResumeActionError('Could not copy the file name. Check your browser clipboard permissions.');
    }
  };

  const handleEmailResume = (resume, provider = 'default') => {
    const subject = encodeURIComponent(`Resume: ${resume.original_filename}`);
    const body = encodeURIComponent(
      `Please find my resume attached: ${resume.original_filename}.\n\nDownload it from the Resume Vault and attach the file before sending.`
    );
    setResumeMenuId(null);
    if (provider === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleAddInterviewToCalendar = (application, interview) => {
    try {
      const calendarContent = buildInterviewCalendarContent(application.job_title, interview);
      const file = new Blob([calendarContent], { type: 'text/calendar;charset=utf-8' });
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      const safeTitle = application.job_title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'interview';
      link.href = fileUrl;
      link.download = `${safeTitle}-interview.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      setFeedback('Calendar invite downloaded. Open it to add the interview and reminders to your calendar.');
    } catch (err) {
      setFeedback(err.message || 'Could not create the calendar invite.');
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeToDelete || deletingResumeId !== null) return;
    setDeletingResumeId(resumeToDelete.id);
    setResumeActionError('');
    try {
      await candidateApi.deleteResume(resumeToDelete.id);
      setFeedback(`Deleted ${resumeToDelete.original_filename}.`);
      setResumeToDelete(null);
      await loadData();
    } catch (err) {
      setResumeActionError(err.message || 'Could not delete this resume. Please try again.');
    } finally {
      setDeletingResumeId(null);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!applicationToWithdraw || withdrawingApplicationId !== null) return;
    setWithdrawingApplicationId(applicationToWithdraw.id);
    setWithdrawalError('');
    try {
      await applicationsApi.withdrawMyApplication(applicationToWithdraw.id, withdrawalReason.trim());
      setFeedback(`Application for ${applicationToWithdraw.job_title} withdrawn. Its history has been kept.`);
      setApplicationToWithdraw(null);
      setWithdrawalReason('');
      await loadData();
    } catch (err) {
      setWithdrawalError(err.message || 'Could not withdraw this application.');
    } finally {
      setWithdrawingApplicationId(null);
    }
  };

  const handleDismissWithdrawnApplication = async () => {
    if (!applicationToDismiss || dismissingApplicationId !== null) return;
    setDismissingApplicationId(applicationToDismiss.id);
    setDismissalError('');
    try {
      await applicationsApi.dismissWithdrawnApplication(applicationToDismiss.id);
      setFeedback(`Application for ${applicationToDismiss.job_title} was removed from your list. Its hiring history is retained.`);
      setApplicationToDismiss(null);
      await loadData();
    } catch (err) {
      setDismissalError(err.message || 'Could not remove this application from your list. Please try again.');
    } finally {
      setDismissingApplicationId(null);
    }
  };

  const getActiveApplicationCountForResume = (resumeId) => applications.filter(
    (application) => !application.withdrawn_at && Number(application.resume_id) === Number(resumeId)
  ).length;

  const completedProfileItems = [
    Boolean(profile?.phone),
    profile?.experienceYears !== null && profile?.experienceYears !== undefined,
    Boolean(profile?.skills?.length),
    Boolean(profile?.linkedinUrl),
    Boolean(profile?.resumes?.length)
  ].filter(Boolean).length;
  const profileCompletionPercent = Math.round((completedProfileItems / 5) * 100);
  const filteredApplications = applications.filter((application) => {
    const status = application.withdrawn_at ? 'WITHDRAWN' : application.current_stage;
    const query = applicationSearch.trim().toLocaleLowerCase();
    const matchesStatus = applicationStatusFilter === 'ALL' || status === applicationStatusFilter;
    const matchesSearch = !query || [application.job_title, application.department, application.location]
      .some((value) => value?.toLocaleLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  if (loading && !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p className="text-sm font-medium">Loading your candidate dashboard...</p>
      </div>
    );
  }

  if (loadError && !profile) {
    return (
      <div className="max-w-xl mx-auto my-16 rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-600" />
        <h2 className="text-lg font-bold text-slate-900">Dashboard couldn’t load</h2>
        <p role="alert" className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button onClick={loadData} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.fullName || user?.fullName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Candidate ID #{user?.id} • {profile?.email || user?.email}
          </p>
          <div className="mt-4 max-w-sm" aria-label={`Profile details ${profileCompletionPercent}% complete`}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Profile details</span>
              <span className="font-medium text-slate-500">{completedProfileItems}/5 added</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={profileCompletionPercent}
              aria-label="Candidate profile completeness"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${profileCompletionPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="candidate-resume-upload" className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus-within:ring-2 focus-within:ring-indigo-500">
            <Upload className="w-4 h-4 text-indigo-600" />
            {uploading ? 'Uploading...' : 'Upload New Resume'}
            <input
              id="candidate-resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>

          <button
            onClick={() => isEditingProfile ? handleCancelProfileEdit() : setIsEditingProfile(true)}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
          >
            {isEditingProfile ? 'Close Editor' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center" role="status" aria-live="polite">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Profile Editor Modal / Inline */}
      {isEditingProfile && (
        <div className="p-6 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 text-base">Edit Candidate Profile</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {profileSaveError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {profileSaveError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1-555-0101"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={profileForm.experienceYears}
                  onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={profileForm.linkedinUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                value={profileForm.skills}
                onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelProfileEdit}
                disabled={profileSaving}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-lg text-xs font-semibold"
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Applications Tracker + Stored Resumes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              My Applications <span className="text-sm font-medium text-slate-500">({filteredApplications.length} of {applications.length})</span>
            </h2>
            {applications.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="relative">
                  <label htmlFor="application-search" className="sr-only">Search applications by job, department, or location</label>
                  <input
                    id="application-search"
                    type="search"
                    value={applicationSearch}
                    onChange={(event) => setApplicationSearch(event.target.value)}
                    placeholder="Search applications"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label htmlFor="application-status-filter" className="sr-only">Filter applications by status</label>
                  <select
                    id="application-status-filter"
                    value={applicationStatusFilter}
                    onChange={(event) => setApplicationStatusFilter(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="ALL">All statuses</option>
                    {['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'REJECTED', 'WITHDRAWN'].map((status) => (
                      <option key={status} value={status}>{status === 'APPLIED' ? 'Applied' : status.charAt(0) + status.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center" role="status">
              <Briefcase className="mx-auto mb-3 h-8 w-8 text-indigo-500" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-800">Your application list is empty</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Explore open roles and apply when you find a good match. Your applications and updates will appear here.</p>
              <a
                href="/jobs"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Browse Open Positions
              </a>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center" role="status" aria-live="polite">
              <h3 className="text-sm font-semibold text-slate-800">No applications match these filters</h3>
              <p className="mt-1 text-xs text-slate-500">Try another search term or status.</p>
              <button
                type="button"
                onClick={() => { setApplicationSearch(''); setApplicationStatusFilter('ALL'); }}
                className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.id} className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 ${app.withdrawn_at ? 'opacity-80' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{app.job_title}</h3>
                    <div className="text-xs text-slate-500">
                      {app.department} • {app.location} • Applied {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start">
                    {app.withdrawn_at && app.job_status === 'PUBLISHED' && !applications.some(
                      (otherApplication) => Number(otherApplication.job_id) === Number(app.job_id) && !otherApplication.withdrawn_at
                    ) && (
                      <a
                        href={`/jobs?applyJob=${encodeURIComponent(app.job_id)}`}
                        className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        Apply again
                      </a>
                    )}
                    {app.withdrawn_at && (
                      <button
                        type="button"
                        onClick={() => { setDismissalError(''); setApplicationToDismiss(app); }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        aria-label={`Remove withdrawn application for ${app.job_title} from your list`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove from list
                      </button>
                    )}
                    {Number(app.can_withdraw) === 1 && (
                      <button
                        type="button"
                        onClick={() => { setWithdrawalError(''); setWithdrawalReason(''); setApplicationToWithdraw(app); }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        aria-label={`Withdraw application for ${app.job_title}`}
                      >
                        <CircleX className="h-3.5 w-3.5" /> Withdraw application
                      </button>
                    )}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${app.withdrawn_at
                    ? 'bg-rose-100 text-rose-800' :
                    app.current_stage === 'OFFERED' ? 'bg-emerald-100 text-emerald-800' :
                    app.current_stage === 'INTERVIEW' ? 'bg-amber-100 text-amber-800' :
                    app.current_stage === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    STAGE: {app.withdrawn_at ? 'WITHDRAWN' : app.current_stage}
                    </span>
                  </div>
                </div>

                {/* Offer Action Banner if OFFERED */}
                {app.current_stage === 'OFFERED' && app.offer_id && (
                  <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <Gift className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          {app.offer_status === 'ISSUED' ? 'Employment offer received' : `Offer ${app.offer_status?.toLowerCase() || 'updated'}`}
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          {app.offer_status === 'ISSUED' ? 'Review the offer details before you respond.' : 'Your response has been recorded.'}
                        </div>
                      </div>
                    </div>
                    {app.offer_status === 'ISSUED' ? (
                      <div className="space-y-2 sm:text-right">
                        {offerPreviewError?.offerId === app.offer_id && (
                          <p role="alert" className="text-xs text-rose-700">{offerPreviewError.message}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleViewOffer(app)}
                          disabled={offerPreviewLoadingId !== null || offerRespondingId !== null}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                        >
                          {offerPreviewLoadingId === app.offer_id ? 'Loading offer...' : 'Review offer'}
                        </button>
                      </div>
                    ) : (
                      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-emerald-800">{app.offer_status}</span>
                    )}
                  </div>
                )}

                {/* Application stage tracker and audit history */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Application Timeline</h4>
                  {(() => {
                    const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED'];
                    const reachedStages = new Set((app.timeline || []).map((event) => event.to_stage));
                    reachedStages.add(app.current_stage);
                    const terminalStage = app.withdrawn_at ? 'WITHDRAWN' : app.current_stage === 'REJECTED' ? 'REJECTED' : null;

                    return (
                      <>
                        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {stages.map((stage) => {
                            const reached = reachedStages.has(stage);
                            const current = !terminalStage && app.current_stage === stage;
                            const latestEvent = [...(app.timeline || [])].reverse().find((event) => event.to_stage === stage);
                            return (
                              <li key={stage} className={`rounded-lg border px-3 py-2 ${current
                                ? 'border-indigo-300 bg-indigo-50'
                                : reached ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                <div className={`text-[11px] font-bold ${current ? 'text-indigo-800' : reached ? 'text-emerald-800' : 'text-slate-500'}`}>
                                  {reached ? '✓ ' : '○ '}{stage}
                                  {current && <span className="ml-1 font-medium">· Current</span>}
                                </div>
                                {latestEvent && <time className="mt-1 block text-[10px] text-slate-500">{new Date(latestEvent.changed_at).toLocaleDateString()}</time>}
                              </li>
                            );
                          })}
                          {terminalStage && (
                            <li className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                              <div className="text-[11px] font-bold text-rose-800">● {terminalStage}</div>
                              <time className="mt-1 block text-[10px] text-rose-700">
                                {new Date(app.withdrawn_at || (app.timeline || []).find((event) => event.to_stage === 'REJECTED')?.changed_at || app.updated_at).toLocaleDateString()}
                              </time>
                            </li>
                          )}
                        </ol>

                        <details className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-700">View status update history</summary>
                          {(app.timeline?.length > 0 || app.withdrawn_at) ? (
                            <ol className="mt-3 space-y-3 border-l-2 border-slate-200 pl-3 text-xs">
                              {app.timeline?.map((event) => {
                                const wasWithdrawn = event.notes?.includes('withdrew this application');
                                return (
                                  <li key={event.id} className="relative">
                                    <span className={`absolute -left-[17px] top-1 h-2 w-2 rounded-full ${wasWithdrawn ? 'bg-rose-500' : 'bg-indigo-600'}`} />
                                    <div className="font-semibold text-slate-800">
                                      {wasWithdrawn ? 'Application withdrawn' : event.from_stage ? `${event.from_stage} → ${event.to_stage}` : `Application ${event.to_stage.toLowerCase()}`}
                                    </div>
                                    {event.notes && !wasWithdrawn && <div className="mt-0.5 text-slate-600">{event.notes}</div>}
                                    {wasWithdrawn && event.notes?.includes('Reason:') && (
                                      <div className="mt-0.5 text-slate-600">Your reason: {event.notes.split('Reason:').slice(1).join('Reason:').trim()}</div>
                                    )}
                                    <time className="mt-0.5 block text-[10px] text-slate-400">{new Date(event.changed_at).toLocaleString()}</time>
                                  </li>
                                );
                              })}
                              {app.withdrawn_at && !(app.timeline || []).some((event) => event.notes?.includes('withdrew this application')) && (
                                <li className="relative">
                                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-rose-500" />
                                  <div className="font-semibold text-rose-800">Application withdrawn</div>
                                  <time className="mt-0.5 block text-[10px] text-slate-400">{new Date(app.withdrawn_at).toLocaleString()}</time>
                                </li>
                              )}
                            </ol>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">No status updates have been recorded yet.</p>
                          )}
                        </details>
                      </>
                    );
                  })()}
                </div>

                {/* Candidate interview schedule */}
                <div>
                  {(() => {
                    const interviews = app.interviews || [];
                    const { upcoming, past, cancelled } = groupInterviews(interviews);
                    const renderInterview = (interview, isUpcoming) => (
                      <div
                        key={interview.id}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                            <time dateTime={new Date(interview.scheduled_at).toISOString()}>
                              {new Date(interview.scheduled_at).toLocaleString(undefined, {
                                timeZone: candidateTimeZone,
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
                              })}
                            </time>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${interview.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : isUpcoming ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>
                              {interview.status}
                            </span>
                          </div>
                          {interview.status === 'RESCHEDULED' && (
                            <p className="mt-1 text-[11px] font-medium text-amber-700">Rescheduled — the time above is the latest schedule.</p>
                          )}
                          {interview.status === 'CANCELLED' && (
                            <p className="mt-1 text-[11px] font-medium text-rose-700">Cancelled — this interview will not take place.</p>
                          )}
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {interview.duration_minutes} minutes
                          </div>
                        </div>
                        {isUpcoming && (
                          <div className="flex flex-wrap gap-2">
                            {interview.meeting_link && (
                              <a
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              >
                                Join interview
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddInterviewToCalendar(app, interview)}
                              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" /> Add to calendar
                            </button>
                          </div>
                        )}
                      </div>
                    );

                    if (interviews.length === 0) {
                      return (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500" role="status">
                          <h4 className="font-semibold text-slate-700">Interview Schedule</h4>
                          <p className="mt-1">No interview scheduled yet. If one is arranged, its date and details will appear here.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <p className="text-[11px] text-slate-500">Interview times are shown in your local timezone: <span className="font-medium text-slate-700">{candidateTimeZone}</span></p>
                        <section aria-label="Upcoming interviews">
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                            <Calendar className="h-4 w-4" aria-hidden="true" /> Upcoming interviews ({upcoming.length})
                          </h4>
                          {upcoming.length ? (
                            <div className="space-y-2">{upcoming.map((interview) => renderInterview(interview, true))}</div>
                          ) : (
                            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No upcoming interviews scheduled.</p>
                          )}
                        </section>
                        {past.length > 0 && (
                          <section aria-label="Past interviews">
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Past interviews ({past.length})</h4>
                            <div className="space-y-2">{past.map((interview) => renderInterview(interview, false))}</div>
                          </section>
                        )}
                        {cancelled.length > 0 && (
                          <section aria-label="Cancelled interviews">
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-700">Cancelled interviews ({cancelled.length})</h4>
                            <div className="space-y-2">{cancelled.map((interview) => renderInterview(interview, false))}</div>
                          </section>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Private Resumes Vault */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Resume Vault
          </h2>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Your uploaded resumes are stored privately and are only available through your account.
            </p>

            {uploadError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {uploadError}
              </p>
            )}
            {downloadError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {downloadError}
              </p>
            )}
            {resumeActionMessage && (
              <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                {resumeActionMessage}
              </p>
            )}
            {resumeActionError && !resumeToDelete && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {resumeActionError}
              </p>
            )}

            {profile?.resumes?.map((resume) => (
              <div
                key={resume.id}
                className="relative p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 truncate">
                  <button
                    type="button"
                    onClick={() => setResumeMenuId(resumeMenuId === resume.id ? null : resume.id)}
                    className="block max-w-full truncate text-left font-semibold text-slate-800 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-expanded={resumeMenuId === resume.id}
                    aria-label={`Open actions for ${resume.original_filename}`}
                  >
                    {resume.original_filename}
                  </button>
                  <div className="text-[10px] text-slate-400">
                    {(resume.file_size_bytes / 1024).toFixed(1)} KB • {new Date(resume.uploaded_at).toLocaleDateString()}
                  </div>
                  {getActiveApplicationCountForResume(resume.id) > 0 && (
                    <div className="mt-1 text-[10px] font-medium text-indigo-700">
                      Used in {getActiveApplicationCountForResume(resume.id)} active {getActiveApplicationCountForResume(resume.id) === 1 ? 'application' : 'applications'}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {(resume.mime_type === 'application/pdf' || resume.original_filename.toLowerCase().endsWith('.pdf')) && (
                    <button
                      type="button"
                      onClick={() => handleResumePreview(resume)}
                      disabled={previewingResumeId !== null}
                      className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-wait disabled:opacity-60"
                      title="Preview PDF"
                      aria-label={`Preview ${resume.original_filename}`}
                    >
                      {previewingResumeId === resume.id ? <span className="px-0.5 text-[10px]">...</span> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleResumeDownload(resume)}
                    disabled={downloadingResumeId !== null}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60 rounded border border-indigo-200"
                    title="Download File"
                    aria-label={`Download ${resume.original_filename}`}
                  >
                    {downloadingResumeId === resume.id ? (
                      <span className="text-[10px] font-semibold">...</span>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeMenuId(resumeMenuId === resume.id ? null : resume.id)}
                    className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label={`More actions for ${resume.original_filename}`}
                    aria-haspopup="menu"
                    aria-expanded={resumeMenuId === resume.id}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {resumeMenuId === resume.id && (
                  <div role="menu" className="absolute right-3 top-12 z-20 min-w-48 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                    {!resume.original_filename.toLowerCase().endsWith('.pdf') && (
                      <p className="px-3 py-2 text-[10px] leading-relaxed text-slate-500">Word resumes cannot be previewed in this browser. Download to open them.</p>
                    )}
                    <button type="button" role="menuitem" onClick={() => handleResumeShare(resume)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Share2 className="h-3.5 w-3.5" /> Share file
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleCopyResumeName(resume)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Copy className="h-3.5 w-3.5" /> Copy file name
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleEmailResume(resume, 'gmail')} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Mail className="h-3.5 w-3.5" /> Open Gmail draft
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleEmailResume(resume)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Mail className="h-3.5 w-3.5" /> Open default email app
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setResumeMenuId(null);
                        setResumeActionError('');
                        setResumeToDelete(resume);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete resume
                    </button>
                  </div>
                )}
              </div>
            ))}
            {profile?.resumes?.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center" role="status">
                <FileText className="mx-auto mb-2 h-6 w-6 text-slate-400" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-700">No resume in your vault yet</p>
                <p className="mt-1 text-[11px] text-slate-500">Upload a PDF or Word document to attach it when applying.</p>
                <label htmlFor="candidate-resume-upload" className="mt-3 inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 focus-within:ring-2 focus-within:ring-indigo-500">
                  {uploading ? 'Uploading...' : 'Choose a resume'}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
      {resumePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-preview-title"
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 id="resume-preview-title" className="text-sm font-bold text-slate-900">Resume preview</h2>
                <p className="max-w-[70vw] truncate text-xs text-slate-500">{resumePreview.filename}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resumePreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setResumePreview(null)}
                  className="min-h-9 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </header>
            <iframe
              src={resumePreview.url}
              title={`PDF preview: ${resumePreview.filename}`}
              className="h-[75vh] min-h-[320px] w-full bg-slate-100"
            />
            <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">
              If the preview is blank, use “Open in new tab” or the Download button in your Resume Vault.
            </p>
          </section>
        </div>
      )}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-resume-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="delete-resume-title" className="text-lg font-bold text-slate-900">Delete this resume?</h3>
            <p className="mt-2 break-words text-sm text-slate-600">
              “{resumeToDelete.original_filename}” will be removed from your vault. {getActiveApplicationCountForResume(resumeToDelete.id) > 0
                ? `It is attached to ${getActiveApplicationCountForResume(resumeToDelete.id)} active ${getActiveApplicationCountForResume(resumeToDelete.id) === 1 ? 'application' : 'applications'}. Those applications will remain, but their resume attachment will be cleared.`
                : 'Applications will remain in your history.'}
            </p>
            {resumeActionError && (
              <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {resumeActionError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setResumeToDelete(null); setResumeActionError(''); }}
                disabled={deletingResumeId !== null}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteResume}
                disabled={deletingResumeId !== null}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingResumeId !== null ? 'Deleting...' : 'Delete resume'}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-offer-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Employment offer</p>
                <h2 id="candidate-offer-title" className="mt-1 text-xl font-bold text-slate-900">{activeOffer.job_title}</h2>
                <p className="mt-1 text-xs text-slate-500">Issued {activeOffer.issued_at ? new Date(activeOffer.issued_at).toLocaleDateString() : 'date unavailable'}</p>
              </div>
              <button
                type="button"
                onClick={() => { setActiveOffer(null); setOfferResponseError(null); }}
                disabled={offerRespondingId !== null}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                Close
              </button>
            </header>
            <div className="overflow-y-auto p-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase text-slate-500">Annual salary</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900">{Number(activeOffer.salary_offered).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase text-slate-500">Joining date</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900">
                    {activeOffer.joining_date
                      ? new Date(`${String(activeOffer.joining_date).slice(0, 10)}T00:00:00`).toLocaleDateString()
                      : 'Not provided'}
                  </dd>
                </div>
                {activeOffer.location && (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase text-slate-500">Location</dt>
                    <dd className="mt-1 text-sm text-slate-800">{activeOffer.location}</dd>
                  </div>
                )}
                {activeOffer.generated_by_name && (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase text-slate-500">Prepared by</dt>
                    <dd className="mt-1 text-sm text-slate-800">{activeOffer.generated_by_name}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-900">Offer letter</h3>
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-4 font-sans text-sm leading-6 text-slate-700">
                  {activeOffer.offer_letter_content || 'Offer letter details are unavailable.'}
                </pre>
              </div>
            </div>
            {activeOffer.status === 'ISSUED' ? (
              <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-h-5">
                  {offerResponseError?.offerId === activeOffer.id && <p role="alert" className="text-xs text-rose-700">{offerResponseError.message}</p>}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleRespondOffer(activeOffer.id, 'DECLINED')}
                    disabled={offerRespondingId !== null}
                    className="min-h-10 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-wait disabled:opacity-60"
                  >
                    {offerRespondingId === activeOffer.id && offerRespondingDecision === 'DECLINED' ? 'Declining...' : 'Decline offer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondOffer(activeOffer.id, 'ACCEPTED')}
                    disabled={offerRespondingId !== null}
                    className="min-h-10 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                  >
                    {offerRespondingId === activeOffer.id && offerRespondingDecision === 'ACCEPTED' ? 'Accepting...' : 'Accept offer'}
                  </button>
                </div>
              </footer>
            ) : (
              <footer className="border-t border-slate-200 p-5 sm:p-6">
                <p className="text-sm font-semibold text-slate-700">You have already responded: {activeOffer.status}.</p>
              </footer>
            )}
          </section>
        </div>
      )}
      {applicationToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="withdraw-application-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="withdraw-application-title" className="text-lg font-bold text-slate-900">Withdraw this application?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Your application for <strong>{applicationToWithdraw.job_title}</strong> will be marked withdrawn. Its application and review history will be retained. You can withdraw within 24 hours of applying, before it is reviewed or has hiring activity.
            </p>
            <div className="mt-4">
              <label htmlFor="withdrawal-reason" className="mb-1 block text-xs font-semibold text-slate-700">Reason <span className="font-normal text-slate-500">(optional)</span></label>
              <textarea
                id="withdrawal-reason"
                value={withdrawalReason}
                onChange={(event) => setWithdrawalReason(event.target.value.slice(0, 500))}
                maxLength={500}
                rows={3}
                placeholder="Share a reason with the hiring team, if you’d like."
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                aria-describedby="withdrawal-reason-count"
              />
              <div id="withdrawal-reason-count" className="mt-1 text-right text-[10px] text-slate-500">{withdrawalReason.length}/500</div>
            </div>
            {withdrawalError && (
              <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {withdrawalError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setApplicationToWithdraw(null); setWithdrawalError(''); setWithdrawalReason(''); }}
                disabled={withdrawingApplicationId !== null}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Keep application
              </button>
              <button
                type="button"
                onClick={handleWithdrawApplication}
                disabled={withdrawingApplicationId !== null}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                {withdrawingApplicationId !== null ? 'Withdrawing...' : 'Withdraw application'}
              </button>
            </div>
          </div>
        </div>
      )}
      {applicationToDismiss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="dismiss-application-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="dismiss-application-title" className="text-lg font-bold text-slate-900">Remove withdrawn application?</h3>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{applicationToDismiss.job_title}</strong> will no longer appear in your application list. The hiring team’s application and review history will be retained. If the job is still open, you can apply again from Job Openings.
            </p>
            {dismissalError && (
              <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {dismissalError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setApplicationToDismiss(null); setDismissalError(''); }}
                disabled={dismissingApplicationId !== null}
                className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Keep in list
              </button>
              <button
                type="button"
                onClick={handleDismissWithdrawnApplication}
                disabled={dismissingApplicationId !== null}
                className="min-h-10 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60"
              >
                {dismissingApplicationId !== null ? 'Removing...' : 'Remove from list'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;

