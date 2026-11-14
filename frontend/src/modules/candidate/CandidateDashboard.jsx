import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';

/**
 * ============================================================================
 * MODULE: CandidateDashboard.jsx
 * ASSIGNED TO: // TODO: [Teammate 5: Candidate Experience Engineer]
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
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeOffer, setActiveOffer] = useState(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    experienceYears: 0,
    skills: '',
    linkedinUrl: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
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

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5MB size limit.');
      return;
    }

    try {
      setUploading(true);
      await candidateApi.uploadResume(file);
      setFeedback('Resume uploaded successfully to secure private storage.');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean);
      await candidateApi.updateProfile({
        phone: profileForm.phone,
        experienceYears: parseFloat(profileForm.experienceYears) || 0,
        skills: skillsArray,
        linkedinUrl: profileForm.linkedinUrl
      });
      setFeedback('Profile successfully updated.');
      setIsEditingProfile(false);
      loadData();
    } catch (err) {
      alert(err.message);
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
            {uploading ? 'Encrypting & Uploading...' : 'Upload New Resume'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
          >
            {isEditingProfile ? 'Close Editor' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Profile Editor Modal / Inline */}
      {isEditingProfile && (
        <div className="p-6 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 text-base">Edit Candidate Profile</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Save Changes
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

                  <span className={`self-start text-xs font-bold px-3 py-1 rounded-full ${
                    app.current_stage === 'OFFERED' ? 'bg-emerald-100 text-emerald-800' :
                    app.current_stage === 'INTERVIEW' ? 'bg-amber-100 text-amber-800' :
                    app.current_stage === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    STAGE: {app.current_stage}
                  </span>
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
              Your uploaded resumes are stored privately in encrypted server storage and never exposed publicly.
            </p>

            {profile?.resumes?.map((resume) => (
              <div
                key={resume.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2">
                  <div className="font-semibold text-slate-800 truncate">{resume.original_filename}</div>
                  <div className="text-[10px] text-slate-400">
                    {(resume.file_size_bytes / 1024).toFixed(1)} KB • {new Date(resume.uploaded_at).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => candidateApi.downloadResume(resume.id, resume.original_filename)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;

