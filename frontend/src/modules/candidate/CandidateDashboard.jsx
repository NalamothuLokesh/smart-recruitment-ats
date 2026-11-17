import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applicationsApi, candidateApi, offersApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
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
  MoreVertical,
  Share2,
  Copy,
  Mail,
  Trash2
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
  const [applications, setApplications] = useState([]);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [deletingApplicationId, setDeletingApplicationId] = useState(null);
  const [applicationDeleteError, setApplicationDeleteError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [resumeMenuId, setResumeMenuId] = useState(null);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [deletingResumeId, setDeletingResumeId] = useState(null);
  const [resumeActionMessage, setResumeActionMessage] = useState('');
  const [resumeActionError, setResumeActionError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [feedback, setFeedback] = useState(() =>
    location.state?.registrationSuccess ? 'Your candidate account is ready. Welcome to Smart ATS.' : ''
  );
  const [activeOffer, setActiveOffer] = useState(null);

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
    try {
      await offersApi.respondToOffer(offerId, decision);
      setFeedback(`You have ${decision.toLowerCase()} the offer!`);
      setActiveOffer(null);
      loadData();
    } catch (err) {
      alert(err.message);
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
      setResumeActionMessage('Resume shared.');
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

  const handleEmailResume = (resume) => {
    const subject = encodeURIComponent(`Resume: ${resume.original_filename}`);
    const body = encodeURIComponent(
      `Please find my resume attached: ${resume.original_filename}.\n\nDownload it from the Resume Vault and attach the file before sending.`
    );
    setResumeMenuId(null);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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

  const handleDeleteApplication = async () => {
    if (!applicationToDelete || deletingApplicationId !== null) return;
    setDeletingApplicationId(applicationToDelete.id);
    setApplicationDeleteError('');
    try {
      await applicationsApi.deleteMyApplication(applicationToDelete.id);
      setFeedback(`Application for ${applicationToDelete.job_title} deleted.`);
      setApplicationToDelete(null);
      await loadData();
    } catch (err) {
      setApplicationDeleteError(err.message || 'Could not delete this application.');
    } finally {
      setDeletingApplicationId(null);
    }
  };

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
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4 text-indigo-600" />
            {uploading ? 'Uploading...' : 'Upload New Resume'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              disabled={uploading}
              className="hidden"
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
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            My Active Applications ({applications.length})
          </h2>

          {applications.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
              <p className="text-sm text-slate-500">You have not submitted any applications yet.</p>
              <a
                href="/jobs"
                className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                Browse Open Positions
              </a>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{app.job_title}</h3>
                    <div className="text-xs text-slate-500">
                      {app.department} • {app.location} • Applied {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start">
                    {Number(app.can_withdraw) === 1 && (
                      <button
                        type="button"
                        onClick={() => { setApplicationDeleteError(''); setApplicationToDelete(app); }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        aria-label={`Delete application for ${app.job_title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete application
                      </button>
                    )}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    app.current_stage === 'OFFERED' ? 'bg-emerald-100 text-emerald-800' :
                    app.current_stage === 'INTERVIEW' ? 'bg-amber-100 text-amber-800' :
                    app.current_stage === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    STAGE: {app.current_stage}
                    </span>
                  </div>
                </div>

                {/* Offer Action Banner if OFFERED */}
                {app.current_stage === 'OFFERED' && app.offer_id && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Gift className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">Congratulations! Employment Offer Issued</div>
                        <div className="text-[11px] text-emerald-700">Please review terms and confirm your acceptance.</div>
                      </div>
                    </div>
                    {app.offer_status === 'ISSUED' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondOffer(app.offer_id, 'ACCEPTED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                        >
                          Accept Offer
                        </button>
                        <button
                          onClick={() => handleRespondOffer(app.offer_id, 'DECLINED')}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold uppercase text-emerald-800">
                        {app.offer_status}
                      </span>
                    )}
                  </div>
                )}

                {/* Timeline Audit History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Stage Progression History</h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1 text-xs">
                    {app.timeline?.map((t) => (
                      <div key={t.id} className="relative">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full absolute -left-[17px] top-1" />
                        <span className="font-semibold text-slate-800">{t.to_stage}: </span>
                        <span className="text-slate-600">{t.notes}</span>
                        <span className="text-[10px] text-slate-400 block">{new Date(t.changed_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Candidate interview schedule */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Interview Schedule
                  </h4>
                  {app.interviews?.length ? (
                    <div className="space-y-2">
                      {app.interviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{new Date(interview.scheduled_at).toLocaleString()}</span>
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-800">
                                {interview.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Clock className="w-3 h-3" />
                              {interview.duration_minutes} minutes
                            </div>
                          </div>
                          {interview.meeting_link && ['SCHEDULED', 'RESCHEDULED'].includes(interview.status) && (
                            <a
                              href={interview.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              Join interview
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                      No interview scheduled yet.
                    </p>
                  )}
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
                </div>

                <div className="flex shrink-0 items-center gap-1">
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
                    <button type="button" role="menuitem" onClick={() => handleResumeShare(resume)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Share2 className="h-3.5 w-3.5" /> Share file
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleCopyResumeName(resume)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Copy className="h-3.5 w-3.5" /> Copy file name
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleEmailResume(resume)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                      <Mail className="h-3.5 w-3.5" /> Email draft
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
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                No resumes uploaded yet.
              </p>
            )}
          </div>
        </div>
      </div>
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-resume-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="delete-resume-title" className="text-lg font-bold text-slate-900">Delete this resume?</h3>
            <p className="mt-2 break-words text-sm text-slate-600">
              “{resumeToDelete.original_filename}” will be removed from your vault. Applications that used it will remain, but will no longer link to this file.
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
      {applicationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-application-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="delete-application-title" className="text-lg font-bold text-slate-900">Delete this application?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Your application for <strong>{applicationToDelete.job_title}</strong> will be removed. You can do this only within 24 hours of applying, before the application has been reviewed or has hiring activity.
            </p>
            {applicationDeleteError && (
              <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {applicationDeleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setApplicationToDelete(null); setApplicationDeleteError(''); }}
                disabled={deletingApplicationId !== null}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Keep application
              </button>
              <button
                type="button"
                onClick={handleDeleteApplication}
                disabled={deletingApplicationId !== null}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingApplicationId !== null ? 'Deleting...' : 'Delete application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;

