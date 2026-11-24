import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Sparkles, 
  History, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Save, 
  Printer, 
  Share2, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Clock, 
  User, 
  Phone, 
  FlaskConical,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle,
  X
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { aisensyService } from '../services/aisensyService';
import PrescriptionPrintModal from './PrescriptionPrintModal';

export default function DoctorWorkspace({ 
  activePatient, 
  currentUser,
  onPatientSelect, 
  onPrescriptionFinalized 
}) {
  const clinic = storageService.getClinicSettings();
  const currentDoctorName = currentUser?.name || clinic.doctorName || 'Dr. V. P. Dixit';
  const currentDoctorRegNo = currentUser?.regNo || clinic.regNo || 'BHMS-REG-84729';

  // Current Patient State
  const [patient, setPatient] = useState(activePatient || null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(null);
  const [historyReportPreview, setHistoryReportPreview] = useState(null);

  // Symptoms & Gemini Repertory State
  const [symptomInputs, setSymptomInputs] = useState({
    location: '',
    sensation: '',
    modalitiesWorse: '',
    modalitiesBetter: '',
    concomitants: '',
    mentals: '',
    freeNotes: ''
  });

  const [isRepertorizing, setIsRepertorizing] = useState(false);
  const [repertoryResult, setRepertoryResult] = useState(null);
  const [repertoryError, setRepertoryError] = useState(null);

  // Prescription Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [prescribedTests, setPrescribedTests] = useState([]);
  const [newTestInput, setNewTestInput] = useState({ testName: '', instructions: '' });
  const [advice, setAdvice] = useState('Avoid raw onions, garlic, camphor and coffee. Maintain a 20-minute gap between food and medicine.');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptionStatus, setPrescriptionStatus] = useState('draft');
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [notification, setNotification] = useState(null);

  // Reusable Presets
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    setPresets(storageService.getMedicinePresets());
    const unsubStorage = storageService.subscribe(({ collection }) => {
      if (collection === 'medicine_presets' || collection === 'all') {
        setPresets(storageService.getMedicinePresets());
      }
    });

    if (activePatient) {
      setPatient(activePatient);
      // Context switch: Reset prescription & consultation states to avoid data leaks
      setSavedPrescription(null);
      setPrescriptionStatus('draft');
      setDiagnosis('');
      setClinicalNotes('');
      setMedicines([]);
      setPrescribedTests([]);
      setFollowUpDate('');
      setRepertoryResult(null);
      setRepertoryError(null);
      setWhatsAppSuccess(null);
      setNewTestInput({ testName: '', instructions: '' });

      // Auto-load intake notes into symptoms if present
      setSymptomInputs({
        location: '',
        sensation: '',
        modalitiesWorse: '',
        modalitiesBetter: '',
        concomitants: '',
        mentals: '',
        freeNotes: activePatient.medicalHistoryNotes || ''
      });
    }

    return () => {
      unsubStorage();
    };
  }, [activePatient]);

  // Handle Repertory AI Search
  const handleRunRepertory = async () => {
    setIsRepertorizing(true);
    setRepertoryError(null);

    try {
      const result = await geminiService.repertorize({
        ...symptomInputs,
        patientAge: patient?.age,
        patientGender: patient?.gender
      });
      setRepertoryResult(result);
      setIsRepertorizing(false);
    } catch (err) {
      setIsRepertorizing(false);
      setRepertoryError('Repertorization error: ' + err.message);
    }
  };

  // 1-Click Auto-fill Selected Remedy into Prescription
  const handleAutoFillRemedy = (remedyItem) => {
    const newMed = {
      remedy: `${remedyItem.remedy} ${remedyItem.potency}`,
      dosage: remedyItem.dosage || '4 globules',
      frequency: remedyItem.frequency || 'BD',
      duration: remedyItem.duration || '7 days',
      instructions: remedyItem.instructions || 'Dissolve in clean mouth'
    };

    setMedicines(prev => [...prev, newMed]);
    if (remedyItem.keynotes && !clinicalNotes.includes(remedyItem.keynotes)) {
      setClinicalNotes(prev => (prev ? `${prev}\n• ` : '• ') + `${remedyItem.remedy}: ${remedyItem.keynotes}`);
    }

    setNotification(`Added ${remedyItem.remedy} to prescription!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Medicine from Preset
  const handleAddPreset = (preset) => {
    const newMed = {
      remedy: `${preset.name} ${preset.potency || '30C'}`,
      dosage: preset.dosage || '4 globules',
      frequency: preset.frequency || 'BD',
      duration: preset.duration || '7 days',
      instructions: preset.instructions || 'Dissolve in clean mouth'
    };
    setMedicines(prev => [...prev, newMed]);
  };

  // Medicine Rows Management
  const handleAddMedicineRow = () => {
    setMedicines(prev => [
      ...prev,
      { remedy: '', dosage: '4 globules', frequency: 'TDS', duration: '5 days', instructions: '' }
    ]);
  };

  const handleUpdateMedicine = (index, field, value) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  // Prescribed Tests Management
  const handleAddTest = () => {
    if (!newTestInput.testName.trim()) return;
    const testItem = {
      id: `test-${Date.now()}`,
      testName: newTestInput.testName.trim(),
      instructions: newTestInput.instructions.trim(),
      datePrescribed: new Date().toISOString().split('T')[0],
      status: 'prescribed'
    };
    setPrescribedTests(prev => [...prev, testItem]);
    setNewTestInput({ testName: '', instructions: '' });
  };

  const handleRemoveTest = (index) => {
    setPrescribedTests(prev => prev.filter((_, i) => i !== index));
  };

  // Save Draft
  const handleSaveDraft = () => {
    if (!patient) return alert('Please select a patient first.');
    const rx = {
      id: savedPrescription?.id,
      patientId: patient.id,
      patientName: patient.name,
      queueId: patient.queueId,
      token: patient.token || 'Rx',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      symptoms: `${symptomInputs.location} ${symptomInputs.sensation}`.trim(),
      diagnosis,
      clinicalNotes,
      medicines,
      tests: prescribedTests,
      advice,
      followUpDate,
      doctorName: currentDoctorName,
      doctorRegNo: currentDoctorRegNo
    };
    const saved = storageService.savePrescription(rx);
    setSavedPrescription(saved);
    setPrescriptionStatus('draft');
    setNotification('Prescription draft saved successfully!');
    setTimeout(() => setNotification(null), 3000);
    return saved;
  };

  // Finalize Prescription
  const handleFinalize = () => {
    if (!patient) {
      alert('Please select a patient first.');
      return null;
    }
    if (medicines.length === 0 || !medicines[0].remedy) {
      alert('Please prescribe at least one homoeopathic medicine before finalising.');
      return null;
    }

    const rx = {
      id: savedPrescription?.id,
      patientId: patient.id,
      patientName: patient.name,
      queueId: patient.queueId,
      token: patient.token || 'Rx',
      date: new Date().toISOString().split('T')[0],
      status: 'finalized',
      symptoms: `${symptomInputs.location} ${symptomInputs.sensation} ${symptomInputs.modalitiesWorse}`.trim(),
      diagnosis,
      clinicalNotes,
      medicines,
      tests: prescribedTests,
      advice,
      followUpDate,
      doctorName: currentDoctorName,
      doctorRegNo: currentDoctorRegNo
    };

    const finalized = storageService.savePrescription(rx);
    setSavedPrescription(finalized);
    setPrescriptionStatus('finalized');

    // Also register prescribed tests in main tests registry
    prescribedTests.forEach(test => {
      storageService.prescribeTest({
        id: test.id,
        patientId: patient.id,
        patientName: patient.name,
        testName: test.testName,
        instructions: test.instructions
      });
    });

    // Schedule WhatsApp follow-up reminder if follow-up date is set
    if (followUpDate && patient.consentWhatsApp) {
      aisensyService.scheduleFollowUpReminder({
        patient,
        followUpDate,
        doctorName: currentDoctorName
      });
    }

    // Reload updated patient from storage to keep history modal and count immediately up-to-date
    const refreshed = storageService.getPatientById(patient.id);
    if (refreshed) {
      setPatient(refreshed);
    }

    setNotification('Prescription finalised and permanently recorded in patient history!');
    if (onPrescriptionFinalized) onPrescriptionFinalized(finalized);
    return finalized;
  };

  // Send via WhatsApp
  const handleSendWhatsApp = async () => {
    let rxToSend = savedPrescription;
    if (!rxToSend || rxToSend.status !== 'finalized') {
      rxToSend = handleFinalize();
    }
    if (!rxToSend) return;
    try {
      const res = await aisensyService.sendPrescriptionWhatsApp({
        patient,
        prescription: rxToSend
      });
      setWhatsAppSuccess(`Prescription sent to WhatsApp (+${res.recipient})!`);
      setShowWhatsAppModal(false);
      setTimeout(() => setWhatsAppSuccess(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!patient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <Stethoscope className="w-12 h-12 text-teal-600 mx-auto mb-3 opacity-60" />
        <h2 className="text-lg font-bold text-slate-800">No Patient Currently Selected</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Open the Live Patient Queue to call next patient or select a waiting patient to begin consultation.
        </p>
        <button
          onClick={() => onPatientSelect && onPatientSelect()}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-700/20"
        >
          View Live Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* 1. Patient Context Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shadow-teal-700/20 shrink-0">
            {patient.token || 'Rx'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">{patient.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                {patient.gender}, {patient.age} Yrs
              </span>
              {patient.consentWhatsApp && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  WhatsApp Opt-in
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
              </span>
              <span>•</span>
              <span className="text-slate-600 font-sans">{patient.address}</span>
            </div>
          </div>
        </div>

        {/* View Patient History Action (Requirement from Brief) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors"
          >
            <History className="w-4 h-4 text-teal-700" />
            <span>View Patient History ({patient.history?.length || 0} visits)</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {whatsAppSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{whatsAppSuccess}</span>
        </div>
      )}

      {/* 2-Column Clinical Layout: Left = Gemini Repertory AI | Right = Prescription Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* === LEFT COLUMN: VEAYOS REPERTORY AI PANEL (Gemini) === */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-300" />
                <h2 className="text-xs font-bold uppercase tracking-wider">VEAYOS Repertory AI</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                  geminiService.getApiKey() ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30' : 'bg-teal-900/60 text-teal-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${geminiService.getApiKey() ? 'bg-emerald-400' : 'bg-teal-300'}`}></span>
                  {geminiService.getApiKey() ? `Gemini AI (${geminiService.getModel()})` : 'Kent Synthesis (Offline)'}
                </span>
              </div>
            </div>

            {/* AI Warning or Status Banner if Fallback Occurred */}
            {repertoryResult?.fallbackReason && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Gemini AI Fallback:</strong>
                  {repertoryResult.fallbackReason}
                </div>
              </div>
            )}

            {/* Inputs */}
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Location (Organ / System / Laterality)
                </label>
                <input
                  type="text"
                  value={symptomInputs.location}
                  onChange={(e) => setSymptomInputs({ ...symptomInputs, location: e.target.value })}
                  placeholder="e.g. Epigastrium, right hypochondrium, forehead"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Sensation & Pain Character
                </label>
                <input
                  type="text"
                  value={symptomInputs.sensation}
                  onChange={(e) => setSymptomInputs({ ...symptomInputs, sensation: e.target.value })}
                  placeholder="e.g. Burning sour acidity, stitching pain, bruised sore"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Worse (Aggravation)
                  </label>
                  <input
                    type="text"
                    value={symptomInputs.modalitiesWorse}
                    onChange={(e) => setSymptomInputs({ ...symptomInputs, modalitiesWorse: e.target.value })}
                    placeholder="e.g. Motion, spicy food, 4 PM"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Better (Amelioration)
                  </label>
                  <input
                    type="text"
                    value={symptomInputs.modalitiesBetter}
                    onChange={(e) => setSymptomInputs({ ...symptomInputs, modalitiesBetter: e.target.value })}
                    placeholder="e.g. Rest, warm drinks, pressure"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Concomitants & Mentals
                </label>
                <input
                  type="text"
                  value={symptomInputs.concomitants}
                  onChange={(e) => setSymptomInputs({ ...symptomInputs, concomitants: e.target.value })}
                  placeholder="e.g. Ineffectual urging for stool, irritable, fastidious"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Doctor Notes & Clinical Narrative
                </label>
                <textarea
                  rows="2"
                  value={symptomInputs.freeNotes}
                  onChange={(e) => setSymptomInputs({ ...symptomInputs, freeNotes: e.target.value })}
                  placeholder="General constitutional observations..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Run Repertory Button */}
              <button
                type="button"
                onClick={handleRunRepertory}
                disabled={isRepertorizing}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>{isRepertorizing ? 'Repertorizing via Gemini AI...' : 'Run Repertory Search'}</span>
              </button>
            </div>

            {/* Repertory Results List */}
            {repertoryResult && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Indicated Remedies ({repertoryResult.remedies?.length || 0})
                  </span>
                  <span className="text-[10px] text-teal-700 font-mono bg-teal-100/60 px-2 py-0.5 rounded">
                    {repertoryResult.source === 'gemini' ? 'Gemini 1.5/2.0' : 'Local Kent Synthesis'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {repertoryResult.remedies?.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-900 text-sm">{item.remedy}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold font-mono">
                              {item.potency}
                            </span>
                          </div>
                          {item.commonName && (
                            <span className="text-[10px] text-slate-500 italic block">{item.commonName}</span>
                          )}
                        </div>

                        {/* Repertory Score Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
                            Score: {item.repertoryScore}
                          </span>
                        </div>
                      </div>

                      {/* Matching Rubrics */}
                      {item.matchingRubrics && item.matchingRubrics.length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg space-y-0.5">
                          <strong className="text-slate-700 block font-semibold">Matched Rubrics:</strong>
                          {item.matchingRubrics.map((r, i) => (
                            <div key={i} className="truncate">• {r}</div>
                          ))}
                        </div>
                      )}

                      {/* Keynotes */}
                      {item.keynotes && (
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                          <span className="font-semibold text-slate-700">Keynote: </span>
                          {item.keynotes}
                        </p>
                      )}

                      {/* Auto-fill Button */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.dosage} • {item.frequency}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAutoFillRemedy(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-teal-600" />
                          <span>Auto-fill into Rx</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Differential advice */}
                {repertoryResult.differentialAdvice && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-snug">
                    <strong className="block mb-0.5">Clinical Totality Differential:</strong>
                    {repertoryResult.differentialAdvice}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* === RIGHT COLUMN: PRESCRIPTION BUILDER === */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            
            {/* Top 8 cm Letterpad Area Indicator (Brief Requirement) */}
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-teal-800">
                <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Consulting:</strong> {currentDoctorName} <span className="font-mono text-[11px] text-teal-600">({currentDoctorRegNo})</span> • Top 8 cm reserved for letterpad.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-800 font-semibold text-[11px] hover:bg-teal-50 shrink-0 self-start sm:self-auto"
              >
                Preview Letterpad
              </button>
            </div>

            {/* Clinical Assessment / Diagnosis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Assessment / Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Non-ulcer Dyspepsia & GERD"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Miasmatic / Constitutional Notes
                </label>
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Psora with Sycotic overlay, Chilly patient"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Quick Presets Dropdown */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="font-serif italic text-lg text-teal-800">℞</span> Prescribed Medicines
              </label>

              {/* Preset Quick Inserter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Quick Insert:</span>
                <select
                  onChange={(e) => {
                    const preset = presets.find(p => p.id === e.target.value);
                    if (preset) handleAddPreset(preset);
                    e.target.value = '';
                  }}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>+ Choose Preset...</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.potency})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Medicines List */}
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Remedy Name & Potency */}
                    <div className="col-span-12 sm:col-span-6">
                      <input
                        type="text"
                        value={med.remedy}
                        onChange={(e) => handleUpdateMedicine(index, 'remedy', e.target.value)}
                        placeholder="Remedy & Potency (e.g. Arnica 200C)"
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    {/* Dosage */}
                    <div className="col-span-6 sm:col-span-3">
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                        placeholder="Dosage (4 globules)"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    {/* Frequency */}
                    <div className="col-span-5 sm:col-span-2">
                      <select
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedicine(index, 'frequency', e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="OD">OD (Once daily)</option>
                        <option value="BD">BD (Twice daily)</option>
                        <option value="TDS">TDS (Thrice daily)</option>
                        <option value="QID">QID (4 times)</option>
                        <option value="SOS">SOS (As needed)</option>
                        <option value="Weekly">Weekly once</option>
                      </select>
                    </div>

                    {/* Remove Action */}
                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    {/* Duration */}
                    <div className="col-span-12 sm:col-span-4">
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedicine(index, 'duration', e.target.value)}
                        placeholder="Duration (e.g. 7 days)"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="col-span-12 sm:col-span-8">
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedicine(index, 'instructions', e.target.value)}
                        placeholder="Instructions (e.g. Dissolve in clean mouth 15 mins before meals)"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Medicine Row</span>
              </button>
            </div>

            {/* Prescribed Diagnostic Tests */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <FlaskConical className="w-4 h-4 text-teal-700" /> Prescribe Diagnostic Tests
              </label>

              {prescribedTests.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {prescribedTests.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-teal-50/50 border border-teal-200 text-xs">
                      <div>
                        <strong className="text-teal-900 font-semibold">{t.testName}</strong>
                        {t.instructions && <span className="text-slate-500 ml-2">({t.instructions})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(idx)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTestInput.testName}
                  onChange={(e) => setNewTestInput({ ...newTestInput, testName: e.target.value })}
                  placeholder="Test Name (e.g. Ultrasound Abdomen, Complete Blood Count)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                />
                <input
                  type="text"
                  value={newTestInput.instructions}
                  onChange={(e) => setNewTestInput({ ...newTestInput, instructions: e.target.value })}
                  placeholder="Instructions (Fasting, etc.)"
                  className="w-1/3 px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                />
                <button
                  type="button"
                  onClick={handleAddTest}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  Add Test
                </button>
              </div>
            </div>

            {/* General Advice & Regimen */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dietary Restrictions & Regimen Advice
              </label>
              <textarea
                rows="2"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Homoeopathic precautions..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Follow-up Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-700" /> Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="text-[11px] text-slate-500 leading-snug">
                An automated WhatsApp reminder will be scheduled <strong>1 day before</strong> this follow-up date via Aisensy.
              </div>
            </div>

            {/* Prescription Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / PDF (8cm blank)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {patient.consentWhatsApp && (
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Send WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFinalize}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-700/20 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Finalise Prescription</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* === MODAL: PATIENT HISTORY DRAWER (Brief Requirement) === */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl min-h-screen p-6 shadow-2xl overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Patient Medical History</h2>
                <p className="text-xs text-slate-500">{patient.name} • {patient.phone}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Visit vs Past History Banner */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
              <strong>Active Visit:</strong> Today's consultation is currently in progress. Previous completed visits are listed below in reverse chronological order.
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {(!patient.history || patient.history.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No previous consultation records for this patient. This is their first recorded visit.
                </div>
              ) : (
                patient.history.map((hist, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{hist.date}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                          {hist.token || `Visit #${i + 1}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-teal-800 font-semibold">{hist.doctorName || currentDoctorName}</span>
                    </div>

                    {hist.diagnosis && (
                      <div className="text-xs">
                        <span className="font-bold text-slate-700">Diagnosis: </span>
                        <span className="text-slate-800">{hist.diagnosis}</span>
                      </div>
                    )}

                    {hist.symptoms && (
                      <div className="text-xs text-slate-600 italic">
                        "{hist.symptoms}"
                      </div>
                    )}

                    {/* Past Medicines */}
                    {hist.medicines && hist.medicines.length > 0 && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-teal-900 block text-[10px] uppercase">Prescribed Remedies:</span>
                        {hist.medicines.map((m, mIdx) => (
                          <div key={mIdx} className="flex justify-between text-slate-700">
                            <span>{m.remedy}</span>
                            <span className="text-slate-500 font-mono">{m.dosage} ({m.frequency})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Past Prescribed Tests & Attached Reports (PDF Brief Requirement) */}
                    {hist.tests && hist.tests.length > 0 && (
                      <div className="bg-white p-2.5 rounded-lg border border-teal-200/60 text-xs space-y-1.5">
                        <span className="font-bold text-teal-800 block text-[10px] uppercase flex items-center gap-1">
                          <FlaskConical className="w-3 h-3 text-teal-600" /> Tests Prescribed & Report Attachments:
                        </span>
                        {hist.tests.map((t, tIdx) => (
                          <div key={tIdx} className="flex items-center justify-between text-slate-700 bg-slate-50/70 p-1.5 rounded">
                            <div>
                              <strong className="text-slate-900 font-semibold">{t.testName}</strong>
                              {t.instructions && <span className="text-slate-400 text-[10px] ml-1.5">({t.instructions})</span>}
                            </div>
                            <div>
                              {t.reportUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setHistoryReportPreview(t)}
                                  className="px-2 py-0.5 rounded bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-[10px] border border-teal-300"
                                >
                                  View Report
                                </button>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-medium">Report Pending</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {hist.followUpDate && (
                      <div className="text-[11px] text-teal-700 font-medium">
                        Follow-up was scheduled on: {hist.followUpDate}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* === MODAL: PRINT PREVIEW MODAL (8cm blank space) === */}
      {showPrintModal && (
        <PrescriptionPrintModal
          prescription={savedPrescription || {
            id: 'rx-draft-preview',
            patientName: patient.name,
            date: new Date().toISOString().split('T')[0],
            diagnosis,
            symptoms: `${symptomInputs.location} ${symptomInputs.sensation}`.trim(),
            medicines,
            tests: prescribedTests,
            advice,
            followUpDate,
            doctorName: currentDoctorName,
            doctorRegNo: currentDoctorRegNo
          }}
          patient={patient}
          onClose={() => setShowPrintModal(false)}
          onSendWhatsApp={patient.consentWhatsApp ? () => {
            setShowPrintModal(false);
            setShowWhatsAppModal(true);
          } : null}
        />
      )}

      {/* === MODAL: WHATSAPP RECIPIENT & MESSAGE CONFIRMATION (Brief Requirement) === */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Share2 className="w-5 h-5" />
                <span>Confirm WhatsApp Dispatch (Aisensy)</span>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div><strong className="text-slate-700">Recipient Patient:</strong> {patient.name}</div>
              <div><strong className="text-slate-700">Mobile Number:</strong> <span className="font-mono text-emerald-800 font-bold">{patient.phone}</span></div>
              <div><strong className="text-slate-700">Template:</strong> prescription_share_v1</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Preview:</label>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
{`Hello ${patient.name},

Greetings from VEAYOS Homoeopathic Clinic.
${currentDoctorName} has finalized your homoeopathy prescription.

💊 Prescribed Medicines:
${medicines.map((m, i) => `${i + 1}. ${m.remedy} - ${m.dosage} (${m.frequency})`).join('\n')}

📅 Next Follow-Up: ${followUpDate || 'As advised'}
⚠️ Advice: ${advice || 'Follow dietary precautions.'}`}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Confirm & Send Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: HISTORY ATTACHED REPORT PREVIEW === */}
      {historyReportPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{historyReportPreview.testName} - Diagnostic Report</h3>
                <p className="text-[11px] text-slate-500">{historyReportPreview.reportFileName || 'Attached document'}</p>
              </div>
              <button onClick={() => setHistoryReportPreview(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-center min-h-[300px]">
              {historyReportPreview.reportUrl?.startsWith('data:image') || historyReportPreview.reportFileType?.startsWith('image/') ? (
                <img 
                  src={historyReportPreview.reportUrl} 
                  alt="Diagnostic Report" 
                  className="max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-teal-600 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-800">{historyReportPreview.reportFileName || 'PDF Report Document'}</p>
                  <a
                    href={historyReportPreview.reportUrl}
                    download={historyReportPreview.reportFileName || 'diagnostic-report.pdf'}
                    className="inline-block mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
                  >
                    Download Report Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
