import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const customStyles = {
  bgPrimary: '#0B0E1A',
  bgSecondary: '#111827',
  surface: '#1A2235',
  surfaceHover: '#232d42',
  accentPrimary: '#00C37B',
  accentHover: '#00a86b',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#1E293B',
  danger: '#EF4444',
};

const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animFrameId;
    let particles = [];
    let width, height;

    class Particle {
      constructor(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.3 + 0.1;
      }
      update(w, h) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }
      draw(ctx) {
        ctx.fillStyle = `rgba(100, 116, 139, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = [];
      const count = Math.floor((width * height) / 15000);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(width, height));
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(width, height);
        particles[i].draw(ctx);
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(100, 116, 139, ${0.1 * (1 - dist / 100)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.4,
        pointerEvents: 'none',
      }}
    />
  );
};

const BrandLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: customStyles.accentPrimary }}>
      <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
    </svg>
    <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', fontFamily: "'Inter', sans-serif" }}>
      BET<span style={{ color: customStyles.accentPrimary }}>ARENA</span>
    </div>
  </div>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', color: '#0B0E1A' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={customStyles.danger}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" stroke="white" strokeWidth="2" />
    <line x1="12" y1="16" x2="12.01" y2="16" stroke="white" strokeWidth="2" />
  </svg>
);

const InfoModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111827', border: '1px solid #1E293B', borderRadius: '16px',
        padding: '32px', maxWidth: '380px', width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,195,123,0.1)', border: '1px solid #00C37B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>ℹ️</div>
          <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: "'Inter', sans-serif" }}>{title}</h3>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px', fontFamily: "'Inter', sans-serif" }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            width: '100%', background: '#00C37B', color: '#000', border: 'none',
            padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = '#00a86b'}
          onMouseLeave={e => e.target.style.background = '#00C37B'}
        >
          Got it
        </button>
      </div>
    </div>
  );
};

const LoginCard = ({ initialUsername, initialPassword }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, isLoading, isAuthenticated, user } = useAuthStore();
  const [username, setUsername] = useState(initialUsername || '');
  const [password, setPassword] = useState(initialPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorText, setErrorText] = useState('Invalid username or password');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [forgotHovered, setForgotHovered] = useState(false);
  const [contactHovered, setContactHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [freshLogin, setFreshLogin] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap');
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }
      .shake-anim { animation: shake 0.4s ease-in-out; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Clear any stale session so the user can log in fresh
  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect only after a fresh login from this page
  useEffect(() => {
    if (!freshLogin || !isAuthenticated || !user?.role) return;

    const roleHome = user.role === 'admin'
      ? '/admin/overview'
      : (user.role === 'agent' || user.role === 'sub_agent')
        ? '/agent/dashboard'
        : '/sports';

    const next = searchParams?.get('next');
    // Only follow ?next= if it matches the user's role area
    if (next) {
      const isAdminRoute = next.startsWith('/admin');
      const isAgentRoute = next.startsWith('/agent');
      const isMemberRoute = !isAdminRoute && !isAgentRoute;

      const allowed =
        (user.role === 'admin' && isAdminRoute) ||
        ((user.role === 'agent' || user.role === 'sub_agent') && isAgentRoute) ||
        (user.role === 'member' && isMemberRoute);

      router.replace(allowed ? next : roleHome);
      return;
    }

    router.replace(roleHome);
  }, [freshLogin, isAuthenticated, user, router, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('Invalid username or password');
    if (!username || !password) {
      setHasError(true);
      setErrorText('Username and password are required');
      setShakeKey(k => k + 1);
      return;
    }

    try {
      await login(username, password);
      setHasError(false);
      setFreshLogin(true);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setHasError(true);
      setErrorText(apiMessage || 'Invalid username or password');
      setShakeKey(k => k + 1);
    }
  };

  const inputBaseStyle = {
    width: '100%',
    background: hasError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(11, 14, 26, 0.6)',
    border: `1px solid ${hasError ? customStyles.danger : customStyles.border}`,
    borderRadius: '8px',
    padding: '12px 40px',
    color: hasError ? customStyles.danger : customStyles.textPrimary,
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const inputFocusStyle = (focused) => ({
    borderColor: hasError ? customStyles.danger : (focused ? customStyles.accentPrimary : customStyles.border),
    boxShadow: focused ? (hasError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 0 0 3px rgba(0, 195, 123, 0.15)') : 'none',
    background: hasError ? 'rgba(239, 68, 68, 0.05)' : (focused ? 'rgba(11, 14, 26, 0.9)' : 'rgba(11, 14, 26, 0.6)'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '400px',
        background: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${customStyles.border}`,
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
      }}>
        <div style={{
          content: '',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }} />

        <BrandLogo />

        <div style={{ textAlign: 'center', fontSize: '13px', color: customStyles.textTertiary, letterSpacing: '0.5px', marginBottom: '24px', fontWeight: 500 }}>
          Your Game. Your Arena.
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '24px', width: '100%' }} />

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: customStyles.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                style={{ ...inputBaseStyle, ...inputFocusStyle(usernameFocused) }}
              />
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: hasError ? customStyles.danger : customStyles.textTertiary, pointerEvents: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center'
              }}>
                <UserIcon />
              </span>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: customStyles.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={{ ...inputBaseStyle, ...inputFocusStyle(passwordFocused), paddingRight: '44px' }}
              />
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: hasError ? customStyles.danger : customStyles.textTertiary, pointerEvents: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center'
              }}>
                <LockIcon />
              </span>
              <span
                onClick={() => setShowPassword(!showPassword)}
                onMouseEnter={() => setToggleHovered(true)}
                onMouseLeave={() => setToggleHovered(false)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: toggleHovered ? customStyles.textPrimary : customStyles.textTertiary,
                  cursor: 'pointer', padding: '4px', borderRadius: '4px',
                  background: toggleHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                  display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </span>
            </div>

            {hasError && (
              <div
                key={shakeKey}
                className="shake-anim"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: customStyles.danger, fontSize: '12px', marginTop: '6px', fontWeight: 500 }}
              >
                <ErrorIcon />
                {errorText}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ display: 'none' }}
              />
              <div style={{
                width: '16px', height: '16px',
                border: `1px solid ${rememberMe ? customStyles.accentPrimary : customStyles.textTertiary}`,
                borderRadius: '4px',
                background: rememberMe ? customStyles.accentPrimary : 'rgba(11, 14, 26, 0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}>
                {rememberMe && <CheckIcon />}
              </div>
              <span style={{ fontSize: '13px', color: customStyles.textSecondary, userSelect: 'none' }}>Remember me</span>
            </label>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setModalTitle('Reset Password');
                setModalMsg('Please contact your assigned agent to reset your password. They will provide you with new login credentials.');
                setModalOpen(true);
              }}
              onMouseEnter={() => setForgotHovered(true)}
              onMouseLeave={() => setForgotHovered(false)}
              style={{
                fontSize: '13px',
                color: forgotHovered ? customStyles.accentPrimary : customStyles.textTertiary,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
            >
              Forgot?
            </a>
          </div>

          <button
            type="submit"
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            disabled={isLoading}
            style={{
              width: '100%',
              background: customStyles.accentPrimary,
              color: '#000',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
              opacity: isLoading ? 0.8 : 1,
              ...(btnHovered ? {
                background: customStyles.accentHover,
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 20px rgba(0, 195, 123, 0.25)',
              } : {}),
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: customStyles.textTertiary }}>
            No account?{' '}
            <span
              onMouseEnter={() => setContactHovered(true)}
              onMouseLeave={() => setContactHovered(false)}
              onClick={() => {
                setModalTitle('Create Account');
                setModalMsg('BetArena accounts are created by agents only. Please contact your assigned agent to get your account set up.');
                setModalOpen(true);
              }}
              style={{
                color: customStyles.textSecondary,
                cursor: 'pointer',
                textDecoration: contactHovered ? 'underline' : 'none',
              }}
            >
              Contact your agent
            </span>
          </div>
        </form>
        <InfoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle} message={modalMsg} />
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = customStyles.bgPrimary;
    document.body.style.overflowX = 'hidden';
  }, []);

  return (
    <div style={{
      backgroundColor: customStyles.bgPrimary,
      color: customStyles.textPrimary,
      fontFamily: "'Inter', sans-serif",
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <ParticleCanvas />

      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        gap: '32px',
        alignItems: 'flex-start',
        padding: '40px',
        maxWidth: '100%',
        overflowY: 'auto',
        justifyContent: 'center',
      }}>
        <LoginCard
          initialUsername=""
          initialPassword=""
        />
      </div>

      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: 0,
        width: '100%',
        textAlign: 'center',
        color: '#334155',
        fontSize: '11px',
        letterSpacing: '0.5px',
        pointerEvents: 'none',
        zIndex: 5,
        fontFamily: "'Inter', sans-serif",
      }}>
        BetArena — Demo Platform · Virtual Credits Only
      </div>
    </div>
  );
};

export default App;
