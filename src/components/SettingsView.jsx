import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sparkles, 
  MessageSquare, 
  Image, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  ShieldCheck, 
  Clock, 
  Upload, 
  Building, 
  UserCheck,
  Lock,
  Save,
  RotateCcw,
  Cloud,
  Database,
  RefreshCw,
  Trash2,
  Plus,
  ClipboardPaste,
  Server
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { aisensyService } from '../services/aisensyService';
import { AUTHORIZED_USERS, authService } from '../services/authService';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  testFirebaseConnection, 
  parseFirebaseConfigInput, 
  onFirebaseStatusChange,
  isFirebaseConnected
} from '../services/firebase';

export default function SettingsView() {
  // Firebase Cloud Database State
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [firebaseStatus, setFirebaseStatus] = useState({ isConnected: false, status: 'unconfigured', message: '' });
  const [firebaseTesting, setFirebaseTesting] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState(null);
  const [firebaseSyncing, setFirebaseSyncing] = useState(false);
  const [firebaseSyncResult, setFirebaseSyncResult] = useState(null);
  const [firebasePulling, setFirebasePulling] = useState(false);
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [showRawPaste, setShowRawPaste] = useState(false);

  // Gemini Settings State
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  // Aisensy WhatsApp Settings State
  const [aisensyConfig, setAisensyConfig] = useState({
    apiKey: '',
    senderNumber: '',
    campaignName: '',
    reminderDaysBefore: 1
  });
  const [aisensyTesting, setAisensyTesting] = useState(false);
  const [aisensyTestResult, setAisensyTestResult] = useState(null);

  // Clinic Profile State
  const [clinicConfig, setClinicConfig] = useState({
    clinicName: '',
    doctorName: '',
    qualifications: '',
    regNo: '',
    phone: '',
    email: '',
    address: '',
    disclaimer: '',
    letterpadHeaderImage: null,
    signatureStampImage: null
  });

  // Dynamic Authorized Practitioners State
  const [practitioners, setPractitioners] = useState(() => authService.getAuthorizedUsers());
  const [showAddPractitioner, setShowAddPractitioner] = useState(false);
  const [newPractitioner, setNewPractitioner] = useState({
    email: '',
    name: '',
    title: 'Consultant Homoeopath',
    defaultRole: 'doctor',
    regNo: ''
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [saveNotice, setSaveNotice] = useState(null);

  useEffect(() => {
    // Load Firebase Config & subscribe to status
    const currentFbConfig = getFirebaseConfig();
    setFirebaseConfig({
      apiKey: currentFbConfig.apiKey || '',
      authDomain: currentFbConfig.authDomain || '',
      projectId: currentFbConfig.projectId || '',
      storageBucket: currentFbConfig.storageBucket || '',
      messagingSenderId: currentFbConfig.messagingSenderId || '',
      appId: currentFbConfig.appId || ''
    });

    const unsubFb = onFirebaseStatusChange((status) => {
      setFirebaseStatus(status);
    });

    // Subscribe to authorized practitioners
    const unsubAuth = authService.subscribe((users) => {
      if (users && users.length > 0) {
        setPractitioners(users);
      }
    });

    // Subscribe to storage changes for audit logs and clinic settings
    const unsubStorage = storageService.subscribe(({ collection }) => {
      if (collection === 'audit_logs' || collection === 'all') {
        setAuditLogs(storageService.getAuditLogs());
      }
      if (collection === 'clinic_settings' || collection === 'all') {
        setClinicConfig(storageService.getClinicSettings());
      }
    });

    setGeminiKey(geminiService.getApiKey());
    setGeminiModel(geminiService.getModel());
    setAisensyConfig(storageService.getAisensySettings());
    setClinicConfig(storageService.getClinicSettings());
    setAuditLogs(storageService.getAuditLogs());

    return () => {
      unsubFb();
      unsubAuth();
      unsubStorage();
    };
  }, []);

  const showNotice = (msg) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  // --- Firebase Cloud Database Handlers ---

  const handleParseRawConfig = () => {
    if (!rawConfigInput.trim()) return;
    const parsed = parseFirebaseConfigInput(rawConfigInput);
    if (parsed) {
      setFirebaseConfig(parsed);
      setShowRawPaste(false);
      setRawConfigInput('');
      setFirebaseTestResult(null);
      showNotice('Firebase configuration parsed and loaded into form fields!');
    } else {
      alert('Could not parse Firebase configuration. Please ensure you pasted valid JSON or JS object from Firebase console.');
    }
  };

  const handleSaveFirebase = (e) => {
    e?.preventDefault();
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      alert('Project ID and API Key are required to connect Firebase.');
      return;
    }
    saveFirebaseConfig(firebaseConfig);
    storageService.addAuditLog('Admin', `Configured Firebase Cloud Database (${firebaseConfig.projectId}).`);
    showNotice(`Firebase configuration saved for project "${firebaseConfig.projectId}"!`);
  };

  const handleTestFirebase = async () => {
    setFirebaseTesting(true);
    setFirebaseTestResult(null);
    const res = await testFirebaseConnection(firebaseConfig);
    setFirebaseTesting(false);
    setFirebaseTestResult(res);
  };

  const handleSyncToFirebase = async () => {
    setFirebaseSyncing(true);
    setFirebaseSyncResult(null);
    try {
      const res = await storageService.syncAllToFirebase();
      setFirebaseSyncResult({
        success: true,
        message: `Successfully synchronized ${res.count} clinical records (patients, queue, prescriptions, tests, presets, settings, practitioners) to Cloud Firestore!`
      });
      showNotice(`Cloud Sync Complete: ${res.count} records updated in Firestore.`);
    } catch (err) {
      setFirebaseSyncResult({
        success: false,
        message: err.message || 'Failed to sync data to Firebase Firestore.'
      });
    } finally {
      setFirebaseSyncing(false);
    }
  };

  const handleFetchFromFirebase = async () => {
    setFirebasePulling(true);
    try {
      await storageService.fetchFromFirebase();
      setAuditLogs(storageService.getAuditLogs());
      setClinicConfig(storageService.getClinicSettings());
      showNotice('Cloud data successfully fetched from Cloud Firestore!');
    } catch (err) {
      alert(err.message || 'Failed to fetch data from Cloud Firestore.');
    } finally {
      setFirebasePulling(false);
    }
  };

  const handleClearFirebase = async () => {
    if (confirm('Are you sure you want to disconnect Firebase? The system will revert to offline local storage mode.')) {
      await clearFirebaseConfig();
      setFirebaseConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      });
      setFirebaseTestResult(null);
      setFirebaseSyncResult(null);
      showNotice('Firebase disconnected. Operating in offline local storage mode.');
    }
  };

  // --- Dynamic Practitioners Handlers ---

  const handleAddPractitioner = async (e) => {
    e.preventDefault();
    if (!newPractitioner.email.trim()) return;
    try {
      await authService.addAuthorizedUser(newPractitioner);
      setNewPractitioner({
        email: '',
        name: '',
        title: 'Consultant Homoeopath',
        defaultRole: 'doctor',
        regNo: ''
      });
      setShowAddPractitioner(false);
      showNotice(`Practitioner ${newPractitioner.email} added to authorized whitelist!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePractitioner = async (email) => {
    if (confirm(`Remove ${email} from authorized practitioners?`)) {
      try {
        await authService.deleteAuthorizedUser(email);
        showNotice(`Removed ${email} from authorized practitioners.`);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // --- Gemini AI Handlers ---

  const handleSaveGemini = (e) => {
    e.preventDefault();
    geminiService.setApiKey(geminiKey);
    geminiService.setModel(geminiModel);
    storageService.addAuditLog('Doctor / Admin', `Updated Gemini API settings. Model: ${geminiModel}`);
    showNotice('Gemini AI API configuration saved!');
  };

  const handleTestGemini = async () => {
    setGeminiTesting(true);
    setGeminiTestResult(null);
    const res = await geminiService.testConnection(geminiKey);
    setGeminiTesting(false);
    setGeminiTestResult(res);
  };

  // --- Aisensy WhatsApp Handlers ---

  const handleSaveAisensy = (e) => {
    e.preventDefault();
    storageService.saveAisensySettings(aisensyConfig);
    showNotice('Aisensy WhatsApp configuration saved!');
  };

  const handleTestAisensy = async () => {
    setAisensyTesting(true);
    setAisensyTestResult(null);
    const res = await aisensyService.testConnection(aisensyConfig.apiKey, aisensyConfig.senderNumber);
    setAisensyTesting(false);
    setAisensyTestResult(res);
  };

  // --- Clinic Profile Handlers ---

  const handleSaveClinic = (e) => {
    e.preventDefault();
    storageService.saveClinicSettings(clinicConfig);
    showNotice('Clinic profile and prescription letterhead saved!');
  };

  const handleLetterpadImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setClinicConfig(prev => ({
        ...prev,
        letterpadHeaderImage: event.target.result
      }));
      storageService.saveClinicSettings({
        ...clinicConfig,
        letterpadHeaderImage: event.target.result
      });
      showNotice('Doctor letterpad image uploaded successfully (formatted for 8cm top area)!');
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setClinicConfig(prev => ({
        ...prev,
        signatureStampImage: event.target.result
      }));
      storageService.saveClinicSettings({
        ...clinicConfig,
        signatureStampImage: event.target.result
      });
      showNotice('Doctor signature / stamp uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" /> System Administration & Security
          </div>
          <h1 className="text-xl font-bold text-slate-900">Clinic & Integration Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Firebase Cloud Database, Google Gemini API, Aisensy WhatsApp, letterpad graphics, and access control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Connection Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            firebaseStatus.isConnected 
              ? 'bg-teal-50 border-teal-200 text-teal-800' 
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            {firebaseStatus.isConnected ? <Cloud className="w-4 h-4 text-teal-600" /> : <Database className="w-4 h-4 text-slate-400" />}
            <span>{firebaseStatus.isConnected ? 'Cloud Firestore Active' : 'Offline Local Mode'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-mono text-teal-800">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Access Control</span>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* 1. Dedicated Firebase Cloud Database Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
              <Server className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Firebase Cloud Database (Multi-Device Live Sync)</h2>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                  firebaseStatus.isConnected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {firebaseStatus.isConnected ? 'Connected' : 'Offline / Local'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Powers real-time synchronization between reception staff and doctor consultation workstations across separate computers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawPaste(!showRawPaste)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-teal-600" />
              <span>{showRawPaste ? 'Hide Paste Box' : 'Paste Firebase Config'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Quick Paste JSON / JS Snippet Assistant */}
          {showRawPaste && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-teal-200/70 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ClipboardPaste className="w-4 h-4 text-teal-600" />
                  <span>Paste Firebase Web App Config (JSON or JavaScript Snippet)</span>
                </label>
                <span className="text-[11px] text-slate-400">Directly from Firebase Console &gt; Project settings</span>
              </div>
              <textarea
                rows={4}
                value={rawConfigInput}
                onChange={(e) => setRawConfigInput(e.target.value)}
                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-clinic.firebaseapp.com",\n  "projectId": "your-clinic",\n  "storageBucket": "your-clinic.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123456:web:abcd"\n}'}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRawPaste(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseRawConfig}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Parse & Apply Config
                </button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firebaseConfig.projectId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                placeholder="my-clinic-firebase-id"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={firebaseConfig.apiKey}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={firebaseConfig.authDomain}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                placeholder="my-clinic.firebaseapp.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Bucket
              </label>
              <input
                type="text"
                value={firebaseConfig.storageBucket}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
                placeholder="my-clinic.appspot.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Messaging Sender ID
              </label>
              <input
                type="text"
                value={firebaseConfig.messagingSenderId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, messagingSenderId: e.target.value })}
                placeholder="1029384756"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                App ID
              </label>
              <input
                type="text"
                value={firebaseConfig.appId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
                placeholder="1:1029384756:web:abc123"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Test Result Alert */}
          {firebaseTestResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              firebaseTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {firebaseTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <strong className="block font-semibold">{firebaseTestResult.success ? 'Firebase Reachable & Verified' : 'Connection Failed'}</strong>
                {firebaseTestResult.message}
              </div>
            </div>
          )}

          {/* Sync Result Alert */}
          {firebaseSyncResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              firebaseSyncResult.success ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {firebaseSyncResult.success ? <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <strong className="block font-semibold">{firebaseSyncResult.success ? 'Cloud Firestore Synchronized' : 'Sync Error'}</strong>
                {firebaseSyncResult.message}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestFirebase}
                disabled={firebaseTesting || !firebaseConfig.projectId || !firebaseConfig.apiKey}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {firebaseTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" /> : <Server className="w-3.5 h-3.5 text-teal-600" />}
                <span>{firebaseTesting ? 'Connecting...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToFirebase}
                disabled={firebaseSyncing || !isFirebaseConnected()}
                title={!isFirebaseConnected() ? 'Connect to Firebase first to synchronize local records' : 'Upload all patients, queue, presets, and settings to Firestore'}
                className="px-3.5 py-2 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {firebaseSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" /> : <Cloud className="w-3.5 h-3.5 text-teal-700" />}
                <span>{firebaseSyncing ? 'Syncing...' : 'Sync Local Data to Firebase'}</span>
              </button>

              <button
                type="button"
                onClick={handleFetchFromFirebase}
                disabled={firebasePulling || !isFirebaseConnected()}
                title={!isFirebaseConnected() ? 'Connect to Firebase first to pull records' : 'Pull all clinical collections from Cloud Firestore'}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {firebasePulling ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" /> : <Database className="w-3.5 h-3.5 text-teal-600" />}
                <span>{firebasePulling ? 'Pulling...' : 'Pull Cloud Data'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {firebaseStatus.isConnected && (
                <button
                  type="button"
                  onClick={handleClearFirebase}
                  className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveFirebase}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Connect Firebase</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Google Gemini API Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Google Gemini API Key (Repertory AI)</h2>
              <p className="text-xs text-slate-500">
                Powers the Kentian Totality & Materia Medica repertorization engine.
              </p>
            </div>
          </div>

          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
            Repertory Engine
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Stored securely in your local environment. If not provided or offline, the system seamlessly falls back to the built-in classical homoeopathy repertory engine.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latest & Recommended)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>

          {/* Test Status Alert */}
          {geminiTestResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              geminiTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {geminiTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <strong className="block font-semibold">{geminiTestResult.success ? 'Connection Successful' : 'Connection Failed'}</strong>
                {geminiTestResult.message}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestGemini}
              disabled={geminiTesting || !geminiKey}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-50"
            >
              {geminiTesting ? 'Verifying with Google...' : 'Test Gemini Connection'}
            </button>

            <button
              type="button"
              onClick={handleSaveGemini}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
            >
              Save Gemini Settings
            </button>
          </div>
        </div>
      </div>

      {/* 3. Aisensy WhatsApp Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aisensy WhatsApp Gateway Integration</h2>
              <p className="text-xs text-slate-500">
                Send prescriptions and schedule automated follow-up visit reminders to patients.
              </p>
            </div>
          </div>

          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Aisensy API
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aisensy API Key / Bearer Secret
              </label>
              <input
                type="password"
                value={aisensyConfig.apiKey}
                onChange={(e) => setAisensyConfig({ ...aisensyConfig, apiKey: e.target.value })}
                placeholder="aisensy_live_..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered WhatsApp Business Number
              </label>
              <input
                type="text"
                value={aisensyConfig.senderNumber}
                onChange={(e) => setAisensyConfig({ ...aisensyConfig, senderNumber: e.target.value })}
                placeholder="+91 98112 34567"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prescription Sharing Campaign / Template
              </label>
              <input
                type="text"
                value={aisensyConfig.campaignName}
                onChange={(e) => setAisensyConfig({ ...aisensyConfig, campaignName: e.target.value })}
                placeholder="prescription_share_v1"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Automated Follow-up Reminder Timing
              </label>
              <select
                value={aisensyConfig.reminderDaysBefore}
                onChange={(e) => setAisensyConfig({ ...aisensyConfig, reminderDaysBefore: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value={1}>1 day before follow-up date (Recommended)</option>
                <option value={2}>2 days before follow-up date</option>
                <option value={3}>3 days before follow-up date</option>
              </select>
            </div>
          </div>

          {aisensyTestResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              aisensyTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {aisensyTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <strong className="block font-semibold">{aisensyTestResult.success ? 'Gateway Verified' : 'Gateway Verification Failed'}</strong>
                {aisensyTestResult.message}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestAisensy}
              disabled={aisensyTesting || !aisensyConfig.apiKey}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-50"
            >
              {aisensyTesting ? 'Testing Gateway...' : 'Test Aisensy Connection'}
            </button>

            <button
              type="button"
              onClick={handleSaveAisensy}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              Save Aisensy Settings
            </button>
          </div>
        </div>
      </div>

      {/* 4. Prescription Letterpad & Doctor Stamp Graphics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <Image className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Doctor Letterpad & Stamp Graphics</h2>
            <p className="text-xs text-slate-500">
              The prescription print engine reserves the top <strong>8 cm (80mm)</strong> for your uploaded letterpad image.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Top 8cm Letterpad Image */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Top Letterpad Header Image (8 cm Height)
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Upload your clinic letterhead banner. This fills the 80mm top space on printed prescriptions.
              </p>

              {clinicConfig.letterpadHeaderImage ? (
                <div className="border border-slate-300 rounded-xl p-2 bg-white mb-3">
                  <img 
                    src={clinicConfig.letterpadHeaderImage} 
                    alt="Uploaded Letterpad Header" 
                    className="h-20 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-3">
                  <Image className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-500">No custom header uploaded. (Using digital letterhead)</span>
                </div>
              )}
            </div>

            <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold">
              <Upload className="w-3.5 h-3.5" />
              <span>{clinicConfig.letterpadHeaderImage ? 'Replace Letterpad Image' : 'Upload Letterpad Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLetterpadImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Signature / Stamp */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Doctor Signature / Clinic Stamp
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Appears at the bottom of finalized prescriptions beside your registration number.
              </p>

              {clinicConfig.signatureStampImage ? (
                <div className="border border-slate-300 rounded-xl p-2 bg-white mb-3">
                  <img 
                    src={clinicConfig.signatureStampImage} 
                    alt="Doctor Signature / Stamp" 
                    className="h-20 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-3">
                  <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-500">No stamp image uploaded. (Using digital signature line)</span>
                </div>
              )}
            </div>

            <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold">
              <Upload className="w-3.5 h-3.5" />
              <span>{clinicConfig.signatureStampImage ? 'Replace Signature Image' : 'Upload Signature / Stamp'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
              />
            </label>
          </div>

        </div>
      </div>

      {/* 5. Dynamic Whitelisted Practitioners & Access Control */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Security & Authorized Practitioner Accounts</h2>
              <p className="text-xs text-slate-500">
                Accounts authorized in Cloud Firestore to log in. Default accounts (Dr. Dixit & Dr. Ved) are seeded automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 font-semibold">
              {practitioners.length} Whitelisted Accounts
            </span>
            <button
              type="button"
              onClick={() => setShowAddPractitioner(!showAddPractitioner)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Practitioner</span>
            </button>
          </div>
        </div>

        {/* Add Practitioner Form */}
        {showAddPractitioner && (
          <form onSubmit={handleAddPractitioner} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3 animate-fade-in">
            <h3 className="text-xs font-bold text-teal-900">Add Authorized Practitioner Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newPractitioner.email}
                  onChange={(e) => setNewPractitioner({ ...newPractitioner, email: e.target.value })}
                  placeholder="doctor@clinic.com"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Practitioner Name *</label>
                <input
                  type="text"
                  required
                  value={newPractitioner.name}
                  onChange={(e) => setNewPractitioner({ ...newPractitioner, name: e.target.value })}
                  placeholder="Dr. Full Name"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newPractitioner.defaultRole}
                  onChange={(e) => setNewPractitioner({ ...newPractitioner, defaultRole: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff / Reception</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Registration No.</label>
                <input
                  type="text"
                  value={newPractitioner.regNo}
                  onChange={(e) => setNewPractitioner({ ...newPractitioner, regNo: e.target.value })}
                  placeholder="BHMS-REG-XXXXX"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddPractitioner(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Authorize & Save Account
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {practitioners.map((user) => {
            const isDefault = user.email.toLowerCase() === 'vpdixit75@gmail.com' || user.email.toLowerCase() === 'ved@veayos.com';
            return (
              <div key={user.email} className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{user.name}</span>
                      {isDefault && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-semibold border border-teal-200 shrink-0">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-teal-800 font-semibold truncate">{user.email}</div>
                    <div className="text-[10px] text-slate-500">{user.title} {user.regNo ? `• ${user.regNo}` : ''}</div>
                  </div>
                </div>

                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeletePractitioner(user.email)}
                    title="Remove access"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. System Audit Trail Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Clinical Audit Trail & Activity Log</h2>
          </div>
          <span className="text-[11px] text-slate-400">Latest 100 system events</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between border border-slate-100">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800">{log.action}</div>
                <div className="text-[11px] text-slate-500">{log.details}</div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className="text-[10px] text-teal-800 font-mono block">{log.timestamp}</span>
                <span className="text-[10px] text-slate-400 font-medium">{log.user}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
