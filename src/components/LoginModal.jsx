import React, { useState, useEffect } from 'react';
import { AUTHORIZED_USERS, authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { ShieldCheck, AlertCircle, Lock, UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginModal({ onLoginSuccess }) {
  const [practitioners, setPractitioners] = useState(() => authService.getAuthorizedUsers());
  const [selectedEmail, setSelectedEmail] = useState('vpdixit75@gmail.com');
  const [customEmail, setCustomEmail] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((users) => {
      if (users && users.length > 0) {
        setPractitioners(users);
      }
    });
    return unsub;
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    const emailToUse = useCustom ? customEmail.trim() : selectedEmail;

    try {
      // First attempt backend authentication API (/api/v1/auth/login)
      try {
        const backendRes = await apiService.loginWithEmail(emailToUse, selectedRole);
        if (backendRes.user) {
          authService.setSession(backendRes.user);
          setLoading(false);
          onLoginSuccess(backendRes.user);
          return;
        }
      } catch (backendErr) {
        // If backend returned 403 Access Denied, rethrow
        if (backendErr.status === 403) {
          throw backendErr;
        }
      }

      // Fallback local auth verification
      const user = authService.login(emailToUse, selectedRole);
      setLoading(false);
      onLoginSuccess(user);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const emailToUse = useCustom ? customEmail.trim() : selectedEmail;

    try {
      // Call dedicated Google auth API endpoint (/api/v1/auth/google)
      const res = await apiService.loginWithGoogle({
        email: emailToUse,
        role: selectedRole
      });

      if (res.user) {
        authService.setSession(res.user);
        setLoading(false);
        onLoginSuccess(res.user);
      } else {
        throw new Error('Google sign-in did not return user profile.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header Banner with Official Company Logo */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border border-white/40 p-1.5 overflow-hidden">
            <img src="/logo.png" alt="VEAYOS Company Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VEAYOS • ClinicalOS</h1>
          <p className="text-teal-100 text-xs mt-1">Homoeopathy Practice & Consultation System</p>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-900/40 border border-teal-400/30 text-teal-200 text-xs font-mono">
            <Lock className="w-3 h-3" /> Strict 2-Account Whitelist Enforced
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Authentication Failed</strong>
                {error}
              </div>
            </div>
          )}

          {/* Dedicated Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mb-4 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm shadow-xs flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Authenticating with Google...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Or Select Practitioner</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Select Authorized Accounts */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Authorized Whitelisted Practitioners
            </label>
            <div className="space-y-2">
              {practitioners.map((user) => {
                const isSelected = !useCustom && selectedEmail === user.email;
                return (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => {
                      setSelectedEmail(user.email);
                      setUseCustom(false);
                      setError('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 shadow-sm ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 border border-teal-200">
                      {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 truncate">{user.name}</span>
                        {isSelected && <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-600 font-mono truncate">{user.email}</p>
                      <span className="text-[10px] text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">
                        {user.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option to test custom email (to prove rejection of unauthorized emails) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setUseCustom(!useCustom);
                setError('');
              }}
              className="text-xs text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1 mb-2"
            >
              <Sparkles className="w-3 h-3" />
              {useCustom ? '← Return to Whitelisted Accounts' : 'Test custom email login (Verify Security)'}
            </button>

            {useCustom && (
              <div className="mb-4">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Enter email e.g. unauthorized@clinic.com"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Only authorized whitelist accounts (<span className="font-mono text-teal-700 font-semibold">{practitioners.map(p => p.email).join(', ')}</span>) will be allowed access.
                </p>
              </div>
            )}
          </div>

          {/* Role Choice */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Sign In As Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'doctor', label: 'Doctor', desc: 'Full clinical' },
                { role: 'staff', label: 'Staff', desc: 'Intake & Queue' },
                { role: 'admin', label: 'Admin', desc: 'Settings' }
              ].map(({ role, label, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === role
                      ? 'border-teal-600 bg-teal-600 text-white shadow-sm font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="text-xs">{label}</div>
                  <div className={`text-[10px] ${selectedRole === role ? 'text-teal-100' : 'text-slate-500'}`}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to ClinicalOS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
          VEAYOS ClinicalOS v1.0 • Homoeopathy Repertory & Practice Management
        </div>
      </div>
    </div>
  );
}
