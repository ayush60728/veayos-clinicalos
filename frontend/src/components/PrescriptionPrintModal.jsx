import React, { useState } from 'react';
import { Printer, Download, X, Share2, CheckCircle, FileText, Check, Settings2 } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function PrescriptionPrintModal({ 
  prescription, 
  patient, 
  onClose, 
  onSendWhatsApp 
}) {
  const clinic = storageService.getClinicSettings();
  // Options: 'preprinted_stationery' (leaves 80mm 100% blank) | 'custom_image' | 'digital_header'
  const [stationeryMode, setStationeryMode] = useState(
    clinic.letterpadHeaderImage ? 'custom_image' : 'preprinted_stationery'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-300">
        
        {/* Action Header (Hidden during print) */}
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold">Print & Letterpad Preview</h2>
              <p className="text-[11px] text-slate-400">
                Top 8 cm (80mm) strictly reserved for physical letterhead or uploaded banner.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stationery Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStationeryMode('preprinted_stationery')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stationeryMode === 'preprinted_stationery' 
                    ? 'bg-teal-600 text-white font-bold shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Keep top 8cm completely blank for physical clinic letterhead paper"
              >
                Pre-printed Letterpad (8cm Blank)
              </button>

              <button
                type="button"
                onClick={() => setStationeryMode(clinic.letterpadHeaderImage ? 'custom_image' : 'digital_header')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stationeryMode !== 'preprinted_stationery' 
                    ? 'bg-teal-600 text-white font-bold shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Use uploaded banner image or clinic digital letterhead"
              >
                {clinic.letterpadHeaderImage ? 'Uploaded Banner' : 'Digital Letterhead'}
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            {onSendWhatsApp && (
              <button
                onClick={() => onSendWhatsApp(prescription)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Body Container */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center">
          
          <div 
            id="printable-prescription-area" 
            className="bg-white text-slate-900 shadow-md sm:shadow-lg w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 font-sans relative border border-slate-200"
          >
            {/* === 1. TOP 8 CM (80mm) LETTERPAD RESERVED AREA === */}
            <div className={`letterpad-reserved-space w-full mb-6 relative flex flex-col justify-end ${
              stationeryMode === 'preprinted_stationery' 
                ? 'letterpad-preprinted-blank' 
                : 'border-b-2 border-teal-800/20 pb-2'
            }`}>
              {stationeryMode === 'preprinted_stationery' ? (
                /* Strictly Blank for physical doctor's letterhead paper */
                <div className="no-print letterpad-preview-only h-full w-full border-2 border-dashed border-teal-300/80 rounded-xl bg-teal-50/30 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block">
                    [ 8.0 cm (80mm) Reserved Doctor Letterpad Zone ]
                  </span>
                  <p className="text-[11px] text-teal-700/80 mt-1 max-w-md">
                    This area is kept 100% empty on print so your clinic letterhead paper feeds cleanly.
                  </p>
                </div>
              ) : clinic.letterpadHeaderImage && stationeryMode === 'custom_image' ? (
                <img 
                  src={clinic.letterpadHeaderImage} 
                  alt="Doctor Letterpad Header" 
                  className="w-full h-full object-contain object-top"
                />
              ) : (
                /* Digital Clinical Letterhead with Official Company Logo */
                <div className="h-full flex flex-col justify-between pt-2">
                  <div className="flex justify-between items-start border-b border-teal-700/30 pb-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 shrink-0 shadow-2xs flex items-center justify-center">
                        <img src="/logo.png" alt="VEAYOS Company Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h1 className="text-xl font-black tracking-tight text-teal-900">{clinic.clinicName}</h1>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{prescription.doctorName || clinic.doctorName}</div>
                        <div className="text-[11px] text-teal-800 font-medium">{clinic.qualifications}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Reg No: {prescription.doctorRegNo || clinic.regNo}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                      <div className="font-semibold text-slate-800">Homoeopathy Clinical Centre</div>
                      <div>{clinic.phone}</div>
                      <div className="max-w-[220px] text-[10px] leading-tight text-slate-500">{clinic.address}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-teal-700/80 uppercase tracking-widest text-center py-1 no-print letterpad-preview-only">
                    [ 8.0 cm Reserved Doctor Letterpad Zone ]
                  </div>
                </div>
              )}
            </div>

            {/* === 2. PATIENT & VISIT METADATA (Strictly below the 8 cm mark) === */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{patient?.name || prescription.patientName}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Age / Gender</span>
                <span className="font-semibold text-slate-800">{patient?.age || '—'} Yrs / {patient?.gender || '—'}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Contact Phone</span>
                <span className="font-mono text-slate-800">{patient?.phone || '—'}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Date & Rx ID</span>
                <span className="font-mono font-bold text-teal-800">{prescription.date || new Date().toISOString().split('T')[0]} • {prescription.id}</span>
              </div>
            </div>

            {/* Diagnosis & Totality Summary */}
            {(prescription.diagnosis || prescription.symptoms) && (
              <div className="mb-5 border-b border-slate-100 pb-4">
                {prescription.diagnosis && (
                  <div className="mb-2">
                    <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">Clinical Assessment / Diagnosis:</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{prescription.diagnosis}</p>
                  </div>
                )}
                {prescription.symptoms && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Presenting Totality / Kentian Rubrics:</span>
                    <p className="text-xs text-slate-600 mt-0.5 italic">{prescription.symptoms}</p>
                  </div>
                )}
              </div>
            )}

            {/* === 3. HOMOEOPATHIC RX MEDICINES === */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif italic font-extrabold text-2xl text-teal-800">℞</span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prescribed Homoeopathic Remedies</span>
              </div>

              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-200">Remedy & Potency</th>
                    <th className="p-2 border-r border-slate-200">Dosage</th>
                    <th className="p-2 border-r border-slate-200">Frequency</th>
                    <th className="p-2 border-r border-slate-200">Duration</th>
                    <th className="p-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(prescription.medicines || []).map((med, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-teal-900 border-r border-slate-200">{med.remedy}</td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{med.dosage}</td>
                      <td className="p-2.5 font-semibold text-slate-800 border-r border-slate-200">{med.frequency}</td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{med.duration}</td>
                      <td className="p-2.5 text-slate-600 italic">{med.instructions || 'Dissolve in clean mouth'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Prescribed Tests (if any) */}
            {prescription.tests && prescription.tests.length > 0 && (
              <div className="mb-5 bg-teal-50/50 border border-teal-200/60 rounded-xl p-3">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                  🧪 Diagnostic Tests Prescribed:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-800 space-y-1">
                  {prescription.tests.map((t, idx) => (
                    <li key={idx}>
                      <strong className="font-semibold">{t.testName}</strong> {t.instructions && `(${t.instructions})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Regimen Advice */}
            {prescription.advice && (
              <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  Lifestyle & Dietary Regimen Advice:
                </span>
                <p className="text-slate-700 leading-relaxed">{prescription.advice}</p>
              </div>
            )}

            {/* Follow-up Date */}
            {prescription.followUpDate && (
              <div className="mb-8 flex items-center justify-between p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold">
                <span>Next Scheduled Follow-up Review:</span>
                <span className="font-bold font-mono text-sm">{prescription.followUpDate}</span>
              </div>
            )}

            {/* === 4. DOCTOR SIGNATURE / STAMP ZONE (Bottom) === */}
            <div className="mt-12 pt-4 border-t border-slate-200 flex items-end justify-between text-xs">
              <div className="text-[10px] text-slate-400 max-w-xs leading-tight">
                {clinic.disclaimer}
              </div>

              <div className="text-right">
                {clinic.signatureStampImage ? (
                  <img 
                    src={clinic.signatureStampImage} 
                    alt="Doctor Stamp & Signature" 
                    className="h-16 ml-auto mb-1 object-contain"
                  />
                ) : (
                  <div className="h-12 border-b border-dashed border-slate-400 w-44 ml-auto mb-1 flex items-end justify-center pb-1 text-slate-400 italic font-serif">
                    {prescription.doctorName || clinic.doctorName}
                  </div>
                )}
                <div className="font-bold text-slate-900">{prescription.doctorName || clinic.doctorName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{prescription.doctorRegNo || clinic.regNo}</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
