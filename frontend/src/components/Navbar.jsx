import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Wifi, 
  WifiOff, 
  Download, 
  LogOut, 
  User, 
  Shield, 
  Sparkles,
  ChevronDown,
  BellRing,
  Cloud,
  Database
} from 'lucide-react';
import { authService } from '../services/authService';
import { onFirebaseStatusChange } from '../services/firebase';

export default function Navbar({ currentUser, onUserChange, onLogout, waitingCount = 0 }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState({ isConnected: false, status: 'unconfigured' });

  useEffect(() => {
    const unsubFb = onFirebaseStatusChange((status) => {
      setFirebaseStatus(status);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubFb();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleRoleSelect = (role) => {
    try {
      const updatedUser = authService.switchRole(role);
      onUserChange(updatedUser);
      setShowRoleMenu(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Official Company Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0">
            <img src="/logo.png" alt="VEAYOS" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">VEAYOS</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold border border-teal-200/60 uppercase tracking-wider">
                ClinicalOS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
              Homoeopathy Consultation & Repertory Engine
            </p>
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Cloud Firestore Status Badge */}
          <div 
            title={firebaseStatus.isConnected ? `Firebase Cloud Database Connected (${firebaseStatus.config.projectId}) - Dynamic live sync active` : 'Firebase Cloud Database Not Connected - Running in Local Mode'}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              firebaseStatus.isConnected 
                ? 'bg-teal-50 text-teal-800 border-teal-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {firebaseStatus.isConnected ? <Cloud className="w-3.5 h-3.5 text-teal-600" /> : <Database className="w-3.5 h-3.5 text-slate-400" />}
            <span>{firebaseStatus.isConnected ? 'Cloud DB Live' : 'Local DB'}</span>
          </div>

          {/* Online / Offline Status Badge */}
          <div 
            title={isOnline ? 'Online - Cloud Sync Active' : 'Offline - Local Data Protected'}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isOnline ? 'Live' : 'Offline Mode'}</span>
          </div>

          {/* Queue Waiting Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
            <BellRing className="w-3.5 h-3.5 text-teal-600" />
            <span>Waiting: <strong className="text-teal-700 font-semibold">{waitingCount}</strong></span>
          </div>

          {/* Install PWA Button (if available) */}
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span className="capitalize">{currentUser?.currentRole || 'Doctor'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-600">
                  Switch Active Role
                </div>
                {['doctor', 'staff', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-teal-50 ${
                      currentUser?.currentRole === role ? 'font-bold text-teal-700 bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span className="capitalize">{role}</span>
                    {currentUser?.currentRole === role && <span className="text-teal-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'DR'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{currentUser?.email}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
