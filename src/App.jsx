import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import DashboardAnalytics from './components/DashboardAnalytics';
import LiveQueue from './components/LiveQueue';
import PatientIntake from './components/PatientIntake';
import DoctorWorkspace from './components/DoctorWorkspace';
import MedicinesLibrary from './components/MedicinesLibrary';
import TestsManager from './components/TestsManager';
import WhatsAppCenter from './components/WhatsAppCenter';
import SettingsView from './components/SettingsView';
import { authService } from './services/authService';
import { storageService } from './services/storageService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [tests, setTests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activePatient, setActivePatient] = useState(null);

  // Initialize Auth & App State
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    refreshData();

    // Real-time Firestore sync subscription across active machines
    const unsubStorage = storageService.subscribe(() => {
      refreshData();
    });

    return () => {
      unsubStorage();
    };
  }, []);

  const refreshData = () => {
    const pts = storageService.getPatients();
    const q = storageService.getQueue();
    const t = storageService.getTests();
    const rx = storageService.getPrescriptions();

    setPatients(pts);
    setQueue(q);
    setTests(t);
    setPrescriptions(rx);

    // If an in-consultation patient exists, set as default active patient
    const consulting = q.find(item => item.status === 'in_consultation' || item.status === 'called');
    if (consulting) {
      const fullPatient = pts.find(p => p.id === consulting.patientId) || consulting;
      setActivePatient({ ...fullPatient, token: consulting.token });
    } else if (pts.length > 0 && !activePatient) {
      setActivePatient(pts[0]);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    storageService.addAuditLog(user.email, 'User logged in successfully.', `Role: ${user.currentRole}`);
    // If staff, default to intake or queue; if doctor, dashboard or workspace
    if (user.currentRole === 'staff') {
      setActiveTab('queue');
    } else {
      setActiveTab('dashboard');
    }
    refreshData();
  };

  const handleLogout = () => {
    if (currentUser) {
      storageService.addAuditLog(currentUser.email, 'User logged out.');
    }
    authService.logout();
    setCurrentUser(null);
  };

  // Called when Doctor clicks "Consult" from Queue table
  const handleOpenConsultation = (queueItem) => {
    const fullPatient = patients.find(p => p.id === queueItem.patientId) || queueItem;
    setActivePatient({
      ...fullPatient,
      token: queueItem.token,
      queueId: queueItem.id
    });
    // Update queue status to in_consultation
    const updated = storageService.updateQueueStatus(queueItem.id, 'in_consultation');
    setQueue(updated);
    setActiveTab('workspace');
  };

  const waitingCount = queue.filter(q => q.status === 'waiting').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Strict Access Login Screen if not authenticated */}
      {!currentUser && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Main Clinical Shell */}
      {currentUser && (
        <>
          <Navbar 
            currentUser={currentUser}
            onUserChange={setCurrentUser}
            onLogout={handleLogout}
            waitingCount={waitingCount}
          />

          <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
            {/* Sidebar Navigation */}
            <Sidebar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              userRole={currentUser.currentRole}
              waitingCount={waitingCount}
            />

            {/* Main Content Workspace View */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
              
              {activeTab === 'dashboard' && (
                <DashboardAnalytics 
                  patients={patients}
                  queue={queue}
                  tests={tests}
                  prescriptions={prescriptions}
                />
              )}

              {activeTab === 'queue' && (
                <LiveQueue 
                  queue={queue}
                  onQueueUpdate={(newQueue) => setQueue(newQueue)}
                  onOpenConsultation={handleOpenConsultation}
                  userRole={currentUser.currentRole}
                />
              )}

              {activeTab === 'intake' && (
                <PatientIntake 
                  onPatientAdded={() => refreshData()}
                  onGoToQueue={() => setActiveTab('queue')}
                />
              )}

              {activeTab === 'workspace' && (
                <DoctorWorkspace 
                  activePatient={activePatient}
                  currentUser={currentUser}
                  onPatientSelect={() => setActiveTab('queue')}
                  onPrescriptionFinalized={() => refreshData()}
                />
              )}

              {activeTab === 'medicines' && (
                <MedicinesLibrary />
              )}

              {activeTab === 'tests' && (
                <TestsManager />
              )}

              {activeTab === 'whatsapp' && (
                <WhatsAppCenter />
              )}

              {activeTab === 'settings' && (
                <SettingsView />
              )}

            </main>
          </div>
        </>
      )}

    </div>
  );
}
