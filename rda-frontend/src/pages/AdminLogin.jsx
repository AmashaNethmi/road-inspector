import React, { useState } from 'react';
import { MapPin, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'rda2024';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        onLogin();
      } else {
        setError('Invalid username or password.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(0,242,254,0.08) 0%, transparent 70%)',
        top: '-100px', left: '-100px', borderRadius: '50%', animation: 'pulse 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(79,172,254,0.06) 0%, transparent 70%)',
        bottom: '-80px', right: '-80px', borderRadius: '50%', animation: 'pulse 8s ease-in-out infinite reverse',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', padding: '1.5rem' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(0,242,254,0.15), rgba(79,172,254,0.15))',
            border: '1px solid rgba(0,242,254,0.3)',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(0,242,254,0.2)',
          }}>
            <MapPin size={36} color="#00f2fe" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700,
            background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.4rem',
          }}>Road Inspector RDA</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Admin Control Panel</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(19,20,28,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: '2.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <ShieldCheck size={18} color="#00f2fe" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Secure Administrator Access
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '0.8rem 0.9rem 0.8rem 2.5rem',
                    background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-light)',
                    borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0,242,254,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '0.8rem 2.8rem 0.8rem 2.5rem',
                    background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-light)',
                    borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0,242,254,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.3)',
                color: 'var(--danger)', fontSize: '0.875rem',
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '0.5rem', padding: '0.9rem',
                background: isLoading ? 'rgba(0,242,254,0.3)' : 'var(--accent-gradient)',
                border: 'none', borderRadius: '10px', color: 'white',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.15s',
                boxShadow: '0 4px 20px rgba(0,242,254,0.25)',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
            >
              {isLoading ? 'Authenticating…' : 'Login to Dashboard'}
            </button>
          </form>

          {/* Hint */}
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Demo credentials — user: <strong style={{color:'var(--text-secondary)'}}>admin</strong> / pass: <strong style={{color:'var(--text-secondary)'}}>rda2024</strong>
          </p>
        </div>

        {/* Footer link to public portal */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Not an admin?{' '}
          <a href="/report" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Go to Citizen Portal →
          </a>
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
