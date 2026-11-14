import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Mail,
  Lock,
  Phone,
  Linkedin,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Loader2,
  Code2
} from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    experienceYears: '3.0',
    skills: 'React, Node.js, TypeScript',
    linkedinUrl: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        experienceYears: parseFloat(formData.experienceYears) || 0,
        skills: skillsArray,
        linkedinUrl: formData.linkedinUrl
      });

      navigate('/candidate', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />

      <div className="auth-card animate-fadeIn" style={{ maxWidth: '580px' }}>
        {/* Brand Emblem */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <UserCheck size={22} strokeWidth={2.4} />
          </div>
          <span className="auth-brand-name">Smart ATS</span>
        </div>

        <h1 className="auth-title">Candidate Registration</h1>
        <p className="auth-sub">Create your candidate profile to apply to open requisitions</p>

        {/* Error Alert */}
        {error && (
          <div className="auth-error animate-fadeIn">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="auth-field">
              <label className="auth-label">Full Name *</label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type="text"
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Email Address *</label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane.doe@example.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="auth-field">
              <label className="auth-label">Password * (min 8 chars)</label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type="password"
                  required
                  minLength={8}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Phone Number</label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1-555-0199"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="auth-field">
              <label className="auth-label">Years of Experience</label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type="number"
                  step="0.5"
                  min="0"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">LinkedIn Profile URL</label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Core Technical Skills (comma separated)</label>
            <div className="auth-inp-wrap">
              <input
                className="auth-inp"
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, MySQL, Cloud Architecture"
              />
            </div>
          </div>

          <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Creating Profile...
              </>
            ) : (
              <>
                <span>Complete Registration</span> <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Already registered?</span>{' '}
          <Link to="/login" className="auth-link-highlight">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
