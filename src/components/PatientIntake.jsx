import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  Mail, 
  Briefcase, 
  HeartHandshake, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function PatientIntake({ onPatientAdded, onGoToQueue }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dob: '',
    age: '',
    gender: 'Male',
    email: '',
    occupation: '',
    emergencyContact: '',
    referralSource: '',
    medicalHistoryNotes: '',
    consentWhatsApp: true
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Validate mandatory fields
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Patient full name is mandatory.';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Primary mobile number is mandatory.';
    } else {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone = 'Valid 10-digit mobile number required.';
      }
    }
    if (!formData.address.trim()) newErrors.address = 'Residential address is mandatory.';
    if (formData.age === '' || isNaN(formData.age) || Number(formData.age) < 0 || Number(formData.age) > 120) {
      newErrors.age = 'Valid numeric age (0-120) is mandatory.';
    }
    if (formData.dob) {
      const birth = new Date(formData.dob);
      const today = new Date();
      if (birth > today) {
        newErrors.dob = 'Date of birth cannot be in the future.';
      }
    }
    if (!formData.gender) newErrors.gender = 'Gender selection is mandatory.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check duplicate phone on change
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, phone: val }));
    
    if (val.replace(/[^0-9]/g, '').length >= 10) {
      const existing = storageService.findPatientByPhone(val);
      if (existing) {
        setDuplicateWarning(`Existing record found for ${existing.name} (ID: ${existing.id}). You can still register or update.`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Auto-calculate Age when optional Date of Birth is selected
  const handleDobChange = (e) => {
    const dobVal = e.target.value;
    let calculatedAge = formData.age;
    let dobError = undefined;

    if (dobVal) {
      const birth = new Date(dobVal);
      const today = new Date();
      if (!isNaN(birth.getTime())) {
        if (birth > today) {
          dobError = 'Date of birth cannot be in the future.';
        } else {
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          if (age >= 0 && age <= 120) {
            calculatedAge = String(age);
          }
        }
      }
    }
    setFormData(prev => ({
      ...prev,
      dob: dobVal,
      age: calculatedAge
    }));
    setErrors(prev => ({
      ...prev,
      dob: dobError,
      age: dobError ? prev.age : undefined
    }));
  };

  const handleSaveOnly = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const patient = {
      ...formData,
      age: Number(formData.age)
    };

    const saved = storageService.savePatient(patient);
    setSuccessMessage(`Patient ${formData.name} registered successfully!`);
    if (onPatientAdded) onPatientAdded(saved[0]);
    resetForm();
  };

  const handleSaveAndAddToQueue = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const patient = {
      ...formData,
      age: Number(formData.age)
    };

    const savedList = storageService.savePatient(patient);
    const createdPatient = savedList[0];
    const queueItem = storageService.addToQueue(createdPatient, formData.medicalHistoryNotes || 'Initial homoeopathy consultation');

    setSuccessMessage(`Patient ${formData.name} added to Live Queue as Token ${queueItem.token}!`);
    if (onPatientAdded) onPatientAdded(createdPatient);
    resetForm();
    if (onGoToQueue) {
      setTimeout(() => onGoToQueue(), 1200);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      dob: '',
      age: '',
      gender: 'Male',
      email: '',
      occupation: '',
      emergencyContact: '',
      referralSource: '',
      medicalHistoryNotes: '',
      consentWhatsApp: true
    });
    setErrors({});
    setDuplicateWarning(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <UserPlus className="w-4 h-4" /> Front Desk Intake & Registration
          </div>
          <h1 className="text-xl font-bold text-slate-900">New Patient Registration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture 5 mandatory intake fields and immediately dispatch patient to the doctor's live queue.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-teal-50/70 border border-teal-200/80 px-3 py-2 rounded-xl">
          <span className="font-semibold text-teal-800">Mandatory:</span> Name, Phone, Address, Age, Gender
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-semibold">Duplicate Check Warning: </strong>
            {duplicateWarning}
          </div>
        </div>
      )}

      {/* Intake Form */}
      <form className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Section 1: Mandatory Demographics */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              Mandatory Patient Details
            </h2>
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">* All 5 required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Patient Name */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar Sharma"
                  className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border ${
                    errors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* 2. Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone / Mobile <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+91 98765 43210"
                  className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border ${
                    errors.phone ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
            </div>

            {/* 3. Optional DOB with Auto-Calculated Age & Mandatory Gender */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" title="Date of Birth (Optional)">
                  DOB <span className="text-[10px] text-slate-400 font-normal">(Opt)</span>
                </label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={handleDobChange}
                  max={new Date().toISOString().split('T')[0]}
                  title="Selecting DOB will auto-calculate Age"
                  className={`w-full px-2 py-2.5 text-xs rounded-xl border ${
                    errors.dob ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (Yrs) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="42"
                    className={`w-full px-2.5 py-2.5 text-xs rounded-xl border ${
                      errors.age ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
                {errors.age && <p className="text-[11px] text-red-600 mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-1.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {errors.dob && (
                <div className="col-span-3">
                  <p className="text-[11px] text-red-600">{errors.dob}</p>
                </div>
              )}
            </div>

            {/* 4. Residential Address (Multi-line) */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address (Multi-line) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows="2"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, house / apartment number, area, city, pincode"
                  className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border ${
                    errors.address ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
              {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address}</p>}
            </div>

          </div>
        </div>

        {/* Section 2: Optional Profile & Clinical Notes */}
        <div className="p-6 bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">2</span>
              Optional Profile & Intake Notes
            </h2>
            <span className="text-[11px] text-slate-400">Non-blocking fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Occupation</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="e.g. Teacher, Engineer, Homemaker"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact</label>
              <div className="relative">
                <HeartHandshake className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Name & Contact e.g. Spouse +91..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Presenting Complaint / Chief Problem (Staff intake note)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows="2"
                  value={formData.medicalHistoryNotes}
                  onChange={(e) => setFormData({ ...formData, medicalHistoryNotes: e.target.value })}
                  placeholder="Brief summary of symptoms or reason for visit (e.g. Severe acidity, headache since 3 days)"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            {/* WhatsApp Consent */}
            <div className="sm:col-span-2 lg:col-span-3 pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentWhatsApp}
                  onChange={(e) => setFormData({ ...formData, consentWhatsApp: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Patient consents to receive prescription PDF and follow-up reminders via WhatsApp (Aisensy integration).
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            Clear Form
          </button>

          <button
            type="button"
            onClick={handleSaveOnly}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Patient Profile</span>
          </button>

          <button
            type="submit"
            onClick={handleSaveAndAddToQueue}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Save & Add to Live Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
}
